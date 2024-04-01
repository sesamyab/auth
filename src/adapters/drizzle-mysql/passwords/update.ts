// WARNING - this file is generated from the SQLite adapter. Do not edit!
import { PasswordParams } from "../../../types";
import bcrypt from "bcryptjs";
import { passwords } from "../../../../drizzle-mysql/schema";
import { and, eq } from "drizzle-orm";
import { DrizzleMySqlDatabase } from "../../../services/drizzle-mysql";

export function update(db: DrizzleMySqlDatabase) {
  return async (tenant_id: string, params: PasswordParams) => {
    const passwordHash = bcrypt.hashSync(params.password, 10);

    const results = await db
      .update(passwords)
      .set({
        password: passwordHash,
        updated_at: new Date().toISOString(),
      })
      .where(
        and(
          eq(passwords.tenant_id, tenant_id),
          eq(passwords.user_id, params.user_id),
        ),
      )
      .execute();

    return true;
  };
}
