import { eq } from "drizzle-orm";
import { keys } from "../../../../drizzle-mysql/schema";
import { DrizzleMysqlDatabase } from "../../../services/drizzle";

export function revoke(db: DrizzleMysqlDatabase) {
  return async (kid: string, revoke_at: Date) => {
    const results = await db
      .update(keys)
      .set({ revoked_at: revoke_at.toISOString() })
      .where(eq(keys.kid, kid))
      .execute();

    return !!results.rowsAffected;
  };
}
