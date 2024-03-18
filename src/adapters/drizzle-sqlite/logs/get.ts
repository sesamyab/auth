import { LogsResponse, SqlLog } from "../../../types";
import { getLogResponse } from "../../../utils/logs";
import { logs } from "../../../../drizzle-mysql/schema";
import { eq, and } from "drizzle-orm";
import { DrizzleSQLiteDatabase } from "../../../services/drizzle-sqlite";

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

    // TODO: Use types from drizzle-orm
    const logResponse = getLogResponse(log as SqlLog);

    return logResponse;
  };
}
