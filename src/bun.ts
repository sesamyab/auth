import { serveStatic } from "hono/bun";
// @ts-ignore
// import * as bunSqlite from "bun:sqlite";
import app from "../src/app";
import { oAuth2ClientFactory } from "../src/services/oauth2-client";
import createAdapters from "./adapters/drizzle";
import createEmailAdapter from "./adapters/email";
import { db } from "./services/drizzle-sqlite";

app.use("/static/*", serveStatic({ root: "./" }));

const server = {
  async fetch(request: Request): Promise<Response> {
    return app.fetch(request, {
      ...process.env,
      oauth2ClientFactory: { create: oAuth2ClientFactory },
      data: {
        ...createEmailAdapter(),
        ...createAdapters(db),
      },
    });
  },
};

export default server;
