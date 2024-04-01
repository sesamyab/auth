import { eq } from "drizzle-orm";
import { tenants } from "../../../../drizzle-sqlite/schema";
import { Tenant, tenantSchema } from "../../../types";
import { transformNullsToUndefined } from "../null-to-undefined";
import { DrizzleSQLiteDatabase } from "../../../services/drizzle-sqlite";

export function get(db: DrizzleSQLiteDatabase) {
  return async (id: string): Promise<Tenant | undefined> => {
    const [result] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, id))
      .limit(1)
      .execute();

    if (!result) {
      return undefined;
    }

    return tenantSchema.parse(transformNullsToUndefined(result));
  };
}
