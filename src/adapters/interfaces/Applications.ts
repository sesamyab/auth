import { Totals } from "../../types/auth0";
import { Application } from "../../types";
import { ListParams } from "./ListParams";

export interface CreateApplicationParams {
  name: string;
  allowed_web_origins: string;
  allowed_callback_urls: string;
  allowed_logout_urls: string;
  email_validation: "enabled" | "disabled" | "enforced";
  client_secret: string;
  id: string;
}

export interface ApplicationsAdapter {
  create(
    tenant_id: string,
    params: CreateApplicationParams,
  ): Promise<Application>;
  list(
    tenant_id: string,
    params: ListParams,
  ): Promise<{ applications: Application[]; totals?: Totals }>;
}
