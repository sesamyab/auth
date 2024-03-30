// WARNING - this file is generated from the SQLite adapter. Do not edit!
import { DrizzleMysqlDatabase } from "../../../services/drizzle-mysql";
import { DomainsAdapter } from "../../interfaces/Domains";
import { create } from "./create";

export function createDomainsAdapter(db: DrizzleMysqlDatabase): DomainsAdapter {
  return {
    create: create(db),
  };
}
