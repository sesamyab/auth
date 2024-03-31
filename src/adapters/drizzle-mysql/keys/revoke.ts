// WARNING - this file is generated from the SQLite adapter. Do not edit!
import { eq } from "drizzle-orm";
import { keys } from "../../../../drizzle-mysql/schema";
import { DrizzleMySqlDatabase } from "../../../services/drizzle-mysql";

export function revoke(db: DrizzleMySqlDatabase) {
  return async (kid: string, revoke_at: Date) => {
    const results = await db
      .update(keys)
      .set({ revoked_at: revoke_at.toISOString() })
      .where(eq(keys.kid, kid))
      .execute();

    return true;
  };
}
