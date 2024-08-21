import { Kysely } from "kysely";
import { Database } from "@authhero/kysely-adapter";

export async function up(db: Kysely<Database>): Promise<void> {
  await db.schema
    .alterTable("logins")
    .addColumn("authParams_nonce", "varchar(255)")
    .execute();

  await db.schema
    .alterTable("codes")
    .addColumn("connection_id", "varchar(255)")
    .execute();
}

export async function down(db: Kysely<Database>): Promise<void> {
  await db.schema.alterTable("logins").dropColumn("authParams_nonce").execute();

  await db.schema.alterTable("codes").dropColumn("connection_id").execute();
}
