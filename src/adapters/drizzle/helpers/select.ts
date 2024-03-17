import { SQLiteTable } from "drizzle-orm/sqlite-core";
import { DrizzleDatabase } from "../../../services/drizzle";
import { DrizzleSQLiteDatabase } from "../../../services/drizzle-sqlite";
import { MySqlTable } from "drizzle-orm/mysql-core";

export function selectFrom<TFrom extends SQLiteTable | MySqlTable>(
  db: DrizzleDatabase | DrizzleSQLiteDatabase,
  source: TFrom,
) {
  return db.dbType === "sqlite"
    ? db.select().from(source)
    : db.select().from(source as MySqlTable);
}
