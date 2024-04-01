// WARNING - this file is generated from the SQLite adapter. Do not edit!
import { PostUsersBody } from "../../../types";
import { users } from "../../../../drizzle-mysql/schema";
import { and, eq } from "drizzle-orm";
import { DrizzleMySqlDatabase } from "../../../services/drizzle-mysql";

export function update(db: DrizzleMySqlDatabase) {
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
