// WARNING - this file is generated from the SQLite adapter. Do not edit!
import { UniversalLoginSessionsAdapter } from "../../interfaces/UniversalLoginSession";
import { get } from "./get";
import { create } from "./create";
import { update } from "./update";
import { DrizzleMySqlDatabase } from "../../../services/drizzle-mysql";

export function createUniversalLoginSessionAdapter(
  db: DrizzleMySqlDatabase,
): UniversalLoginSessionsAdapter {
  return {
    create: create(db),
    get: get(db),
    update: update(db),
  };
}
