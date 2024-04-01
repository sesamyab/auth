import { LogsResponse } from "../../../types";
import { getLogResponse } from "../../../utils/logs";
import { logs } from "../../../../drizzle-sqlite/schema";
import { eq, and } from "drizzle-orm";
import { DrizzleSQLiteDatabase } from "../../../services/drizzle-sqlite";
import { transformNullsToUndefined } from "../null-to-undefined";

export function getLogs(db: DrizzleSQLiteDatabase) {
  return async (
    tenantId: string,
    logId: string,
  ): Promise<LogsResponse | null> => {
    const [log] = await db
      .select()
      .from(logs)
      .where(and(eq(logs.tenant_id, tenantId), eq(logs.id, logId)));

    if (!log) {
      return null;
    }

    const logResponse = getLogResponse(transformNullsToUndefined(log));

    return logResponse;
  };
}
