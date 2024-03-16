import { and, eq, isNull } from "drizzle-orm";
import { DrizzleDatabase } from "../../../services/drizzle";
import { Database, Session } from "../../../types";
import { Kysely } from "kysely";
import { sessions } from "../../../../drizzle/schema";

export function get(db: DrizzleDatabase) {
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
