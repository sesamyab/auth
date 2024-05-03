import { enrichUser } from "../../utils/enrichUser";
import { getUsersByEmail } from "../../utils/users";
import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { Env, auth0UserResponseSchema } from "../../types";
import { Var } from "../../types/Var";
import authenticationMiddleware from "../../middlewares/authentication";

export const usersByEmail = new OpenAPIHono<{ Bindings: Env; Variables: Var }>()
  // --------------------------------
  // GET /api/v2/users-by-email
  // --------------------------------
  .openapi(
    createRoute({
      tags: ["users"],
      method: "get",
      path: "/",
      request: {
        query: z.object({
          email: z.string(),
        }),
        headers: z.object({
          "tenant-id": z.string(),
        }),
      },
      middleware: [authenticationMiddleware({ scopes: ["auth:read"] })],
      security: [
        {
          Bearer: ["auth:read"],
        },
      ],
      responses: {
        200: {
          content: {
            "application/json": {
              schema: z.array(auth0UserResponseSchema),
            },
          },
          description: "List of users",
        },
      },
    }),
    async (ctx) => {
      const { "tenant-id": tenant_id } = ctx.req.valid("header");
      const { email } = ctx.req.valid("query");
      const users = await getUsersByEmail(ctx.env.data.users, tenant_id, email);

      const primarySqlUsers = users.filter((user) => !user.linked_to);

      const response = await Promise.all(
        primarySqlUsers.map((primarySqlUser) => {
          return enrichUser(ctx.env, tenant_id, primarySqlUser);
        }),
      );
      return ctx.json(response);
    },
  );
