import { users } from "../../../../drizzle-sqlite/schema";
import { and, eq } from "drizzle-orm";
import { DrizzleSQLiteDatabase } from "../../../services/drizzle-sqlite";

export function remove(db: DrizzleSQLiteDatabase) {
  return async (tenant_id: string, id: string): Promise<boolean> => {
    await db
      .delete(users)
      .where(and(eq(users.tenant_id, tenant_id), eq(users.id, id)))
      .execute();

    return true;
  };
}
