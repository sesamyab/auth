// WARNING - this file is generated from the SQLite adapter. Do not edit!
import { UniversalLoginSession } from "../../interfaces/UniversalLoginSession";
import { universal_login_sessions } from "../../../../drizzle-mysql/schema";
import { DrizzleMySqlDatabase } from "../../../services/drizzle-mysql";

export function create(db: DrizzleMySqlDatabase) {
  return async (session: UniversalLoginSession) => {
    const { authParams, ...rest } = session;

    await db
      .insert(universal_login_sessions)
      .values({ ...authParams, ...rest, client_id: authParams.client_id! })
      .execute();
  };
}
