import { eq } from "drizzle-orm";
import { tenants } from "../../../../drizzle/schema";
import { DrizzleDatabase } from "../../../services/drizzle";
import { Tenant, tenantSchema } from "../../../types";
import { transformNullsToUndefined } from "../null-to-undefined";

export function get(db: DrizzleDatabase) {
  return async (id: string): Promise<Tenant | undefined> => {
    const result = await db.query.tenants.findFirst({
      where: eq(tenants.id, id),
    });

    if (!result) {
      return undefined;
    }

    return tenantSchema.parse(transformNullsToUndefined(result));
  };
}
