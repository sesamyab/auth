import { Env } from "../../types";
import { createX509Certificate } from "../../helpers/encryption";
import { HTTPException } from "hono/http-exception";
import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import authenticationMiddleware from "../../middlewares/authentication";
import { signingKeySchema } from "@authhero/adapter-interfaces";

const DAY = 1000 * 60 * 60 * 24;

export const keyRoutes = new OpenAPIHono<{ Bindings: Env }>()
  // --------------------------------
  // GET /keys
  // --------------------------------
  .openapi(
    createRoute({
      tags: ["keys"],
      method: "get",
      path: "/signing",
      request: {
        headers: z.object({
          tenant_id: z.string(),
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
              schema: z.array(signingKeySchema),
            },
          },
          description: "List of keys",
        },
      },
    }),
    async (ctx) => {
      const keys = await ctx.env.data.keys.list();

      const signingKeys = keys
        .filter((key) => "cert" in key)
        .map((key) => {
          return key;
        });

      return ctx.json(signingKeys);
    },
  )
  // --------------------------------
  // GET /keys/signing/:kid
  // --------------------------------
  .openapi(
    createRoute({
      tags: ["keys"],
      method: "get",
      path: "/signing/{kid}",
      request: {
        headers: z.object({
          tenant_id: z.string(),
        }),
        params: z.object({
          kid: z.string(),
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
              schema: signingKeySchema,
            },
          },
          description: "A key",
        },
      },
    }),
    async (ctx) => {
      const { kid } = ctx.req.valid("param");

      const keys = await ctx.env.data.keys.list();
      const key = keys.find((k) => k.kid === kid);
      if (!key) {
        throw new HTTPException(404, { message: "Key not found" });
      }

      return ctx.json(key);
    },
  )
  // --------------------------------
  // POST /signing/rotate
  // --------------------------------
  .openapi(
    createRoute({
      tags: ["keys"],
      method: "post",
      path: "/signing/rotate",
      request: {
        headers: z.object({
          tenant_id: z.string(),
        }),
      },
      middleware: [authenticationMiddleware({ scopes: ["auth:write"] })],
      security: [
        {
          Bearer: ["auth:write"],
        },
      ],
      responses: {
        201: {
          description: "Status",
        },
      },
    }),
    async (ctx) => {
      const keys = await ctx.env.data.keys.list();
      for await (const key of keys) {
        await ctx.env.data.keys.update(key.kid, {
          revoked_at: new Date(Date.now() + DAY).toISOString(),
        });
      }

      const signingKey = await createX509Certificate({
        name: "CN=sesamy",
      });

      await ctx.env.data.keys.create(signingKey);

      return ctx.text("OK", { status: 201 });
    },
  )
  // --------------------------------
  // PUT /signing/:kid/revoke
  // --------------------------------
  .openapi(
    createRoute({
      tags: ["keys"],
      method: "put",
      path: "/signing/{kid}/revoke",
      request: {
        headers: z.object({
          tenant_id: z.string(),
        }),
        params: z.object({
          kid: z.string(),
        }),
      },
      middleware: [authenticationMiddleware({ scopes: ["auth:write"] })],
      security: [
        {
          Bearer: ["auth:write"],
        },
      ],
      responses: {
        201: {
          description: "Status",
        },
      },
    }),
    async (ctx) => {
      const { kid } = ctx.req.valid("param");

      const revoked = await ctx.env.data.keys.update(kid, {
        revoked_at: new Date().toISOString(),
      });
      if (!revoked) {
        throw new HTTPException(404, { message: "Key not found" });
      }

      const signingKey = await createX509Certificate({
        name: "CN=sesamy",
      });

      await ctx.env.data.keys.create(signingKey);

      return ctx.text("OK", { status: 201 });
    },
  );
