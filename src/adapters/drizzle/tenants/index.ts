import { TenantsDataAdapter } from "../../interfaces/Tenants";
import { createTenant } from "./create";
import { get } from "./get";
import { listTenants } from "./list";
import { updateTenant } from "./updateTenant";
import { removeTenant } from "./removeTenant";
import { DrizzleDatabase } from "../../../services/drizzle";

export function createTenantsAdapter(db: DrizzleDatabase): TenantsDataAdapter {
  return {
    create: createTenant(db),
    get: get(db),
    list: listTenants(db),
    update: updateTenant(db),
    remove: removeTenant(db),
  };
}
