import { oauth2Callback } from "../../authentication-flows";
import { Env, Var } from "../../types";
import { HTTPException } from "hono/http-exception";
import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { setSearchParams } from "../../utils/url";

export const callbackRoutes = new OpenAPIHono<{
  Bindings: Env;
  Variables: Var;
}>()
  // --------------------------------
  // GET /callback
  // --------------------------------
  .openapi(
    createRoute({
      tags: ["oauth2"],
      method: "get",
      path: "/",
      request: {
        query: z.object({
          state: z.string(),
          code: z.string().optional(),
          scope: z.string().optional(),
          hd: z.string().optional(),
          error: z.string().optional(),
          error_description: z.string().optional(),
          error_code: z.string().optional(),
          error_reason: z.string().optional(),
        }),
      },
      responses: {
        302: {
          description: "Redirect to the client's redirect uri",
        },
      },
    }),
    async (ctx) => {
      const {
        state,
        code,
        error,
        error_description,
        error_code,
        error_reason,
      } = ctx.req.valid("query");

      const session = await ctx.env.data.logins.get(
        ctx.var.tenant_id || "",
        state,
      );

      if (!session) {
        throw new HTTPException(403, { message: "State not found" });
      }

      if (error) {
        const { redirect_uri } = session.authParams;

        if (!redirect_uri) {
          throw new HTTPException(400, { message: "Redirect uri not found" });
        }

        const redirectUri = new URL(redirect_uri);
        setSearchParams(redirectUri, {
          error,
          error_description,
          error_code,
          error_reason,
          state: session.authParams.state,
        });

        return ctx.redirect(redirectUri.href);
      }

      if (!code) {
        // The code is not present if there's an error, so this will not be reached
        throw new HTTPException(400, { message: "Code is required" });
      }

      return oauth2Callback({
        ctx,
        session,
        code,
      });
    },
  )
  // --------------------------------
  // POST /callback
  // --------------------------------
  .openapi(
    createRoute({
      tags: ["oauth2"],
      method: "post",
      path: "/",
      request: {
        body: {
          content: {
            "application/x-www-form-urlencoded": {
              schema: z.object({
                state: z.string(),
                code: z.string().optional(),
                scope: z.string().optional(),
                hd: z.string().optional(),
                error: z.string().optional(),
                error_description: z.string().optional(),
                error_code: z.string().optional(),
                error_reason: z.string().optional(),
              }),
            },
          },
        },
      },
      responses: {
        302: {
          description: "Redirect to the client's redirect uri",
        },
      },
    }),
    async (ctx) => {
      const {
        state,
        code,
        error,
        error_description,
        error_code,
        error_reason,
      } = ctx.req.valid("form");

      const session = await ctx.env.data.logins.get(
        ctx.var.tenant_id || "",
        state,
      );

      if (!session) {
        throw new HTTPException(400, { message: "Sesssion not found" });
      }

      if (error) {
        const { redirect_uri } = session.authParams;

        if (!redirect_uri) {
          throw new Error("Redirect uri not found");
        }

        const redirectUri = new URL(redirect_uri);

        setSearchParams(redirectUri, {
          error,
          error_description,
          error_code,
          error_reason,
          state: session.authParams.state,
        });

        return ctx.redirect(redirectUri.href);
      }

      if (code) {
        return oauth2Callback({
          ctx,
          session,
          code,
        });
      }

      throw new HTTPException(400, { message: "State and code are required" });
    },
  );
