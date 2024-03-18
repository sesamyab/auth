import { UniversalLoginSession } from "../../interfaces/UniversalLoginSession";
import { DrizzleMysqlDatabase } from "../../../services/drizzle";
import { universal_login_sessions } from "../../../../drizzle-mysql/schema";

export function create(db: DrizzleMysqlDatabase) {
  return async (session: UniversalLoginSession) => {
    const { authParams, ...rest } = session;

    await db
      .insert(universal_login_sessions)
      .values({ ...authParams, ...rest })
      .execute();
  };
}
