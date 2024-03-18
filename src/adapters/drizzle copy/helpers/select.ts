import { SQLiteTable } from "drizzle-orm/sqlite-core";
import { DrizzleMysqlDatabase } from "../../../services/drizzle";
import { DrizzleSQLiteDatabase } from "../../../services/drizzle-sqlite";
import { MySqlTable } from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

export function selectFrom<TFrom extends SQLiteTable | MySqlTable>(
  db: DrizzleMysqlDatabase | DrizzleSQLiteDatabase,
  source: TFrom,
) {
  return db.dbType === "sqlite"
    ? db.select().from(source)
    : db.select().from(source);
}

export function selectCountFrom<TFrom extends SQLiteTable | MySqlTable>(
  db: DrizzleMysqlDatabase | DrizzleSQLiteDatabase,
  source: TFrom,
) {
  return db.dbType === "sqlite"
    ? db
        .select({
          count: sql`count(*)`.mapWith(Number),
        })
        .from(source)
        .$dynamic()
    : db
        .select({
          count: sql`count(*)`.mapWith(Number),
        })
        .from(source as MySqlTable)
        .$dynamic();
}
