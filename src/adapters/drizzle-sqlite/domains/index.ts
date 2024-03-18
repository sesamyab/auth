import { DrizzleSQLiteDatabase } from "../../../services/drizzle-sqlite";
import { DomainsAdapter } from "../../interfaces/Domains";
import { create } from "./create";

export function createDomainsAdapter(
  db: DrizzleSQLiteDatabase,
): DomainsAdapter {
  return {
    create: create(db),
  };
}
