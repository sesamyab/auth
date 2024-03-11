import { DrizzleDatabase } from "../../../services/drizzle";
import { DomainsAdapter } from "../../interfaces/Domains";
import { create } from "./create";

export function createDomainsAdapter(db: DrizzleDatabase): DomainsAdapter {
  return {
    create: create(db),
  };
}
