import { and, eq, isNull } from "drizzle-orm";
import { sessions } from "../../../../drizzle/schema";
import { DrizzleDatabase } from "../../../services/drizzle";

export function remove(db: DrizzleDatabase) {
  return async (tenant_id: string, id: string): Promise<boolean> => {
    const results = await db
      .update(sessions)
      .set({ deleted_at: new Date().toISOString() })
      .where(
        and(
          eq(sessions.tenant_id, tenant_id),
          and(eq(sessions.id, id), isNull(sessions.deleted_at)),
        ),
      )
      .execute();

    return !!results.rowsAffected;
  };
}
