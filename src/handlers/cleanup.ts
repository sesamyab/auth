import { Database } from "@authhero/kysely-adapter";
import { Kysely } from "kysely";

export async function cleanup(db: Kysely<Database>) {
  const oneDayAgo = new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString();

  const oneWeekAgo = new Date(
    Date.now() - 1000 * 60 * 60 * 24 * 7,
  ).toISOString();

  const threeMonthsAgo = new Date(
    Date.now() - 1000 * 60 * 60 * 24 * 30 * 3,
  ).toISOString();

  await db
    .deleteFrom("codes")
    .where("created_at", "<", oneDayAgo)
    .limit(100000)
    .execute();
  await db
    .deleteFrom("tickets")
    .where("created_at", "<", oneDayAgo)
    .limit(100000)
    .execute();
  await db
    .deleteFrom("logins")
    .where("created_at", "<", oneWeekAgo)
    .limit(100000)
    .execute();
  await db
    .deleteFrom("logs")
    .where("date", "<", threeMonthsAgo)
    .limit(100000)
    .execute();
}
