import { PasswordParams } from "../../../types";
import bcrypt from "bcryptjs";
import { DrizzleDatabase } from "../../../services/drizzle";
import { passwords } from "../../../../drizzle/schema";

export function create(db: DrizzleDatabase) {
  return async (tenant_id: string, params: PasswordParams) => {
    const passwordHash = bcrypt.hashSync(params.password, 10);

    await db
      .insert(passwords)
      .values({
        tenant_id,
        user_id: params.user_id,
        password: passwordHash,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .execute();
  };
}
