import { UniversalLoginSessionsAdapter } from "../../interfaces/UniversalLoginSession";
import { get } from "./get";
import { create } from "./create";
import { update } from "./update";
import { DrizzleSQLiteDatabase } from "../../../services/drizzle-sqlite";

export function createUniversalLoginSessionAdapter(
  db: DrizzleSQLiteDatabase,
): UniversalLoginSessionsAdapter {
  return {
    create: create(db),
    get: get(db),
    update: update(db),
  };
}
