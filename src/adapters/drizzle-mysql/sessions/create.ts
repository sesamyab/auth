// WARNING - this file is generated from the SQLite adapter. Do not edit!
import { DrizzleMySqlDatabase } from "../../../services/drizzle-mysql";
import { sessions } from "../../../../drizzle-mysql/schema";
import { Session, SqlSession } from "../../../types";

export function create(db: DrizzleMySqlDatabase) {
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