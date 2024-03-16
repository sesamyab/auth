import { SessionsAdapter } from "../../interfaces/Sessions";
import { get } from "./get";
import { create } from "./create";
import { remove } from "./remove";
import { update } from "./update";
import { DrizzleDatabase } from "../../../services/drizzle";

export function createSessionsAdapter(db: DrizzleDatabase): SessionsAdapter {
  return {
    create: create(db),
    get: get(db),
    remove: remove(db),
    update: update(db),
  };
}
