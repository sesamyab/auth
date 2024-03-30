// WARNING - this file is generated from the SQLite adapter. Do not edit!
import { UniversalLoginSession } from "../../interfaces/UniversalLoginSession";
import { universal_login_sessions } from "../../../../drizzle-mysql/schema";
import { eq } from "drizzle-orm";
import { DrizzleMysqlDatabase } from "../../../services/drizzle-mysql";

export function update(db: DrizzleMysqlDatabase) {
  return async (id: string, session: UniversalLoginSession) => {
    const { authParams, ...rest } = session;
    await db
      .update(universal_login_sessions)
      .set({ ...authParams, ...rest })
      .where(eq(universal_login_sessions.id, id))
      .execute();

    return true;
  };
}
