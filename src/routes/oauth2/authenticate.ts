import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { nanoid } from "nanoid";
import randomString from "../../utils/random-string";
import { Env, Var } from "../../types";
import { HTTPException } from "hono/http-exception";
import { getClient } from "../../services/clients";
import { loginWithPassword } from "../../authentication-flows/password";
import { Login } from "authhero";

function createUnauthorizedResponse() {
  return new HTTPException(403, {
    res: new Response(
      JSON.stringify({
        error: "access_denied",
        error_description: "Wrong email or verification code.",
      }),
      {
        status: 403, // without this it returns a 200
        headers: {
          "Content-Type": "application/json",
        },
      },
    ),
    message: "Wrong email or verification code.",
  });
}

const TICKET_EXPIRATION_TIME = 30 * 60 * 1000;

export const authenticateRoutes = new OpenAPIHono<{
  Bindings: Env;
  Variables: Var;
}>()
  // --------------------------------
  // POST /co/authenticate
  // --------------------------------
  .openapi(
    createRoute({
      tags: ["oauth"],
      method: "post",
      path: "/",
      request: {
        body: {
          content: {
            "application/json": {
              schema: z.object({
                credential_type: z.enum([
                  "http://auth0.com/oauth/grant-type/passwordless/otp",
                  "http://auth0.com/oauth/grant-type/password-realm",
                ]),
                otp: z.string().optional(),
                client_id: z.string(),
                username: z.string().transform((v) => v.toLowerCase()),
                password: z.string().optional(),
                realm: z.enum(["email", "Username-Password-Authentication"]),
                scope: z.string().optional(),
              }),
            },
          },
        },
      },
      responses: {
        200: {
          description: "List of tenants",
        },
      },
    }),
    async (ctx) => {
      const { client_id, username, otp, password } = ctx.req.valid("json");
      ctx.set("userName", username);
      const client = await getClient(ctx.env, client_id);
      ctx.set("client_id", client_id);

      const email = username.toLocaleLowerCase();

      let loginSession: Login;

      if (otp) {
        const code = await ctx.env.data.codes.get(client.tenant.id, otp, "otp");
        if (!code) {
          throw createUnauthorizedResponse();
        }

        const existingLoginSession = await ctx.env.data.logins.get(
          client.tenant.id,
          code.login_id,
        );
        if (
          !existingLoginSession ||
          existingLoginSession.authParams.username !== email
        ) {
          throw createUnauthorizedResponse();
        }

        if (existingLoginSession.authParams.username !== email) {
          throw createUnauthorizedResponse();
        }

        loginSession = existingLoginSession;
      } else if (password) {
        // This will throw if the login fails
        await loginWithPassword(ctx, client, {
          username,
          password,
          client_id,
        });

        loginSession = await ctx.env.data.logins.create(client.tenant.id, {
          expires_at: new Date(
            Date.now() + TICKET_EXPIRATION_TIME,
          ).toISOString(),
          authParams: {
            client_id: client.id,
            username: email,
          },
        });
      } else {
        throw new HTTPException(400, { message: "Code or password required" });
      }

      const code = await ctx.env.data.codes.create(client.tenant.id, {
        code_id: nanoid(),
        code_type: "ticket",
        login_id: loginSession.login_id,
        expires_at: new Date(Date.now() + TICKET_EXPIRATION_TIME).toISOString(),
      });

      return ctx.json({
        login_ticket: code.code_id,
        // TODO: I guess these should be validated when accepting the ticket
        co_verifier: randomString(32),
        co_id: randomString(12),
      });
    },
  );
