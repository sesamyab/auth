import { Kysely } from "kysely";
import { Database } from "@authhero/kysely-adapter";

export async function up(db: Kysely<Database>): Promise<void> {
  // await db.schema
  //   .alterTable("users")
  //   .modifyColumn("picture", "varchar(2083)")
  //   .execute();
}

export async function down(db: Kysely<Database>): Promise<void> {
  // await db.schema
  //   .alterTable("users")
  //   .modifyColumn("picture", "varchar(255)")
  //   .execute();
}
