import { HonoRequest } from "hono";

export function getClientInfo(req: HonoRequest) {
  return {
    auth0Client: req.query("auth0Client")?.slice(0, 256),
    ip: req.header("x-real-ip")?.slice(0, 45),
    useragent: req.header("user-agent")?.slice(0, 256),
  };
}
