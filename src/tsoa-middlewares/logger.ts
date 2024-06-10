import { Context } from "hono";
import { Env } from "../types";
import { Var } from "../types/Var";
import instanceToJson from "../utils/instanceToJson";
import { LogType, Log } from "../types";

export function createTypeLog(
  logType: LogType,
  ctx: Context<{ Bindings: Env; Variables: Var }>,
  body: unknown,
  description?: string,
  client_id?: string,
  userId?: string,
  userName?: string,
  connection?: string,
  // TODO - if happy with this approach: maybe need util to create this...
  auth0_client?: any,
) {
  const log: Log = {
    type: logType,
    description: description || "",
    ip: ctx.req.header("x-real-ip") || "",
    user_agent: ctx.req.header("user-agent") || "",
    date: new Date().toISOString(),
    details: {
      request: {
        method: ctx.req.method,
        path: ctx.req.path,
        headers: instanceToJson(ctx.req.raw.headers),
        qs: ctx.req.queries(),
        body,
      },
    },
    isMobile: false,
    client_id,
    client_name: "",
    user_id: userId || "",
    hostname: ctx.req.header("host") || "",
    user_name: userName || "",
    connection_id: "",
    connection: connection || "",
    auth0_client: auth0_client,
    strategy: "",
    strategy_type: "",
    audience: "",
    scope: [],
  };

  return log;
}
