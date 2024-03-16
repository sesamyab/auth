import bcrypt from "bcryptjs";
import { PasswordParams, PasswordResponse } from "../../../types";
import { DrizzleDatabase } from "../../../services/drizzle";
import { passwords } from "../../../../drizzle/schema";
import { and, eq } from "drizzle-orm";

export function validate(db: DrizzleDatabase) {
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
