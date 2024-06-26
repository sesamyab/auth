import { AuthenticationCode } from "../../types/AuthenticationCode";

export interface AuthenticationCodesAdapter {
  create: (tenant_id: string, authCode: AuthenticationCode) => Promise<void>;
  get: (tenant_id: string, code: string) => Promise<AuthenticationCode>;
}
