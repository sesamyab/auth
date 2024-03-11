import { ApplicationsAdapter } from "../../interfaces/Applications";
import { create } from "./create";
import { list } from "./list";
import { DrizzleDatabase } from "../../../services/drizzle";

export function createApplicationsAdapter(
  db: DrizzleDatabase,
): ApplicationsAdapter {
  return {
    create: create(db),
    list: list(db),
  };
}
