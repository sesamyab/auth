import { Totals } from "../../types/auth0/Totals";
import { LogsResponse, SqlLog, Log } from "../../types/";
import { ListParams } from "./ListParams";

interface ListLogsResponse extends Totals {
  logs: LogsResponse[];
}

export interface LogsDataAdapter {
  create(tenantId: string, params: Log): Promise<SqlLog>;
  list(tenantId: string, params: ListParams): Promise<ListLogsResponse>;
  get(tenantId: string, logId: string): Promise<LogsResponse | null>;
}
