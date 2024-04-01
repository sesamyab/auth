import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { nanoid } from "nanoid";
import { getDbFromEnv } from "../../services/db";
import { executeQuery } from "../../helpers/sql";
import { Env } from "../../types";
import { domainSchema, domainInsertSchema } from "../../types/Domain";
import { HTTPException } from "hono/http-exception";

export const domains = new OpenAPIHono<{ Bindings: Env }>()
  // --------------------------------
  // GET /domains
  // --------------------------------
  .openapi(
    createRoute({
      tags: ["domains"],
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
            "domain/json": {
              schema: z.array(domainSchema),
            },
          },
          description: "List of domains",
        },
      },
    }),
    async (ctx) => {
      const { tenant_id, range: rangeRequest } = ctx.req.valid("header");

      const db = getDbFromEnv(ctx.env);
      const query = db
        .selectFrom("domains")
        .where("domains.tenant_id", "=", tenant_id);

      const { data, range } = await executeQuery(query, rangeRequest);

      const headers = new Headers();
      if (range) {
        headers.set("content-range", range);
      }

      return ctx.json(z.array(domainSchema).parse(data), {
        headers,
      });
    },
  )
  // --------------------------------
  // GET /domains/:id
  // --------------------------------
  .openapi(
    createRoute({
      tags: ["domains"],
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
            "domain/json": {
              schema: domainSchema,
            },
          },
          description: "A domain",
        },
      },
    }),
    async (ctx) => {
      const { tenant_id } = ctx.req.valid("header");
      const { id } = ctx.req.valid("param");

      const db = getDbFromEnv(ctx.env);
      const domain = await db
        .selectFrom("domains")
        .where("domains.tenant_id", "=", tenant_id)
        .where("domains.id", "=", id)
        .selectAll()
        .executeTakeFirst();

      if (!domain) {
        throw new HTTPException(404);
      }

      return ctx.json(domainSchema.parse(domain));
    },
  )
  // --------------------------------
  // DELETE /domains/:id
  // --------------------------------
  .openapi(
    createRoute({
      tags: ["domains"],
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
        .deleteFrom("domains")
        .where("domains.tenant_id", "=", tenant_id)
        .where("domains.id", "=", id)
        .execute();

      return ctx.text("OK");
    },
  )
  // --------------------------------
  // PATCH /domains/:id
  // --------------------------------
  .openapi(
    createRoute({
      tags: ["domains"],
      method: "patch",
      path: "/{id}",
      request: {
        body: {
          content: {
            "application/json": {
              schema: domainInsertSchema.partial(),
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
      const domain = {
        ...body,
        tenant_id,
        updated_at: new Date().toISOString(),
      };

      const results = await db
        .updateTable("domains")
        .set(domain)
        .where("id", "=", id)
        .execute();

      return ctx.text(results[0].numUpdatedRows.toString());
    },
  )
  // --------------------------------
  // POST /domains
  // --------------------------------
  .openapi(
    createRoute({
      tags: ["domains"],
      method: "post",
      path: "/",
      request: {
        body: {
          content: {
            "application/json": {
              schema: domainInsertSchema,
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
            "domain/json": {
              schema: domainSchema,
            },
          },
          description: "An domain",
        },
      },
    }),
    async (ctx) => {
      const { tenant_id } = ctx.req.valid("header");
      const body = ctx.req.valid("json");

      const domain = await ctx.env.data.domains.create(tenant_id, {
        ...body,
        id: nanoid(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      return ctx.json(domain);
    },
  )
  // --------------------------------
  // PUT /domains/:id
  // --------------------------------
  .openapi(
    createRoute({
      tags: ["domains"],
      method: "post",
      path: "/{:id}",
      request: {
        body: {
          content: {
            "application/json": {
              schema: domainInsertSchema,
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
            "domain/json": {
              schema: domainSchema,
            },
          },
          description: "An domain",
        },
      },
    }),
    async (ctx) => {
      const { tenant_id } = ctx.req.valid("header");
      const { id } = ctx.req.valid("param");
      const body = ctx.req.valid("json");

      const domain = {
        ...body,
        tenant_id,
        id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const db = getDbFromEnv(ctx.env);

      try {
        await db.insertInto("domains").values(domain).execute();
      } catch (err: any) {
        if (!err.message.includes("AlreadyExists")) {
          throw err;
        }

        const { id, created_at, tenant_id: tenantId, ...domainUpdate } = domain;
        await db
          .updateTable("domains")
          .set(domainUpdate)
          .where("id", "=", domain.id)
          .execute();
      }

      return ctx.json(domain);
    },
  );
