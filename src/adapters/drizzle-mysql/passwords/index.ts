// WARNING - this file is generated from the SQLite adapter. Do not edit!
import { PasswordsAdapter } from "../../interfaces/Passwords";
import { validate } from "./validate";
import { create } from "./create";
import { update } from "./update";
import { DrizzleMySqlDatabase } from "../../../services/drizzle-mysql";

export function createPasswordAdapter(
  db: DrizzleMySqlDatabase,
): PasswordsAdapter {
  return {
    create: create(db),
    update: update(db),
    validate: validate(db),
  };
}
