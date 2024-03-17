import { ListParams } from "../../interfaces/ListParams";
import { DrizzleDatabase } from "../../../services/drizzle";
import { logs } from "../../../../drizzle/schema";
import { eq } from "drizzle-orm";
import { ListLogsResponse } from "../../../adapters/interfaces/Logs";
import { withParams } from "../helpers/params";
import { transformNullsToUndefined } from "../null-to-undefined";

export function listLogs(db: DrizzleDatabase) {
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
