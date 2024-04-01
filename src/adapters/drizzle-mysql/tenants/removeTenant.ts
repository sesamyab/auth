// WARNING - this file is generated from the SQLite adapter. Do not edit!
import { tenants } from "../../../../drizzle-mysql/schema";
import { eq } from "drizzle-orm";
import { DrizzleMySqlDatabase } from "../../../services/drizzle-mysql";

export function removeTenant(db: DrizzleMySqlDatabase) {
  return async (tenant_id: string): Promise<boolean> => {
    await db.delete(tenants).where(eq(tenants.id, tenant_id));

    return true;
  };
}
