import { UniversalLoginSession } from "../../interfaces/UniversalLoginSession";
import { DrizzleDatabase } from "../../../services/drizzle";
import { universal_login_sessions } from "../../../../drizzle/schema";
import { eq } from "drizzle-orm";

export function update(db: DrizzleDatabase) {
  return async (id: string, session: UniversalLoginSession) => {
    const { authParams, ...rest } = session;
    const results = await db
      .update(universal_login_sessions)
      .set({ ...authParams, ...rest })
      .where(eq(universal_login_sessions.id, id))
      .execute();

    return results.rowsAffected === 1;
  };
}
