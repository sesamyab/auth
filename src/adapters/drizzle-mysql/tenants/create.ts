import { nanoid } from "nanoid";
import { Tenant } from "../../../types";
import { CreateTenantParams } from "../../interfaces/Tenants";
import { DrizzleMysqlDatabase } from "../../../services/drizzle";
import { tenants } from "../../../../drizzle-mysql/schema";
import { DrizzleSQLiteDatabase } from "../../../services/drizzle-sqlite";
import { insertInto } from "../helpers/insert";

export function createTenant(db: DrizzleMysqlDatabase | DrizzleSQLiteDatabase) {
  return async (params: CreateTenantParams): Promise<Tenant> => {
    const tenant: Tenant = {
      id: params.id || nanoid(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...params,
    };

    await insertInto(db, tenants).values(tenant).execute();

    return tenant;
  };
}
