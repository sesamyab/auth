// WARNING - this file is generated from the SQLite adapter. Do not edit!
import { and, eq } from "drizzle-orm";
import { User, userSchema } from "../../../types";
import { users } from "../../../../drizzle-mysql/schema";
import { DrizzleMySqlDatabase } from "../../../services/drizzle-mysql";
import { transformNullsToUndefined } from "../null-to-undefined";

export function get(db: DrizzleMySqlDatabase) {
  return async (tenantId: string, id: string): Promise<User | null> => {
    const sqlUser = await db.query.users.findFirst({
      where: and(eq(users.tenant_id, tenantId), eq(users.id, id)),
    });

    if (!sqlUser) {
      return null;
    }

    const user = userSchema.parse(transformNullsToUndefined(sqlUser));

    return user;
  };
}
