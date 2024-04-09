import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { Env, baseUserSchema, Var } from "../../types";
import { HTTPException } from "hono/http-exception";

export const userinfo = new OpenAPIHono<{ Bindings: Env; Variables: Var }>()
  // --------------------------------
  // GET /userinfo
  // --------------------------------
  .openapi(
    createRoute({
      tags: ["userinfo"],
      method: "get",
      path: "/",
      request: {},
      responses: {
        200: {
          content: {
            "application/json": {
              schema: baseUserSchema,
            },
          },
          description: "List of tenants",
        },
      },
    }),
    async (ctx) => {
      if (!ctx.var.user) {
        throw new HTTPException(403, { message: "Unauthorized" });
      }
      if (!ctx.var.userId) {
        throw new HTTPException(403, { message: "Unauthorized" });
      }

      const user = await ctx.env.data.users.get(
        ctx.var.user.azp,
        ctx.var.userId,
      );
      if (!user) {
        throw new HTTPException(404, { message: "User not found" });
      }

      return user;
    },
  );
