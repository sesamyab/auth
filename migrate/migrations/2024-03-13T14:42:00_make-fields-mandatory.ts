import { Kysely } from "kysely";
import { Database } from "../../src/types";

export async function up(db: Kysely<Database>): Promise<void> {
  // Uncomment this for planetscale migration
  await db.schema
    .alterTable("applications")
    // Add notNull contstrain to allowed_callback_urls
    .modifyColumn("allowed_callback_urls", "varchar(255)", (col) =>
      col.notNull(),
    )
    .modifyColumn("allowed_logout_urls", "varchar(255)", (col) => col.notNull())
    .modifyColumn("allowed_web_origins", "varchar(255)", (col) => col.notNull())
    .modifyColumn("authentication_settings", "varchar(255)", (col) =>
      col.notNull(),
    )
    .modifyColumn("styling_settings", "varchar(255)", (col) => col.notNull())
    .modifyColumn("email_validation", "varchar(255)", (col) => col.notNull())
    .modifyColumn("created_at", "varchar(255)", (col) => col.notNull())
    .modifyColumn("modified_at", "varchar(255)", (col) => col.notNull())
    .addColumn("client_secret", "varchar(255)", (col) => col.notNull())
    .execute();
}

export async function down(db: Kysely<Database>): Promise<void> {}
