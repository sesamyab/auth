import { Env, Var } from "../../types";
import { getClient } from "../../services/clients";
import { getAuthCookie, clearAuthCookie } from "../../services/cookies";
import { validateRedirectUrl } from "../../utils/validate-redirect-url";
import { HTTPException } from "hono/http-exception";
import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { createLogMessage } from "../../utils/create-log-message";
import { LogTypes } from "@authhero/adapter-interfaces";

export const logoutRoutes = new OpenAPIHono<{ Bindings: Env; Variables: Var }>()
  // --------------------------------
  // GET /logout
  // --------------------------------
  .openapi(
    createRoute({
      tags: ["oauth2"],
      method: "get",
      path: "/",
      request: {
        query: z.object({
          client_id: z.string(),
          returnTo: z.string().optional(),
        }),
        header: z.object({
          cookie: z.string().optional(),
        }),
      },
      responses: {
        302: {
          description: "Log the user out",
        },
      },
    }),
    async (ctx) => {
      const { client_id, returnTo } = ctx.req.valid("query");

      const client = await getClient(ctx.env, client_id);
      ctx.set("client_id", client_id);

      const redirectUri = returnTo || ctx.req.header("referer");
      if (!redirectUri) {
        throw new Error("No return to url found");
      }
      if (!validateRedirectUrl(client.allowed_logout_urls || [], redirectUri)) {
        throw new HTTPException(403, {
          message: `Invalid logout URI - ${redirectUri}`,
        });
      }

      const cookie = ctx.req.header("cookie");

      if (cookie) {
        const tokenState = getAuthCookie(client.tenant.id, cookie);
        if (tokenState) {
          const session = await ctx.env.data.sessions.get(
            client.tenant.id,
            tokenState,
          );
          if (session) {
            const user = await ctx.env.data.users.get(
              client.tenant.id,
              session.user_id,
            );
            if (user) {
              ctx.set("userName", user.email);
              ctx.set("userId", user.user_id);
              ctx.set("connection", user.connection);
            }
          }
          await ctx.env.data.sessions.remove(client.tenant.id, tokenState);
        }
      }
      const log = createLogMessage(ctx, {
        type: LogTypes.SUCCESS_LOGOUT,
        description: "User successfully logged out",
      });

      await ctx.env.data.logs.create(client.tenant.id, log);

      return new Response("Redirecting", {
        status: 302,
        headers: {
          "set-cookie": clearAuthCookie(client.tenant.id),
          location: redirectUri,
        },
      });
    },
  );
