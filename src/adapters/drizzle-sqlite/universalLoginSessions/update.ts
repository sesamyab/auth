import { UniversalLoginSession } from "../../interfaces/UniversalLoginSession";
import { universal_login_sessions } from "../../../../drizzle-mysql/schema";
import { eq } from "drizzle-orm";
import { DrizzleSQLiteDatabase } from "../../../services/drizzle-sqlite";

export function update(db: DrizzleSQLiteDatabase) {
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
