import { LogsDataAdapter } from "../../interfaces/Logs";
import { createLog } from "./create";
import { listLogs } from "./list";
import { getLogs } from "./get";
import { DrizzleSQLiteDatabase } from "../../../services/drizzle-sqlite";

export function createLogsAdapter(db: DrizzleSQLiteDatabase): LogsDataAdapter {
  return {
    create: createLog(db),
    list: listLogs(db),
    get: getLogs(db),
  };
}
