import { ApplicationsAdapter } from "../../interfaces/Applications";
import { create } from "./create";
import { list } from "./list";
import { DrizzleSQLiteDatabase } from "../../../services/drizzle-sqlite";

export function createApplicationsAdapter(
  db: DrizzleSQLiteDatabase,
): ApplicationsAdapter {
  return {
    create: create(db),
    list: list(db),
  };
}
