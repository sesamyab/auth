import { and, eq } from "drizzle-orm";
import { DrizzleDatabase } from "../../../services/drizzle";
import { User, userSchema } from "../../../types";
import { users } from "../../../../drizzle/schema";

export function get(db: DrizzleDatabase) {
  return async (tenantId: string, id: string): Promise<User | null> => {
    const sqlUser = await db.query.users.findFirst({
      where: and(eq(users.tenant_id, tenantId), eq(users.id, id)),
    });

    if (!sqlUser) {
      return null;
    }

    // loop through all user keys and remove any that are null
    Object.keys(sqlUser).forEach((key) => {
      const unsafeTypeUser = user as any;
      if (unsafeTypeUser[key] === null) {
        delete unsafeTypeUser[key];
      }
    });

    const user = userSchema.parse({
      ...sqlUser,
      email_verified: sqlUser.email_verified === 1,
      is_social: sqlUser.is_social === 1,
    });

    return user;
  };
}
