import { Auth0Client, Login } from "authhero";
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
  log?: string;
  strategy?: string;
  strategy_type?: string;
  session_connection?: string;
  // The universal auth routes stores the login session here
  login?: Login;
  // These could be replace by the login param above
  auth0_client?: z.infer<typeof Auth0Client>;
  audience?: string;
  scope?: string[];
};
