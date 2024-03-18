import { DrizzleMysqlDatabase } from "../../../services/drizzle";
import { DomainsAdapter } from "../../interfaces/Domains";
import { create } from "./create";

export function createDomainsAdapter(db: DrizzleMysqlDatabase): DomainsAdapter {
  return {
    create: create(db),
  };
}
