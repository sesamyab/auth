import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { nanoid } from "nanoid";
import { getDbFromEnv } from "../../services/db";
import { executeQuery } from "../../helpers/sql";
import { ConnectionSchema, Env, connectionInsertSchema } from "../../types";
import { HTTPException } from "hono/http-exception";

export const connections = new OpenAPIHono<{ Bindings: Env }>()
  // --------------------------------
  // GET /connections
  // --------------------------------
  .openapi(
    createRoute({
      tags: ["connections"],
      method: "get",
      path: "/",
      request: {
        headers: z.object({
          tenant_id: z.string(),
          range: z.string().optional(),
        }),
      },
      security: [
        {
          Bearer: [],
        },
      ],
      responses: {
        200: {
          content: {
            "connection/json": {
              schema: z.array(ConnectionSchema),
            },
          },
          description: "List of connections",
        },
      },
    }),
    async (ctx) => {
      const { tenant_id, range: rangeRequest } = ctx.req.valid("header");

      const db = getDbFromEnv(ctx.env);
      const query = db
        .selectFrom("connections")
        .where("connections.tenant_id", "=", tenant_id);

      const { data, range } = await executeQuery(query, rangeRequest);

      const headers = new Headers();
      if (range) {
        headers.set("content-range", range);
      }

      return ctx.json(z.array(ConnectionSchema).parse(data), {
        headers,
      });
    },
  )
  // --------------------------------
  // GET /connections/:id
  // --------------------------------
  .openapi(
    createRoute({
      tags: ["connections"],
      method: "get",
      path: "/{id}",
      request: {
        params: z.object({
          id: z.string(),
        }),
        headers: z.object({
          tenant_id: z.string(),
        }),
      },
      security: [
        {
          Bearer: [],
        },
      ],
      responses: {
        200: {
          content: {
            "connection/json": {
              schema: ConnectionSchema,
            },
          },
          description: "A connection",
        },
      },
    }),
    async (ctx) => {
      const { tenant_id } = ctx.req.valid("header");
      const { id } = ctx.req.valid("param");

      const db = getDbFromEnv(ctx.env);
      const connection = await db
        .selectFrom("connections")
        .where("connections.tenant_id", "=", tenant_id)
        .where("connections.id", "=", id)
        .selectAll()
        .executeTakeFirst();

      if (!connection) {
        throw new HTTPException(404);
      }

      return ctx.json(ConnectionSchema.parse(connection));
    },
  )
  // --------------------------------
  // DELETE /connections/:id
  // --------------------------------
  .openapi(
    createRoute({
      tags: ["connections"],
      method: "delete",
      path: "/{id}",
      request: {
        params: z.object({
          id: z.string(),
        }),
        headers: z.object({
          tenant_id: z.string(),
        }),
      },
      security: [
        {
          Bearer: [],
        },
      ],
      responses: {
        200: {
          description: "Status",
        },
      },
    }),
    async (ctx) => {
      const { tenant_id } = ctx.req.valid("header");
      const { id } = ctx.req.valid("param");

      const db = getDbFromEnv(ctx.env);
      await db
        .deleteFrom("connections")
        .where("connections.tenant_id", "=", tenant_id)
        .where("connections.id", "=", id)
        .execute();

      return ctx.text("OK");
    },
  )
  // --------------------------------
  // PATCH /connections/:id
  // --------------------------------
  .openapi(
    createRoute({
      tags: ["connections"],
      method: "patch",
      path: "/{id}",
      request: {
        body: {
          content: {
            "application/json": {
              schema: connectionInsertSchema.partial(),
            },
          },
        },
        params: z.object({
          id: z.string(),
        }),
        headers: z.object({
          tenant_id: z.string(),
        }),
      },
      security: [
        {
          Bearer: [],
        },
      ],
      responses: {
        200: {
          description: "Status",
        },
      },
    }),
    async (ctx) => {
      const { tenant_id } = ctx.req.valid("header");
      const { id } = ctx.req.valid("param");
      const body = ctx.req.valid("json");

      const db = getDbFromEnv(ctx.env);
      const connection = {
        ...body,
        tenant_id,
        updated_at: new Date().toISOString(),
      };

      const results = await db
        .updateTable("connections")
        .set(connection)
        .where("id", "=", id)
        .execute();

      return ctx.text(results[0].numUpdatedRows.toString());
    },
  )
  // --------------------------------
  // POST /connections
  // --------------------------------
  .openapi(
    createRoute({
      tags: ["connections"],
      method: "post",
      path: "/",
      request: {
        body: {
          content: {
            "application/json": {
              schema: connectionInsertSchema,
            },
          },
        },
        headers: z.object({
          tenant_id: z.string(),
        }),
      },
      security: [
        {
          Bearer: [],
        },
      ],
      responses: {
        200: {
          content: {
            "connection/json": {
              schema: ConnectionSchema,
            },
          },
          description: "An connection",
        },
      },
    }),
    async (ctx) => {
      const { tenant_id } = ctx.req.valid("header");
      const body = ctx.req.valid("json");

      const connection = await ctx.env.data.connections.create(tenant_id, {
        ...body,
        id: nanoid(),
        client_secret: body.client_secret || nanoid(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      return ctx.json(connection);
    },
  )
  // --------------------------------
  // PUT /connections/:id
  // --------------------------------
  .openapi(
    createRoute({
      tags: ["connections"],
      method: "put",
      path: "/{:id}",
      request: {
        body: {
          content: {
            "application/json": {
              schema: connectionInsertSchema,
            },
          },
        },
        params: z.object({
          id: z.string(),
        }),
        headers: z.object({
          tenant_id: z.string(),
        }),
      },
      security: [
        {
          Bearer: [],
        },
      ],
      responses: {
        200: {
          content: {
            "connection/json": {
              schema: ConnectionSchema,
            },
          },
          description: "An connection",
        },
      },
    }),
    async (ctx) => {
      const { tenant_id } = ctx.req.valid("header");
      const { id } = ctx.req.valid("param");
      const body = ctx.req.valid("json");

      const connection = {
        ...body,
        tenant_id,
        id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const db = getDbFromEnv(ctx.env);

      try {
        await db.insertInto("connections").values(connection).execute();
      } catch (err: any) {
        if (!err.message.includes("AlreadyExists")) {
          throw err;
        }

        const {
          id,
          created_at,
          tenant_id: tenantId,
          ...connectionUpdate
        } = connection;
        await db
          .updateTable("connections")
          .set(connectionUpdate)
          .where("id", "=", connection.id)
          .execute();
      }

      return ctx.json(connection);
    },
  );
