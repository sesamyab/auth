// WARNING - this file is generated from the SQLite adapter. Do not edit!
import { ListParams } from "../../interfaces/ListParams";
import { logs } from "../../../../drizzle-mysql/schema";
import { eq } from "drizzle-orm";
import { withParams } from "../helpers/params";
import { transformNullsToUndefined } from "../null-to-undefined";
import { DrizzleMySqlDatabase } from "../../../services/drizzle-mysql";

export function listLogs(db: DrizzleMySqlDatabase) {
  return async (tenantId: string, params: ListParams) => {
    const query = db.select().from(logs).where(eq(logs.tenant_id, tenantId));

    const results = await withParams(query.$dynamic(), params);

    return {
      logs: results
        .map(transformNullsToUndefined)
        // TODO: A fix to make it compatible with kysely
        .map((log) => ({
          ...log,
          client_id: log.client_id || null,
          log_id: log.id,
          _id: log.id,
          details: log.details ? JSON.parse(log.details) : null,
        })),
      start: (params.page - 1) * params.per_page,
      limit: params.per_page,
      length: 0,
    };
  };
}
