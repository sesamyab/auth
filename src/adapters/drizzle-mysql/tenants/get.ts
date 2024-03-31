// WARNING - this file is generated from the SQLite adapter. Do not edit!
import { eq } from "drizzle-orm";
import { tenants } from "../../../../drizzle-mysql/schema";
import { Tenant, tenantSchema } from "../../../types";
import { transformNullsToUndefined } from "../null-to-undefined";
import { DrizzleMySqlDatabase } from "../../../services/drizzle-mysql";

export function get(db: DrizzleMySqlDatabase) {
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
