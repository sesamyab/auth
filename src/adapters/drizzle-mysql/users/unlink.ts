import { DrizzleMysqlDatabase } from "../../../services/drizzle";
import { users } from "../../../../drizzle-mysql/schema";
import { and, eq } from "drizzle-orm";

export function unlink(db: DrizzleMysqlDatabase) {
  return async (tenant_id: string, id: string): Promise<boolean> => {
    const unsafeTypeUser: any = { linked_to: null };

    const results = await db
      .update(users)
      .set(unsafeTypeUser)
      .where(and(eq(users.tenant_id, tenant_id), eq(users.linked_to, id)))
      .execute();

    return results.rowsAffected === 1;
  };
}
