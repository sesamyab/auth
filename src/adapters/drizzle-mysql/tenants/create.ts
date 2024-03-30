// WARNING - this file is generated from the SQLite adapter. Do not edit!
import { nanoid } from "nanoid";
import { Tenant } from "../../../types";
import { CreateTenantParams } from "../../interfaces/Tenants";
import { tenants } from "../../../../drizzle-mysql/schema";
import { DrizzleMysqlDatabase } from "../../../services/drizzle-mysql";

export function createTenant(db: DrizzleMysqlDatabase) {
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
