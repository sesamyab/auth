// WARNING - this file is generated from the SQLite adapter. Do not edit!
import {
  UniversalLoginSession,
  universalLoginSessionSchema,
} from "../../interfaces/UniversalLoginSession";
import { and, eq, gt } from "drizzle-orm";
import { universal_login_sessions } from "../../../../drizzle-mysql/schema";
import { DrizzleMySqlDatabase } from "../../../services/drizzle-mysql";
import { transformNullsToUndefined } from "../null-to-undefined";

export function get(db: DrizzleMySqlDatabase) {
  return async (id: string): Promise<UniversalLoginSession | null> => {
    const now = new Date().toISOString();

    const session = await db.query.universal_login_sessions.findFirst({
      where: and(
        eq(universal_login_sessions.id, id),
        gt(universal_login_sessions.expires_at, now),
      ),
    });

    if (!session) return null;

    const {
      client_id,
      response_type,
      response_mode,
      redirect_uri,
      audience,
      state,
      nonce,
      scope,
      code_challenge_method,
      code_challenge,
      username,
      ...rest
    } = session;

    const universalLoginSessionWithoutNulls = transformNullsToUndefined({
      ...rest,
      authParams: {
        client_id,
        response_type,
        response_mode,
        redirect_uri,
        audience,
        state,
        nonce,
        scope,
        code_challenge_method,
        code_challenge,
        username,
      },
    });

    return universalLoginSessionSchema.parse(universalLoginSessionWithoutNulls);
  };
}
