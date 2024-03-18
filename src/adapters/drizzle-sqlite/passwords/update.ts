import { PasswordParams } from "../../../types";
import bcrypt from "bcryptjs";
import { passwords } from "../../../../drizzle-sqlite/schema";
import { and, eq } from "drizzle-orm";
import { DrizzleSQLiteDatabase } from "../../../services/drizzle-sqlite";

export function update(db: DrizzleSQLiteDatabase) {
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
