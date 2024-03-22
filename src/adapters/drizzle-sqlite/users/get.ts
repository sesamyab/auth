import { and, eq } from "drizzle-orm";
import { User, userSchema } from "../../../types";
import { users } from "../../../../drizzle-sqlite/schema";
import { DrizzleSQLiteDatabase } from "../../../services/drizzle-sqlite";
import { transformNullsToUndefined } from "../null-to-undefined";

export function get(db: DrizzleSQLiteDatabase) {
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
