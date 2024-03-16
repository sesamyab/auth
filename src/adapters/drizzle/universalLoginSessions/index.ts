import { UniversalLoginSessionsAdapter } from "../../interfaces/UniversalLoginSession";
import { get } from "./get";
import { create } from "./create";
import { update } from "./update";
import { DrizzleDatabase } from "../../../services/drizzle";

export function createUniversalLoginSessionAdapter(
  db: DrizzleDatabase,
): UniversalLoginSessionsAdapter {
  return {
    create: create(db),
    get: get(db),
    update: update(db),
  };
}
