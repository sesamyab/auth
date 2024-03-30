// WARNING - this file is generated from the SQLite adapter. Do not edit!
import { eq } from "drizzle-orm";
import { tenants } from "../../../../drizzle-mysql/schema";
import { Tenant } from "../../../types";
import { DrizzleMysqlDatabase } from "../../../services/drizzle-mysql";

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
