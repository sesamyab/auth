import { UniversalLoginSession } from "../../interfaces/UniversalLoginSession";
import { universal_login_sessions } from "../../../../drizzle-mysql/schema";
import { DrizzleSQLiteDatabase } from "../../../services/drizzle-sqlite";

export function create(db: DrizzleSQLiteDatabase) {
  return async (session: UniversalLoginSession) => {
    const { authParams, ...rest } = session;

    await db
      .insert(universal_login_sessions)
      .values({ ...authParams, ...rest, client_id: authParams.client_id! })
      .execute();
  };
}
