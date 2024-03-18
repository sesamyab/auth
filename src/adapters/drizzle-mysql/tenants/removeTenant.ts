import { DrizzleMysqlDatabase } from "../../../services/drizzle";
import { tenants } from "../../../../drizzle-mysql/schema";
import { eq } from "drizzle-orm";

export function removeTenant(db: DrizzleMysqlDatabase) {
  return async (tenant_id: string): Promise<boolean> => {
    const results = await db.delete(tenants).where(eq(tenants.id, tenant_id));

    return results.rowsAffected === 1;
  };
}
