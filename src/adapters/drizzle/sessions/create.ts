import { sessions } from "../../../../drizzle/schema";
import { DrizzleDatabase } from "../../../services/drizzle";
import { Session, SqlSession } from "../../../types";

export function create(db: DrizzleDatabase) {
  return async (session: Session) => {
    const sqlSession: SqlSession = {
      id: session.id,
      user_id: session.user_id,
      tenant_id: session.tenant_id,
      client_id: session.client_id,
      created_at: session.created_at.toISOString(),
      expires_at: session.expires_at.toISOString(),
      used_at: session.used_at.toISOString(),
    };

    await db.insert(sessions).values(sqlSession).execute();
  };
}
