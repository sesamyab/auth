import { drizzle } from "drizzle-orm/bun-sqlite";
import { Database } from "bun:sqlite";
import * as schema from "../../drizzle/schema-sqlite";

const sqlite = new Database("sqlite.db");

const db = drizzle(sqlite, { schema });

export { db };
export type DrizzleSQLiteDatabase = typeof db & { dbType: "sqlite" };
