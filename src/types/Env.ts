import { IOAuth2ClientFactory } from "../services/oauth2-client";
import type { EmailOptions } from "../services/email/EmailOptions";
import { Client, DataAdapters, EmailService } from "authhero";

export type Env = {
  ISSUER: string;
  DD_API_KEY: string;
  JWKS_URL: string;
  JWKS_SERVICE: Fetcher;
  API_URL: string;
  IMAGE_PROXY_URL: string;
  DATABASE_HOST: string;
  DATABASE_PASSWORD: string;
  DATABASE_USERNAME: string;
  DEFAULT_TENANT?: string;
  DEFAULT_CLIENT?: string;
  TOKEN_SERVICE: Fetcher;
  AUTH_URL: string;
  READ_PERMISSION?: string;
  WRITE_PERMISSION?: string;
  ENVIRONMENT: string;
  SAML_SIGN_URL: string;
  oauth2ClientFactory: IOAuth2ClientFactory;
  data: DataAdapters;
  emailProviders?: { [key: string]: EmailService };
  sendEmail: (env: Env, client: Client, email: EmailOptions) => Promise<void>;
  signSAML: (
    xmlContent: string,
    privateKey: string,
    publicKey: string,
  ) => Promise<string>;
};
