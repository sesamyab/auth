import { list } from "./list";
import { KeysAdapter } from "../../interfaces/Keys";
import { create } from "./create";
import { revoke } from "./revoke";
import { DrizzleMysqlDatabase } from "../../../services/drizzle";

export function createKeysAdapter(db: DrizzleMysqlDatabase): KeysAdapter {
  return {
    create: create(db),
    list: list(db),
    revoke: revoke(db),
  };
}
