import { serveStatic } from "hono/bun";
import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import app from "../src/app";
import { oAuth2ClientFactory } from "../src/services/oauth2-client";
import createAdapters from "./adapters/drizzle-sqlite";
import createEmailAdapter from "./adapters/email";
import * as schema from "../drizzle-sqlite/schema";
import { DrizzleSQLiteDatabase } from "./services/drizzle-sqlite";

const sqlite = new Database("db.sqlite");
const db = drizzle(sqlite, { schema });

app.use("/static/*", serveStatic({ root: "./" }));

const server = {
  async fetch(request: Request): Promise<Response> {
    return app.fetch(request, {
      ...process.env,
      oauth2ClientFactory: { create: oAuth2ClientFactory },
      data: {
        ...createEmailAdapter(),
        // TODO: this doesn't really matter as they both work the same, but.. it would be nice to have a base type for this here
        ...createAdapters(db as unknown as DrizzleSQLiteDatabase),
      },
    });
  },
};

export default server;
