import {
  Application,
  AuthorizationResponseMode,
  AuthorizationResponseType,
  Connection,
  Domain,
  Tenant,
} from "authhero";

export const APPLICATION_FIXTURE: Application = {
  id: "clientId",
  name: "clientName",
  email_validation: "enabled",
  client_secret: "clientSecret",
  created_at: "created_at",
  updated_at: "updated_at",
  disable_sign_ups: false,
};

export const TENANT_FIXTURE: Tenant = {
  id: "tenantId",
  name: "tenantName",
  audience: "audience",
  sender_email: "senderEmail",
  sender_name: "senderName",
  created_at: "created_at",
  updated_at: "updated_at",
};

export const CONNECTIONS_FIXTURE: Connection[] = [
  {
    id: "connectionId1",
    name: "google-oauth2",
    strategy: "google-oauth2",
    options: {
      client_id: "googleClientId",
      client_secret: "googleClientSecret",
      authorization_endpoint: "https://accounts.google.com/o/oauth2/v2/auth",
      token_endpoint: "https://oauth2.googleapis.com/token",
      scope: "openid profile email",
    },
    response_mode: AuthorizationResponseMode.QUERY,
    response_type: AuthorizationResponseType.CODE,
    created_at: "created_at",
    updated_at: "updated_at",
  },
  {
    id: "connectionId2",
    name: "facebook",
    strategy: "facebook",
    options: {
      client_id: "facebookClientId",
      client_secret: "facebookClientSecret",
      authorization_endpoint: "https://graph.facebook.com/oauth/access_token",
      token_endpoint: "https://www.facebook.com/dialog/oauth",
      scope: "email public_profile",
    },
    response_mode: AuthorizationResponseMode.QUERY,
    response_type: AuthorizationResponseType.CODE,
    created_at: "created_at",
    updated_at: "updated_at",
  },
];

export const DOMAINS_FIXTURE: Domain[] = [
  {
    id: "domainId",
    domain: "example2.com",
    email_api_key: "",
    email_service: "mailgun",
    created_at: "created_at",
    updated_at: "updated_at",
    dkim_private_key: "dkimPrivateKey",
    dkim_public_key: "",
  },
];
