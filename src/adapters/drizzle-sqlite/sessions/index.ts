import { SessionsAdapter } from "../../interfaces/Sessions";
import { get } from "./get";
import { create } from "./create";
import { remove } from "./remove";
import { update } from "./update";
import { DrizzleSQLiteDatabase } from "../../../services/drizzle-sqlite";

export function createSessionsAdapter(
  db: DrizzleSQLiteDatabase,
): SessionsAdapter {
  return {
    create: create(db),
    get: get(db),
    remove: remove(db),
    update: update(db),
  };
}
