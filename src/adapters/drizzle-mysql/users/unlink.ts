// WARNING - this file is generated from the SQLite adapter. Do not edit!
import { users } from "../../../../drizzle-mysql/schema";
import { and, eq } from "drizzle-orm";
import { DrizzleMySqlDatabase } from "../../../services/drizzle-mysql";

export function unlink(db: DrizzleMySqlDatabase) {
  return async (tenant_id: string, id: string): Promise<boolean> => {
    const unsafeTypeUser = { linked_to: null };

    await db
      .update(users)
      .set(unsafeTypeUser)
      .where(and(eq(users.tenant_id, tenant_id), eq(users.id, id)))
      .execute();

    return true;
  };
}
