import { eq } from "drizzle-orm";
import { tenants } from "../../../../drizzle-sqlite/schema";
import { Tenant, tenantSchema } from "../../../types";
import { transformNullsToUndefined } from "../null-to-undefined";
import { DrizzleSQLiteDatabase } from "../../../services/drizzle-sqlite";

export function get(db: DrizzleSQLiteDatabase) {
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
