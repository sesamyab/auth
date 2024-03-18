import { ApplicationsAdapter } from "../../interfaces/Applications";
import { create } from "./create";
import { list } from "./list";
import { DrizzleMysqlDatabase } from "../../../services/drizzle";
import { DrizzleSQLiteDatabase } from "../../../services/drizzle-sqlite";

export function createApplicationsAdapter(
  db: DrizzleMysqlDatabase | DrizzleSQLiteDatabase,
): ApplicationsAdapter {
  return {
    create: create(db),
    list: list(db),
  };
}
