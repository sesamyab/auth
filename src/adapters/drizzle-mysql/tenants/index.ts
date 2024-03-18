import { TenantsDataAdapter } from "../../interfaces/Tenants";
import { createTenant } from "./create";
import { get } from "./get";
import { listTenants } from "./list";
import { updateTenant } from "./updateTenant";
import { removeTenant } from "./removeTenant";
import { DrizzleMysqlDatabase } from "../../../services/drizzle";

export function createTenantsAdapter(
  db: DrizzleMysqlDatabase,
): TenantsDataAdapter {
  return {
    create: createTenant(db),
    get: get(db),
    list: listTenants(db),
    update: updateTenant(db),
    remove: removeTenant(db),
  };
}
