import { SessionsAdapter } from "../../interfaces/Sessions";
import { get } from "./get";
import { create } from "./create";
import { remove } from "./remove";
import { update } from "./update";
import { DrizzleMysqlDatabase } from "../../../services/drizzle";

export function createSessionsAdapter(
  db: DrizzleMysqlDatabase,
): SessionsAdapter {
  return {
    create: create(db),
    get: get(db),
    remove: remove(db),
    update: update(db),
  };
}
