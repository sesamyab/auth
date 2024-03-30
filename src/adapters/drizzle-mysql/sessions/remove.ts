// WARNING - this file is generated from the SQLite adapter. Do not edit!
import { and, eq, isNull } from "drizzle-orm";
import { sessions } from "../../../../drizzle-mysql/schema";
import { DrizzleMysqlDatabase } from "../../../services/drizzle-mysql";

export function remove(db: DrizzleMysqlDatabase) {
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
