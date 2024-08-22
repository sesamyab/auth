import { nanoid } from "nanoid";
import generateOTP from "../../utils/otp";
import { getClient } from "../../services/clients";
import { sendCode, sendLink } from "../../controllers/email";
import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { Env, Var } from "../../types";
import { HTTPException } from "hono/http-exception";
import { validateCode } from "../../authentication-flows/passwordless";
import { validateRedirectUrl } from "../../utils/validate-redirect-url";
import { generateAuthResponse } from "../../helpers/generate-auth-response";
import { setSearchParams } from "../../utils/url";
import {
  AuthParams,
  AuthorizationResponseType,
  authParamsSchema,
} from "@authhero/adapter-interfaces";

const OTP_EXPIRATION_TIME = 30 * 60 * 1000;

export const passwordlessRoutes = new OpenAPIHono<{
  Bindings: Env;
  Variables: Var;
}>()
  // --------------------------------
  // POST /passwordless/start
  // --------------------------------
  .openapi(
    createRoute({
      tags: ["passwordless"],
      method: "post",
      path: "/start",
      request: {
        body: {
          content: {
            "application/json": {
              schema: z.object({
                client_id: z.string(),
                client_secret: z.string().optional(),
                connection: z.string(),
                email: z.string().transform((u) => u.toLowerCase()),
                send: z.enum(["link", "code"]),
                authParams: authParamsSchema.omit({ client_id: true }),
              }),
            },
          },
        },
      },
      responses: {
        200: {
          description: "Status",
        },
      },
    }),
    async (ctx) => {
      const body = ctx.req.valid("json");
      const { env } = ctx;
      const { client_id, email, send, authParams } = body;
      const client = await getClient(env, client_id);

      const login = await env.data.logins.create(client.tenant.id, {
        authParams: { ...authParams, client_id, username: email },
        expires_at: new Date(Date.now() + OTP_EXPIRATION_TIME).toISOString(),
      });

      const code = await env.data.codes.create(client.tenant.id, {
        code_id: generateOTP(),
        code_type: "otp",
        login_id: login.login_id,
        expires_at: new Date(Date.now() + OTP_EXPIRATION_TIME).toISOString(),
      });

      if (send === "link") {
        await sendLink(ctx, client, email, code.code_id, {
          ...authParams,
          client_id,
        });
      } else {
        await sendCode(ctx, client, email, code.code_id);
      }

      return ctx.html("OK");
    },
  )
  // --------------------------------
  // GET /passwordless/verify_redirect
  // --------------------------------
  .openapi(
    createRoute({
      tags: ["passwordless"],
      method: "get",
      path: "/verify_redirect",
      request: {
        query: z.object({
          scope: z.string(),
          response_type: z.nativeEnum(AuthorizationResponseType),
          redirect_uri: z.string(),
          state: z.string(),
          nonce: z.string().optional(),
          verification_code: z.string(),
          connection: z.string(),
          client_id: z.string(),
          email: z.string().transform((u) => u.toLowerCase()),
          audience: z.string().optional(),
        }),
      },
      responses: {
        302: {
          description: "Status",
        },
      },
    }),
    async (ctx) => {
      const { env } = ctx;
      const {
        client_id,
        email,
        verification_code,
        redirect_uri,
        state,
        scope,
        audience,
        response_type,
        nonce,
      } = ctx.req.valid("query");
      const client = await getClient(env, client_id);

      try {
        const user = await validateCode(ctx, {
          client_id,
          email,
          otp: verification_code,
          ip: ctx.req.header("x-real-ip"),
        });

        if (!validateRedirectUrl(client.callbacks, redirect_uri)) {
          throw new HTTPException(400, {
            message: `Invalid redirect URI - ${redirect_uri}`,
          });
        }

        const authParams: AuthParams = {
          client_id,
          redirect_uri,
          state,
          nonce,
          scope,
          audience,
          response_type,
        };

        return generateAuthResponse({
          ctx,
          client,
          user,
          authParams,
        });
      } catch (e: any) {
        const redirectUrl = new URL(redirect_uri);
        redirectUrl.searchParams.set("error", e.message);
        redirectUrl.searchParams.set("state", state);
        return ctx.redirect(redirectUrl.toString());
      }
    },
  );
