import { Totals } from "../../types/auth0/Totals";
import { LogResponse, SqlLog } from "../../types/";
import { ListParams } from "./ListParams";

export interface ListLogsResponse extends Totals {
  logs: LogResponse[];
}

export interface LogsDataAdapter {
  create(tenantId: string, params: LogResponse): Promise<SqlLog>;
  list(tenantId: string, params: ListParams): Promise<ListLogsResponse>;
  get(tenantId: string, logId: string): Promise<LogResponse | null>;
}
