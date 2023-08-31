import { Kysely } from "kysely";
import { Database } from "../../types";
import { Tenant } from "../../types/sql";

export async function up(db: Kysely<Database>): Promise<void> {
  const kvartalTenant: Tenant = {
    name: "Kvartal",
    senderEmail: "login@sesamy.com",
    language: "sv",
    logo: "https://kvartal.se/logo.png",
    primaryColor: "#8613b1",
    audience: "https://kvartal.se",
    id: "AH_1eG1-Ouam8jRlSd1fI",
    createdAt: "2023-08-11T09:47:53.205Z",
    modifiedAt: "2023-08-29T06:58:57.632Z",
    senderName: "Kvartal",
  };

  await db.insertInto("tenants").values(kvartalTenant).executeTakeFirst();
}

// do we need to always have a down function? we could delete the records we insert in the up function
export async function down(db: Kysely<Database>): Promise<void> {}
