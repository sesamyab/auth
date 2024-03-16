import { eq } from "drizzle-orm";
import { tenants } from "../../../../drizzle/schema";
import { DrizzleDatabase } from "../../../services/drizzle";
import { Tenant, tenantSchema } from "../../../types";

export function getTenant(db: DrizzleDatabase) {
  return async (id: string): Promise<Tenant | undefined> => {
    const result = db.query.tenants.findFirst({
      where: eq(tenants.id, id),
    });

    if (!result) return undefined;

    return tenantSchema.parse(result);
  };
}
