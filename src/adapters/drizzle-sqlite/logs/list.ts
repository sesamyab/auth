import { ListParams } from "../../interfaces/ListParams";
import { logs } from "../../../../drizzle-sqlite/schema";
import { eq } from "drizzle-orm";
import { withParams } from "../helpers/params";
import { transformNullsToUndefined } from "../null-to-undefined";
import { DrizzleSQLiteDatabase } from "../../../services/drizzle-sqlite";

export function listLogs(db: DrizzleSQLiteDatabase) {
  return async (tenantId: string, params: ListParams) => {
    const query = db.select().from(logs).where(eq(logs.tenant_id, tenantId));

    const results = await withParams(query.$dynamic(), params);

    return {
      logs: results.map(transformNullsToUndefined),
      start: (params.page - 1) * params.per_page,
      limit: params.per_page,
      length: 0,
    };
  };
}
