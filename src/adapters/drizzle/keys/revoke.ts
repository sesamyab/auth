import { eq } from "drizzle-orm";
import { keys } from "../../../../drizzle/schema";
import { DrizzleDatabase } from "../../../services/drizzle";

export function revoke(db: DrizzleDatabase) {
  return async (kid: string, revoke_at: Date) => {
    const results = await db
      .update(keys)
      .set({ revoked_at: revoke_at.toISOString() })
      .where(eq(keys.kid, kid))
      .execute();

    return !!results.rowsAffected;
  };
}
