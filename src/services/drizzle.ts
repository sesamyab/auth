import { drizzle } from "drizzle-orm/planetscale-serverless";
import { connect } from "@planetscale/database";
import * as schema from "../../drizzle/schema";

const connection = connect({
  url: process.env.DATABASE_URL,
});

const db = drizzle(connection, { schema });

export { db };
export type DrizzleDatabase = typeof db;
