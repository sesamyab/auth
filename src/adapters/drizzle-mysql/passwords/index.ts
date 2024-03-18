import { PasswordsAdapter } from "../../interfaces/Passwords";
import { validate } from "./validate";
import { create } from "./create";
import { update } from "./update";
import { DrizzleMysqlDatabase } from "../../../services/drizzle";

export function createPasswordAdapter(
  db: DrizzleMysqlDatabase,
): PasswordsAdapter {
  return {
    create: create(db),
    update: update(db),
    validate: validate(db),
  };
}
