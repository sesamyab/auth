import { PasswordParams } from "../../../types";
import bcrypt from "bcryptjs";
import { DrizzleMysqlDatabase } from "../../../services/drizzle";
import { passwords } from "../../../../drizzle-mysql/schema";
import { and, eq } from "drizzle-orm";

export function update(db: DrizzleMysqlDatabase) {
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

    return results.rowsAffected === 1;
  };
}
