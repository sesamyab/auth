import { ListParams } from "../../interfaces/ListParams";
import { z } from "zod";
import { tenantSchema } from "../../../types";
import { transformNullsToUndefined } from "../null-to-undefined";
import { tenants } from "../../../../drizzle-sqlite/schema";
import { withParams } from "../helpers/params";
import { DrizzleSQLiteDatabase } from "../../../services/drizzle-sqlite";
import { count } from "drizzle-orm";

export function listTenants(db: DrizzleSQLiteDatabase) {
  return async (params: ListParams) => {
    const query = db.select().from(tenants);

    const result = await withParams(query.$dynamic(), params);

    const parsedResults = z
      .array(tenantSchema)
      .parse(result.map(transformNullsToUndefined));

    if (!params.include_totals) {
      return {
        tenants: parsedResults,
      };
    }

    const [totals] = await db.select({ count: count() }).from(tenants);

    return {
      tenants: parsedResults,
      start: params.page * params.per_page,
      limit: params.per_page,
      length: totals.count,
    };
  };
}