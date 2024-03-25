import { PostUsersBody } from "../../../types";
import { users } from "../../../../drizzle-sqlite/schema";
import { and, eq } from "drizzle-orm";
import { DrizzleSQLiteDatabase } from "../../../services/drizzle-sqlite";

export function update(db: DrizzleSQLiteDatabase) {
  return async (
    tenant_id: string,
    id: string,
    user: Partial<PostUsersBody>,
  ): Promise<boolean> => {
    const sqlUser = {
      ...user,
      updated_at: new Date().toISOString(),
    };

    await db
      .update(users)
      .set(sqlUser)
      .where(and(eq(users.tenant_id, tenant_id), eq(users.id, id)))
      .execute();

    return true;
  };
}
