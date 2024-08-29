import {
  Client,
  DataAdapters,
  LogTypes,
  User,
} from "@authhero/adapter-interfaces";
import { linkUsersHook } from "./link-users";
import { postUserRegistrationWebhook, preUserSignupWebhook } from "./webhooks";
import { Context } from "hono";
import { Env, Var } from "../types";
import { HTTPException } from "hono/http-exception";
import { createLogMessage } from "../utils/create-log-message";
import { waitUntil } from "../utils/wait-until";
import { getPrimaryUserByEmail } from "../utils/users";

function createUserHooks(
  ctx: Context<{ Bindings: Env; Variables: Var }>,
  data: DataAdapters,
) {
  return async (tenant_id: string, user: User) => {
    // Check for existing user with the same email and if so link the users
    let result = await linkUsersHook(data)(tenant_id, user);
    // Invoke post-user-registration webhooks
    await postUserRegistrationWebhook(ctx, data)(tenant_id, result);

    // Set the userId in the context
    ctx.set("userId", result.user_id);

    const log = createLogMessage(ctx, {
      type: LogTypes.SUCCESS_SIGNUP,
      description: "Successful signup",
    });
    waitUntil(ctx, ctx.env.data.logs.create(ctx.var.tenant_id!, log));

    return result;
  };
}

export async function preUserSignupHook(
  ctx: Context<{ Bindings: Env; Variables: Var }>,
  client: Client,
  data: DataAdapters,
  email: string,
) {
  // Check the disabled flag on the client
  if (client.disable_sign_ups) {
    // If there is another user with the same email, allow the signup as they will be linked together
    const existingUser = await getPrimaryUserByEmail({
      userAdapter: ctx.env.data.users,
      tenant_id: client.tenant.id,
      email,
    });

    if (!existingUser) {
      const log = createLogMessage(ctx, {
        type: LogTypes.FAILED_SIGNUP,
        description: "Public signup is disabled",
      });
      await ctx.env.data.logs.create(client.tenant.id, log);

      throw new HTTPException(400, {
        message: "Signups are disabled for this client",
      });
    }
  }

  await preUserSignupWebhook(ctx, data)(ctx.var.tenant_id || "", email);
}

export function addDataHooks(
  ctx: Context<{ Bindings: Env; Variables: Var }>,
  data: DataAdapters,
): DataAdapters {
  return {
    ...data,
    users: { ...data.users, create: createUserHooks(ctx, data) },
  };
}
