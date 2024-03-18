import { tenants } from "../../../../drizzle-sqlite/schema";
import { eq } from "drizzle-orm";
import { DrizzleSQLiteDatabase } from "../../../services/drizzle-sqlite";

export function removeTenant(db: DrizzleSQLiteDatabase) {
  return async (tenant_id: string): Promise<boolean> => {
    await db.delete(tenants).where(eq(tenants.id, tenant_id));

    return true;
  };
}
