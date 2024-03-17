import { ApplicationsAdapter } from "../../interfaces/Applications";
import { create } from "./create";
import { list } from "./list";
import { DrizzleDatabase } from "../../../services/drizzle";
import { DrizzleSQLiteDatabase } from "../../../services/drizzle-sqlite";

export function createApplicationsAdapter(
  db: DrizzleDatabase | DrizzleSQLiteDatabase,
): ApplicationsAdapter {
  return {
    create: create(db),
    list: list(db),
  };
}
