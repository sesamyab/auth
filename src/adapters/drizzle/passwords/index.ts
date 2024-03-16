import { PasswordsAdapter } from "../../interfaces/Passwords";
import { validate } from "./validate";
import { create } from "./create";
import { update } from "./update";
import { DrizzleDatabase } from "../../../services/drizzle";

export function createPasswordAdapter(db: DrizzleDatabase): PasswordsAdapter {
  return {
    create: create(db),
    update: update(db),
    validate: validate(db),
  };
}
