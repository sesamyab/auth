import { DrizzleMysqlDatabase } from "../../../services/drizzle";
import { users } from "../../../../drizzle-mysql/schema";
import { and, eq } from "drizzle-orm";

export function remove(db: DrizzleMysqlDatabase) {
  return async (tenant_id: string, id: string): Promise<boolean> => {
    // Planetscale has no cascading delete as it has no FK
    // so we manually remove any users first that have linked_to set to this id!
    await db
      .delete(users)
      .where(and(eq(users.tenant_id, tenant_id), eq(users.linked_to, id)))
      .execute();

    const results = await db
      .delete(users)
      .where(and(eq(users.tenant_id, tenant_id), eq(users.id, id)))
      .execute();

    return results.rowsAffected === 1;
  };
}
