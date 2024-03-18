import { LogsDataAdapter } from "../../interfaces/Logs";
import { createLog } from "./create";
import { listLogs } from "./list";
import { getLogs } from "./get";
import { DrizzleMysqlDatabase } from "../../../services/drizzle";

export function createLogsAdapter(db: DrizzleMysqlDatabase): LogsDataAdapter {
  return {
    create: createLog(db),
    list: listLogs(db),
    get: getLogs(db),
  };
}
