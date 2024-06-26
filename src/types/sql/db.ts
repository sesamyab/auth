import { Domain } from "../Domain";
import {
  Tenant,
  Application,
  Certificate,
  Member,
  Migration,
  SqlSession,
  SqlUser,
  SqlCode,
  SqlTicket,
  SqlOTP,
  SqlPassword,
  SqlUniversalLoginSession,
  SqlLog,
} from "../";
import { Connection } from "../Connection";
import { SqlBranding } from "./Branding";
import { SqlAuthenticationCode } from "./AuthenticationCode";

// Keys of this interface are table names.
export interface Database {
  authentication_codes: SqlAuthenticationCode;
  branding: SqlBranding;
  codes: SqlCode;
  domains: Domain & { tenant_id: string };
  keys: Certificate;
  users: SqlUser;
  members: Member;
  applications: Application & { tenant_id: string };
  connections: Connection & { tenant_id: string };
  migrations: Migration;
  otps: SqlOTP;
  passwords: SqlPassword;
  sessions: SqlSession;
  tenants: Tenant;
  tickets: SqlTicket;
  universal_login_sessions: SqlUniversalLoginSession;
  logs: SqlLog;
}
