import { ApplicationsAdapter } from "../../interfaces/Applications";
import { create } from "./create";
import { list } from "./list";
import { DrizzleMysqlDatabase } from "../../../services/drizzle";

export function createApplicationsAdapter(
  db: DrizzleMysqlDatabase,
): ApplicationsAdapter {
  return {
    create: create(db),
    list: list(db),
  };
}
