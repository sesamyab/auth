// WARNING - this file is generated from the SQLite adapter. Do not edit!
import { ApplicationsAdapter } from "../../interfaces/Applications";
import { create } from "./create";
import { list } from "./list";
import { DrizzleMySqlDatabase } from "../../../services/drizzle-mysql";

export function createApplicationsAdapter(
  db: DrizzleMySqlDatabase,
): ApplicationsAdapter {
  return {
    create: create(db),
    list: list(db),
  };
}
