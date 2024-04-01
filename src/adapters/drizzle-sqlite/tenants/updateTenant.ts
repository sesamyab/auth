import { eq } from "drizzle-orm";
import { tenants } from "../../../../drizzle-sqlite/schema";
import { Tenant } from "../../../types";
import { DrizzleSQLiteDatabase } from "../../../services/drizzle-sqlite";

export function updateTenant(db: DrizzleSQLiteDatabase) {
  return async (id: string, tenant: Partial<Tenant>): Promise<void> => {
    const tenantWithModified = {
      ...tenant,
      id,
      updated_at: new Date().toISOString(),
    };

    await db
      .update(tenants)
      .set(tenantWithModified)
      .where(eq(tenants.id, id))
      .execute();
  };
}
