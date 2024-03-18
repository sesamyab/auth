import { SqlUser, PostUsersBody } from "../../../types";
import { DrizzleMysqlDatabase } from "../../../services/drizzle";
import { users } from "../../../../drizzle-mysql/schema";
import { and, eq } from "drizzle-orm";

function getEmailVerified(user: Partial<PostUsersBody>): number | undefined {
  if (user.email_verified === undefined) {
    return undefined;
  }

  return user.email_verified ? 1 : 0;
}

export function update(db: DrizzleMysqlDatabase) {
  return async (
    tenant_id: string,
    id: string,
    user: Partial<PostUsersBody>,
  ): Promise<boolean> => {
    const sqlUser: Partial<SqlUser> = {
      ...user,
      email_verified: getEmailVerified(user),
      updated_at: new Date().toISOString(),
    };

    const results = await db
      .update(users)
      .set(sqlUser)
      .where(and(eq(users.tenant_id, tenant_id), eq(users.id, id)))
      .execute();

    return results.rowsAffected === 1;
  };
}
