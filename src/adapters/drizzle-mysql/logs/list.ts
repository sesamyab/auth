import { ListParams } from "../../interfaces/ListParams";
import { DrizzleMysqlDatabase } from "../../../services/drizzle";
import { logs } from "../../../../drizzle-mysql/schema";
import { eq } from "drizzle-orm";
import { ListLogsResponse } from "../../interfaces/Logs";
import { withParams } from "../helpers/params";
import { transformNullsToUndefined } from "../null-to-undefined";

export function listLogs(db: DrizzleMysqlDatabase) {
  return async (tenantId: string, params: ListParams) => {
    const query = db.select().from(logs).where(eq(logs.tenant_id, tenantId));

    const results = await withParams(query.$dynamic(), params);

    return {
      logs: results.map(transformNullsToUndefined),
      start: (params.page - 1) * params.per_page,
      limit: params.per_page,
      length: 0,
    } as unknown as ListLogsResponse;
  };
}
