import SQLite from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "../../drizzle-sqlite/schema";

export function getDb(path: ":db.sqlite:" | ":memory:") {
  const db = drizzle(new SQLite(path), { schema });

  return db;
}

export type DrizzleSQLiteDatabase = ReturnType<typeof getDb>;
