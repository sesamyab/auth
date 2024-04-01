import { and, eq, isNull } from "drizzle-orm";
import { Session } from "../../../types";
import { sessions } from "../../../../drizzle-sqlite/schema";
import { DrizzleSQLiteDatabase } from "../../../services/drizzle-sqlite";

export function get(db: DrizzleSQLiteDatabase) {
  return async (tenant_id: string, id: string): Promise<Session | null> => {
    const sqlSession = await db.query.sessions.findFirst({
      where: and(
        eq(sessions.tenant_id, tenant_id),
        and(eq(sessions.id, id), isNull(sessions.deleted_at)),
      ),
    });

    if (!sqlSession) return null;

    const session: Session = {
      id: sqlSession.id,
      user_id: sqlSession.user_id,
      tenant_id: sqlSession.tenant_id,
      client_id: sqlSession.client_id,
      created_at: new Date(sqlSession.created_at!),
      expires_at: new Date(sqlSession.expires_at!),
      used_at: new Date(sqlSession.used_at!),
    };

    return session;
  };
}
