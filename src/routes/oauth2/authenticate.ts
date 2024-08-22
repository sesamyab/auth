import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { nanoid } from "nanoid";
import randomString from "../../utils/random-string";
import { Env, Var } from "../../types";
import { HTTPException } from "hono/http-exception";
import { getClient } from "../../services/clients";
import { loginWithPassword } from "../../authentication-flows/password";
import { Ticket } from "@authhero/adapter-interfaces";

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

      let ticket: Ticket = {
        id: nanoid(),
        tenant_id: client.tenant.id,
        client_id: client.id,
        email: email,
        created_at: new Date(),
        expires_at: new Date(Date.now() + TICKET_EXPIRATION_TIME),
      };

      if (otp) {
        const code = await ctx.env.data.codes.get(client.tenant.id, otp, "otp");
        if (!code) {
          throw createUnauthorizedResponse();
        }

        const loginSession = await ctx.env.data.logins.get(
          client.tenant.id,
          code.login_id,
        );
        if (!loginSession || loginSession.authParams.username !== email) {
          throw createUnauthorizedResponse();
        }

        if (loginSession.authParams.username !== email) {
          throw createUnauthorizedResponse();
        }

        // TODO: A temporary solution as the ticket doesn't have a username field. We should move the tickets over to the codes table instead
        const { username, ...authParams } = loginSession.authParams;
        ticket.authParams = authParams;
      } else if (password) {
        // This will throw if the login fails
        await loginWithPassword(ctx, client, {
          username,
          password,
          client_id,
        });
      } else {
        throw new HTTPException(400, { message: "Code or password required" });
      }

      await ctx.env.data.tickets.create(ticket);

      return ctx.json({
        login_ticket: ticket.id,
        // TODO: I guess these should be validated when accepting the ticket
        co_verifier: randomString(32),
        co_id: randomString(12),
      });
    },
  );
