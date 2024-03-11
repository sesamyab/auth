import { list } from "./list";
import { KeysAdapter } from "../../interfaces/Keys";
import { create } from "./create";
import { revoke } from "./revoke";
import { DrizzleDatabase } from "../../../services/drizzle";

export function createKeysAdapter(db: DrizzleDatabase): KeysAdapter {
  return {
    create: create(db),
    list: list(db),
    revoke: revoke(db),
  };
}
