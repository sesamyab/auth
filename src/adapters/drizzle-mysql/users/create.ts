// WARNING - this file is generated from the SQLite adapter. Do not edit!
import { User } from "../../../types";
import { HTTPException } from "hono/http-exception";
import { users } from "../../../../drizzle-mysql/schema";
import { DrizzleMySqlDatabase } from "../../../services/drizzle-mysql";

export function create(db: DrizzleMySqlDatabase) {
  return async (tenantId: string, user: User): Promise<User> => {
    const sqlUser = {
      ...user,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      tenant_id: tenantId,
    };

    try {
      await db.insert(users).values(sqlUser).execute();
    } catch (err: any) {
      if (err.code === "SQLITE_CONSTRAINT_UNIQUE") {
        throw new HTTPException(409, { message: "User already exists" });
      }
      throw new HTTPException(500, { message: err.code });
    }

    return sqlUser;
  };
}
