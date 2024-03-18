import { and, eq, isNull } from "drizzle-orm";
import { sessions } from "../../../../drizzle-sqlite/schema";
import { DrizzleSQLiteDatabase } from "../../../services/drizzle-sqlite";

export function remove(db: DrizzleSQLiteDatabase) {
  return async (tenant_id: string, id: string): Promise<boolean> => {
    await db
      .update(sessions)
      .set({ deleted_at: new Date().toISOString() })
      .where(
        and(
          eq(sessions.tenant_id, tenant_id),
          and(eq(sessions.id, id), isNull(sessions.deleted_at)),
        ),
      )
      .execute();

    return true;
  };
}
