import { users } from "../../../../drizzle-sqlite/schema";
import { and, eq } from "drizzle-orm";
import { DrizzleSQLiteDatabase } from "../../../services/drizzle-sqlite";

export function unlink(db: DrizzleSQLiteDatabase) {
  return async (tenant_id: string, id: string): Promise<boolean> => {
    const unsafeTypeUser: any = { linked_to: null };

    await db
      .update(users)
      .set(unsafeTypeUser)
      .where(and(eq(users.tenant_id, tenant_id), eq(users.linked_to, id)))
      .execute();

    return true;
  };
}
