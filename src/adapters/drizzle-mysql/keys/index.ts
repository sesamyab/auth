// WARNING - this file is generated from the SQLite adapter. Do not edit!
import { list } from "./list";
import { KeysAdapter } from "../../interfaces/Keys";
import { create } from "./create";
import { revoke } from "./revoke";
import { DrizzleMySqlDatabase } from "../../../services/drizzle-mysql";

export function createKeysAdapter(db: DrizzleMySqlDatabase): KeysAdapter {
  return {
    create: create(db),
    list: list(db),
    revoke: revoke(db),
  };
}
