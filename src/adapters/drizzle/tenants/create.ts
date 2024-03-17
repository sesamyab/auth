import { nanoid } from "nanoid";
import { Tenant } from "../../../types";
import { CreateTenantParams } from "../../interfaces/Tenants";
import { DrizzleDatabase } from "../../../services/drizzle";
import { tenants } from "../../../../drizzle/schema";

export function createTenant(db: DrizzleDatabase) {
  return async (params: CreateTenantParams): Promise<Tenant> => {
    const tenant: Tenant = {
      id: params.id || nanoid(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...params,
    };

    await db.insert(tenants).values(tenant).execute();

    return tenant;
  };
}
