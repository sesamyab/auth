import { eq } from "drizzle-orm";
import { keys } from "../../../../drizzle-sqlite/schema";
import { DrizzleSQLiteDatabase } from "../../../services/drizzle-sqlite";

export function revoke(db: DrizzleSQLiteDatabase) {
  return async (kid: string, revoke_at: Date) => {
    const results = await db
      .update(keys)
      .set({ revoked_at: revoke_at.toISOString() })
      .where(eq(keys.kid, kid))
      .execute();

    return true;
  };
}
