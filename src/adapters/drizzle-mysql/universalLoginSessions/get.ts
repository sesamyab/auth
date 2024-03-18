import {
  UniversalLoginSession,
  universalLoginSessionSchema,
} from "../../interfaces/UniversalLoginSession";
import { DrizzleMysqlDatabase } from "../../../services/drizzle";
import { and, eq, gt } from "drizzle-orm";
import { universal_login_sessions } from "../../../../drizzle-mysql/schema";

export function get(db: DrizzleMysqlDatabase) {
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

    return universalLoginSessionSchema.parse({
      ...rest,
      authParams: {
        client_id: rest.client_id,
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
  };
}
