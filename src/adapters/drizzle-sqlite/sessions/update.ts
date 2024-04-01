import { and, eq, isNull } from "drizzle-orm";
import { sessions } from "../../../../drizzle-sqlite/schema";
import { DrizzleSQLiteDatabase } from "../../../services/drizzle-sqlite";

export function update(db: DrizzleSQLiteDatabase) {
  return async (
    tenant_id: string,
    id: string,
    session: { used_at: string },
  ) => {
    await db
      .update(sessions)
      .set(session)
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
