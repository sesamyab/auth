import { Env, Var, userSchema } from "../../types";
import { HTTPException } from "hono/http-exception";
import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { enrichUser } from "../../utils/enrichUser";

export const userinfo = new OpenAPIHono<{ Bindings: Env; Variables: Var }>()
  // --------------------------------
  // GET /userinfo
  // --------------------------------
  .openapi(
    createRoute({
      tags: ["oauth2"],
      method: "get",
      path: "/",
      request: {},
      security: [
        {
          Bearer: ["profile"],
        },
      ],
      responses: {
        200: {
          content: {
            "application/json": {
              schema: userSchema,
            },
          },
          description: "Redirect to the client's redirect uri",
        },
      },
    }),
    async (ctx) => {
      console.log("ctx.var.user", ctx.var.user);

      if (!ctx.var.user) {
        throw new HTTPException(403, { message: "Unauthorized" });
      }

      const user = await ctx.env.data.users.get(
        ctx.var.user.azp,
        ctx.var.user.sub,
      );

      console.log("user", user);

      if (!user) {
        throw new HTTPException(403, { message: "Unauthorized" });
      }

      const enrichedUser = await enrichUser(ctx.env, ctx.var.user.azp, user);

      // TODO: Sort out the user entities once we are off tsoa
      return ctx.json(userSchema.parse(enrichedUser));
    },
  );
