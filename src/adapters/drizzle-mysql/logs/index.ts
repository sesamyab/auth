// WARNING - this file is generated from the SQLite adapter. Do not edit!
import { LogsDataAdapter } from "../../interfaces/Logs";
import { createLog } from "./create";
import { listLogs } from "./list";
import { getLogs } from "./get";
import { DrizzleMySqlDatabase } from "../../../services/drizzle-mysql";

export function createLogsAdapter(db: DrizzleMySqlDatabase): LogsDataAdapter {
  return {
    create: createLog(db),
    list: listLogs(db),
    get: getLogs(db),
  };
}
