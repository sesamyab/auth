// WARNING - this file is generated from the SQLite adapter. Do not edit!
import bcrypt from "bcryptjs";
import { PasswordParams, PasswordResponse } from "../../../types";
import { passwords } from "../../../../drizzle-mysql/schema";
import { and, eq } from "drizzle-orm";
import { DrizzleMySqlDatabase } from "../../../services/drizzle-mysql";

export function validate(db: DrizzleMySqlDatabase) {
  return async (
    tenant_id: string,
    params: PasswordParams,
  ): Promise<PasswordResponse> => {
    const password = await db.query.passwords.findFirst({
      where: and(
        eq(passwords.tenant_id, tenant_id),
        eq(passwords.user_id, params.user_id),
      ),
    });

    if (!password) {
      return {
        valid: false,
        message: "No password exists",
      };
    }

    if (!bcrypt.compareSync(params.password, password.password)) {
      return {
        valid: false,
        message: "Incorrect password",
      };
    }

    return {
      valid: true,
      message: "",
    };
  };
}
