import {
  DataAdapters,
  Hook,
  LogTypes,
  User,
} from "@authhero/adapter-interfaces";
import { createLogMessage } from "../utils/create-log-message";
import { Context } from "hono";
import { Var, Env, hookResponseSchema } from "../types";
import { HTTPException } from "hono/http-exception";
import { waitUntil } from "../utils/wait-until";
import { pemToBuffer } from "../utils/jwt";
import { createJWT } from "oslo/jwt";
import { TimeSpan } from "oslo";
import { z } from "zod";

async function createHookToken(
  ctx: Context<{ Bindings: Env; Variables: Var }>,
  trigger_id: string,
) {
  const { env } = ctx;

  const certificates = await env.data.keys.list();
  const certificate = certificates[certificates.length - 1];

  const keyBuffer = pemToBuffer(certificate.pkcs7!);

  return createJWT(
    "RS256",
    keyBuffer,
    {
      aud: env.ISSUER,
      scope: "webhook",
      sub: "auth",
      iss: env.ISSUER,
      tenant_id: ctx.var.tenant_id,
      trigger_id,
    },
    {
      includeIssuedTimestamp: true,
      expiresIn: new TimeSpan(1, "m"),
      headers: {
        kid: certificate.kid,
      },
    },
  );
}

async function invokeHook(
  ctx: Context<{ Bindings: Env; Variables: Var }>,
  hook: Hook,
  payload: any,
) {
  const token = await createHookToken(ctx, payload.trigger_id);

  const response = await fetch(hook.url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const log = createLogMessage(ctx, {
      type: LogTypes.FAILED_HOOK,
      description: `Failed webhook invocation for ${payload.trigger_id}: ${hook.url}`,
    });

    await ctx.env.data.logs.create(ctx.var.tenant_id || "", log);
  }

  if (response.headers.get("content-type")?.startsWith("application/json")) {
    const body = await response.json();
    let hookResponse: z.infer<typeof hookResponseSchema> | undefined;
    try {
      hookResponse = hookResponseSchema.parse(body);
    } catch (e: any) {
      const log = createLogMessage(ctx, {
        type: LogTypes.FAILED_HOOK,
        description: "Invalid webhook response format",
      });

      await ctx.env.data.logs.create(ctx.var.tenant_id || "", log);
    }

    if (hookResponse?.status === "fail") {
      const log = createLogMessage(ctx, {
        type: LogTypes.FAILED_HOOK,
        description: "Failed by webhook",
      });

      await ctx.env.data.logs.create(ctx.var.tenant_id || "", log);

      throw new HTTPException(400, {
        message: hookResponse.message,
      });
    }
  }
}

async function invokeHooks(
  ctx: Context<{ Bindings: Env; Variables: Var }>,
  hooks: Hook[],
  payload: any,
) {
  const enabledHooks = hooks.filter((hook) => hook.enabled);
  enabledHooks.sort(({ priority: a = 0 }, { priority: b = 0 }) => b - a);
  for await (const hook of enabledHooks) {
    if (hook.synchronous) {
      await invokeHook(ctx, hook, payload);
    } else {
      waitUntil(ctx, invokeHook(ctx, hook, payload));
    }
  }
}

export function postUserRegistrationWebhook(
  ctx: Context<{ Bindings: Env; Variables: Var }>,
  data: DataAdapters,
) {
  return async (tenant_id: string, user: User): Promise<User> => {
    const { hooks } = await data.hooks.list(tenant_id, {
      q: "trigger_id:post-user-registration",
      page: 0,
      per_page: 100,
      include_totals: false,
    });

    await invokeHooks(ctx, hooks, {
      tenant_id,
      client_id: ctx.var.client_id,
      user,
      trigger_id: "post-user-registration",
    });

    return user;
  };
}

export function preUserSignupWebhook(
  ctx: Context<{ Bindings: Env; Variables: Var }>,
  data: DataAdapters,
) {
  return async (tenant_id: string, email: string): Promise<void> => {
    const { hooks } = await data.hooks.list(tenant_id, {
      q: "trigger_id:pre-user-signup",
      page: 0,
      per_page: 100,
      include_totals: false,
    });

    await invokeHooks(ctx, hooks, {
      tenant_id,
      email,
      trigger_id: "pre-user-signup",
    });
  };
}

export function postUserLoginWebhook(
  ctx: Context<{ Bindings: Env; Variables: Var }>,
  data: DataAdapters,
) {
  return async (tenant_id: string, user: User): Promise<User> => {
    const { hooks } = await data.hooks.list(tenant_id, {
      q: "trigger_id:post-user-login",
      page: 0,
      per_page: 100,
      include_totals: false,
    });

    await invokeHooks(ctx, hooks, {
      tenant_id,
      user,
      trigger_id: "post-user-login",
    });

    return user;
  };
}
