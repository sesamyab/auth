import { SQLiteTable } from "drizzle-orm/sqlite-core";
import { DrizzleDatabase } from "../../../services/drizzle";
import { DrizzleSQLiteDatabase } from "../../../services/drizzle-sqlite";
import { MySqlTable } from "drizzle-orm/mysql-core";

export function insertInto<TFrom extends SQLiteTable | MySqlTable>(
  db: DrizzleDatabase | DrizzleSQLiteDatabase,
  source: TFrom,
) {
  return db.dbType === "sqlite"
    ? db.insert(source)
    : db.insert(source as MySqlTable);
}
