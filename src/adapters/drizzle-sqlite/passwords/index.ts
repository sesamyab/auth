import { PasswordsAdapter } from "../../interfaces/Passwords";
import { validate } from "./validate";
import { create } from "./create";
import { update } from "./update";
import { DrizzleDatabase } from "../../../services/drizzle";
import { DrizzleSQLiteDatabase } from "../../../services/drizzle-sqlite";

export function createPasswordAdapter(
  db: DrizzleSQLiteDatabase,
): PasswordsAdapter {
  return {
    create: create(db),
    update: update(db),
    validate: validate(db),
  };
}
