import { list } from "./list";
import { KeysAdapter } from "../../interfaces/Keys";
import { create } from "./create";
import { revoke } from "./revoke";
import { DrizzleSQLiteDatabase } from "../../../services/drizzle-sqlite";

export function createKeysAdapter(db: DrizzleSQLiteDatabase): KeysAdapter {
  return {
    create: create(db),
    list: list(db),
    revoke: revoke(db),
  };
}
