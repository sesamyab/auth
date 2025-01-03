import { Kysely } from "kysely";
import { Database } from "@authhero/kysely-adapter";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function up(db: Kysely<Database>): Promise<void> {
  // await db.schema
  //   .alterTable("logins")
  // .addColumn("ip", "varchar(255)")
  // .addColumn("useragent", "varchar(255)")
  // .execute();
}

export async function down(db: Kysely<Database>): Promise<void> {
  await db.schema
    .alterTable("logins")
    .dropColumn("ip")
    .dropColumn("useragent")
    .execute();
}
