import { and, eq, isNull } from "drizzle-orm";
import { sessions } from "../../../../drizzle-mysql/schema";
import { DrizzleMysqlDatabase } from "../../../services/drizzle";

export function update(db: DrizzleMysqlDatabase) {
  return async (
    tenant_id: string,
    id: string,
    session: { used_at: string },
  ) => {
    const results = await db
      .update(sessions)
      .set(session)
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
