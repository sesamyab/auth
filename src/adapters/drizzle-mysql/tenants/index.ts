// WARNING - this file is generated from the SQLite adapter. Do not edit!
import { TenantsDataAdapter } from "../../interfaces/Tenants";
import { createTenant } from "./create";
import { get } from "./get";
import { listTenants } from "./list";
import { updateTenant } from "./updateTenant";
import { removeTenant } from "./removeTenant";
import { DrizzleMySqlDatabase } from "../../../services/drizzle-mysql";

export function createTenantsAdapter(
  db: DrizzleMySqlDatabase,
): TenantsDataAdapter {
  return {
    create: createTenant(db),
    get: get(db),
    list: listTenants(db),
    update: updateTenant(db),
    remove: removeTenant(db),
  };
}
