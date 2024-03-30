import { drizzle } from "drizzle-orm/planetscale-serverless";
import { Client } from "@planetscale/database";
import * as schema from "../../drizzle-mysql/schema";

const client = new Client({
  url: `https://${process.env.DATABASE_USERNAME}:${process.env.DATABASE_PASSWORD}@${process.env.DATABASE_HOST}/?ssl={"rejectUnauthorized":true}`,
});

const db = drizzle(client, { schema });

export { db };
export type DrizzleMysqlDatabase = typeof db;
