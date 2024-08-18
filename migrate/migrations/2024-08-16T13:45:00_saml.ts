import { Kysely } from "kysely";
import { Database } from "@authhero/kysely-adapter";

export async function up(db: Kysely<Database>): Promise<void> {
  // Moved to inin migration for sqlite
  // await db.schema
  //   .alterTable("applications")
  //   .addColumn("addons", "varchar(4096)", (col) =>
  //     col.notNull().defaultTo("{}"),
  //   )
  //   .addColumn("callbacks", "varchar(1024)", (col) =>
  //     col.notNull().defaultTo("[]"),
  //   )
  //   .addColumn("allowed_origins", "varchar(1024)", (col) =>
  //     col.notNull().defaultTo("[]"),
  //   )
  //   .addColumn("web_origins", "varchar(1024)", (col) =>
  //     col.notNull().defaultTo("[]"),
  //   )
  //   .execute();
}

export async function down(db: Kysely<Database>): Promise<void> {
  // await db.schema
  //   .alterTable("applications")
  //   .dropColumn("addons")
  //   .dropColumn("callbacks")
  //   .dropColumn("allowed_origins")
  //   .dropColumn("web_origins")
  //   .execute();
}
