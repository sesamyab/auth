import { SqlUser, User } from "../../../types";
import { HTTPException } from "hono/http-exception";
import { DrizzleDatabase } from "../../../services/drizzle";
import { users } from "../../../../drizzle/schema";

export function create(db: DrizzleDatabase) {
  return async (tenantId: string, user: User): Promise<User> => {
    const sqlUser: SqlUser = {
      ...user,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      tenant_id: tenantId,
      email_verified: user.email_verified ? 1 : 0,
      is_social: user.is_social ? 1 : 0,
    };

    try {
      await db.insert(users).values(sqlUser).execute();
    } catch (err: any) {
      if (err.code === "SQLITE_CONSTRAINT_UNIQUE") {
        throw new HTTPException(409, { message: "User already exists" });
      }
      throw new HTTPException(500, { message: err.code });
    }

    return {
      ...sqlUser,
      email_verified: sqlUser.email_verified === 1,
      is_social: sqlUser.is_social === 1,
    };
  };
}
