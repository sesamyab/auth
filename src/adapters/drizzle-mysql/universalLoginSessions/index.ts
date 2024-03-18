import { UniversalLoginSessionsAdapter } from "../../interfaces/UniversalLoginSession";
import { get } from "./get";
import { create } from "./create";
import { update } from "./update";
import { DrizzleMysqlDatabase } from "../../../services/drizzle";

export function createUniversalLoginSessionAdapter(
  db: DrizzleMysqlDatabase,
): UniversalLoginSessionsAdapter {
  return {
    create: create(db),
    get: get(db),
    update: update(db),
  };
}
