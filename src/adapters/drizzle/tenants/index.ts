import { TenantsDataAdapter } from "../../interfaces/Tenants";
import { createTenant } from "./createTenant";
import { getTenant } from "./getTenant";
import { listTenants } from "./listTenants";
import { updateTenant } from "./updateTenant";
import { removeTenant } from "./removeTenant";
import { DrizzleDatabase } from "../../../services/drizzle";

export function createTenantsAdapter(db: DrizzleDatabase): TenantsDataAdapter {
  return {
    create: createTenant(db),
    get: getTenant(db),
    list: listTenants(db),
    update: updateTenant(db),
    remove: removeTenant(db),
  };
}
