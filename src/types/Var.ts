import { Auth0Client } from "@authhero/adapter-interfaces";
import { z } from "zod";

export type Var = {
  startAt: number;
  userId?: string;
  client_id?: string;
  description?: string;
  user?: {
    sub: string;
    azp: string;
    permissions: string[];
  };
  body?: unknown;
  userName?: string;
  tenant_id?: string;
  connection_id?: string;
  connection?: string;
  auth0_client?: z.infer<typeof Auth0Client>;
  log?: string;
  strategy?: string;
  strategy_type?: string;
  session_connection?: string;
  audience?: string;
  scope?: string[];
};
