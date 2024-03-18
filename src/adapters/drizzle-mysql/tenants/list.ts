import { ListParams } from "../../interfaces/ListParams";
import { DrizzleMysqlDatabase } from "../../../services/drizzle";
import { z } from "zod";
import { tenantSchema } from "../../../types";
import { transformNullsToUndefined } from "../null-to-undefined";
import { tenants } from "../../../../drizzle-mysql/schema";
import { withParams } from "../helpers/params";
import { DrizzleSQLiteDatabase } from "../../../services/drizzle-sqlite";
import { selectCountFrom, selectFrom } from "../helpers/select";
import { MySqlSelectBase } from "drizzle-orm/mysql-core";

export function listTenants(db: DrizzleMysqlDatabase | DrizzleSQLiteDatabase) {
  return async (params: ListParams) => {
    const query = selectFrom(db, tenants);

    const result =
      query instanceof MySqlSelectBase
        ? await withParams(query.$dynamic(), params)
        : await query;

    const parsedResults = z
      .array(tenantSchema)
      .parse(result.map(transformNullsToUndefined));

    if (!params.include_totals) {
      return {
        tenants: parsedResults,
      };
    }

    const [totals] = await selectCountFrom(db, tenants);

    return {
      tenants: parsedResults,
      start: params.page * params.per_page,
      limit: params.per_page,
      length: totals.count,
    };
  };
}
