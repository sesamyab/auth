import { eq } from "drizzle-orm";
import { tenants } from "../../../../drizzle-mysql/schema";
import { DrizzleMysqlDatabase } from "../../../services/drizzle";
import { Tenant } from "../../../types";

export function updateTenant(db: DrizzleMysqlDatabase) {
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
