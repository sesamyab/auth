import { UniversalLoginSession } from "../../interfaces/UniversalLoginSession";
import { DrizzleDatabase } from "../../../services/drizzle";
import { universal_login_sessions } from "../../../../drizzle/schema";

export function create(db: DrizzleDatabase) {
  return async (session: UniversalLoginSession) => {
    const { authParams, ...rest } = session;

    await db
      .insert(universal_login_sessions)
      .values({ ...authParams, ...rest })
      .execute();
  };
}
