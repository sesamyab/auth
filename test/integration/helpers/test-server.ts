import { Kysely, SqliteDialect } from "kysely";
import SQLite from "better-sqlite3";
import bcryptjs from "bcryptjs";
import { migrateToLatest } from "../../../migrate/migrate";
import { getCertificate } from "./token";
import type { EmailOptions } from "../../../src/services/email/EmailOptions";
import {
  Application,
  AuthorizationResponseMode,
  AuthorizationResponseType,
  Client,
  Connection,
  DataAdapters,
  Tenant,
} from "authhero";
import createAdapters, { Database } from "@authhero/kysely-adapter";
import * as x509 from "@peculiar/x509";
import createApp from "../../../src/app";
import { Env } from "../../../src/types";

type getEnvParams = {
  testTenantLanguage?: string;
  emailValidation?: "enabled" | "enforced" | "disabled";
};

export const testPasswordUser = {
  user_id: "auth2|userId",
  password: "Test1234!",
};

export async function getTestServer(args: getEnvParams = {}) {
  const dialect = new SqliteDialect({
    database: new SQLite(":memory:"),
  });

  const emails: EmailOptions[] = [];

  function sendEmailAdapter(
    env: Env,
    client: Client,
    emailOptions: EmailOptions,
  ) {
    emails.push(emailOptions);

    return "ok";
  }

  // Don't use getDb here as it will reuse the connection
  const db = new Kysely<Database>({ dialect: dialect });

  await migrateToLatest(dialect, false, db);

  const data: DataAdapters = createAdapters(db);
  const signingKey = await getCertificate();

  await data.keys.create(signingKey);

  // Create Default Settings----------------------------------------
  await data.tenants.create({
    id: "DEFAULT_SETTINGS",
    name: "Default Settings",
    sender_email: "login@example.com",
    sender_name: "SenderName",
    audience: "https://sesamy.com",
  });

  await data.applications.create("DEFAULT_SETTINGS", {
    id: "DEFAULT_CLIENT",
    name: "Default Client",
    callbacks: [
      // TODO: can we remove one?
      "https://example.com/callback",
      "https://login.example.com/callback",
    ],
    email_validation: "enabled",
    client_secret: "secret",
    disable_sign_ups: false,
  });

  await data.connections.create("DEFAULT_SETTINGS", {
    id: "DEFAULT_CONNECTION",
    name: "demo-social-provider",
    strategy: "oauth2",
    options: {
      client_id: "socialClientId",
      client_secret: "socialClientSecret",
      authorization_endpoint: "https://example.com/o/oauth2/v2/auth",
      token_endpoint: "https://example.com/token",
      scope: "openid profile email",
    },
    response_mode: AuthorizationResponseMode.QUERY,
    response_type: AuthorizationResponseType.CODE,
  });
  await data.connections.create("DEFAULT_SETTINGS", {
    id: "DEFAULT_CONNECTION2",
    name: "other-social-provider",
    strategy: "oauth2",
    options: {
      client_id: "otherSocialClientId",
      client_secret: "otherSocialClientSecret",
      authorization_endpoint: "https://example.com/other/o/oauth2/v2/auth",
      token_endpoint: "https://example.com/other/token",
      scope: "openid profile email",
    },
    response_mode: AuthorizationResponseMode.QUERY,
    response_type: AuthorizationResponseType.CODE,
  });

  // Create fixtures----------------------------------------

  const testTenant: Tenant = {
    id: "tenantId",
    name: "Test Tenant",
    audience: "https://example.com",
    sender_email: "login@example.com",
    sender_name: "SenderName",
    support_url: "https://example.com/support",
    created_at: "created_at",
    updated_at: "updated_at",
    language: args.testTenantLanguage,
  };

  const testApplication: Application = {
    id: "clientId",
    name: "Test Client",
    client_secret: "clientSecret",
    email_validation: args.emailValidation || "enforced",
    created_at: "created_at",
    updated_at: "updated_at",
    disable_sign_ups: false,
    addons: {
      samlp: {
        recipient: "https://scplay.skiclassics.com/saml/consume",
        audience: "https://scplay.skiclassics.com/saml/metadata",
      },
    },
  };

  const testApplication2: Application = {
    id: "otherClientId",
    name: "Test Other Client",
    client_secret: "3nwvu0mzibzb0spr7z5d2g",
    email_validation: args.emailValidation || "enforced",
    created_at: "created_at",
    updated_at: "updated_at",
    disable_sign_ups: false,
  };

  const testConnection1: Connection = {
    id: "connectionId1",
    name: "demo-social-provider",
    strategy: "oauth2",
    options: {},
    created_at: "created_at",
    updated_at: "updated_at",
  };

  const testConnection2: Connection = {
    id: "connectionId2",
    name: "other-social-provider",
    strategy: "oauth2",
    options: {},
    created_at: "created_at",
    updated_at: "updated_at",
  };

  const anotherTenant: Tenant = {
    id: "otherTenant",
    name: "Other Tenant",
    audience: "https://another.example.com",
    sender_email: "hello@another.example.com",
    sender_name: "AnotherName",
    created_at: "created_at",
    updated_at: "updated_at",
  };
  const anotherAppOnAnotherTenant: Application = {
    id: "otherClientIdOnOtherTenant",
    name: "Test Client",
    client_secret: "XjI8-WPndjtNHDu4ybXrD",
    email_validation: "enforced",
    created_at: "created_at",
    updated_at: "updated_at",
    disable_sign_ups: false,
  };

  await data.tenants.create(testTenant);
  await data.tenants.create(anotherTenant);
  await data.applications.create("tenantId", testApplication);
  await data.applications.create("tenantId", testApplication2);
  await data.applications.create("otherTenant", anotherAppOnAnotherTenant);
  await data.connections.create("tenantId", testConnection1);
  await data.connections.create("tenantId", testConnection2);
  await data.connections.create("tenantId", {
    id: "facebook",
    name: "facebook",
    strategy: "facebook",
  });
  await data.connections.create("tenantId", {
    id: "google-oauth2",
    name: "google-oauth2",
    strategy: "google-oauth2",
  });
  await data.connections.create("tenantId", {
    id: "apple",
    name: "apple",
    strategy: "apple",
  });
  await data.connections.create("tenantId", {
    id: "auth2",
    name: "auth2",
    strategy: "authhero",
  });

  await data.users.create("tenantId", {
    user_id: "auth2|userId",
    email: "foo@example.com",
    email_verified: true,
    name: "Åkesson Þorsteinsson",
    nickname: "Åkesson Þorsteinsson",
    picture: "https://example.com/foo.png",
    provider: "auth2",
    connection: "Username-Password-Authentication",
    is_social: false,
  });

  await data.passwords.create("tenantId", {
    user_id: testPasswordUser.user_id,
    password: bcryptjs.hashSync(testPasswordUser.password, 10),
    algorithm: "bcrypt",
  });

  const certificate = new x509.X509Certificate(signingKey.cert);
  const publicKey = await certificate.publicKey.export();
  const jwkKey = await crypto.subtle.exportKey("jwk", publicKey);

  const env = {
    JWKS_URL: "https://example.com/.well-known/jwks.json",
    JWKS_SERVICE: {
      fetch: async () => ({
        ok: true,
        json: async () => ({
          keys: [{ ...jwkKey, kid: signingKey.kid }],
        }),
      }),
    },
    TOKEN_SERVICE: {
      fetch: async () => ({
        ok: true,
        json: async () => ({
          keys: [{ ...jwkKey, kid: signingKey.kid }],
        }),
      }),
    },
    data,
    sendEmail: sendEmailAdapter,
    ISSUER: "https://example.com/",
    READ_PERMISSION: "auth:read",
    WRITE_PERMISSION: "auth:write",
    API_URL: "https://api.sesamy.dev",
    ENVIRONMENT: "dev",
    db,
    signSAML: async () => "Mocked SAML Response",
  };

  const apps = createApp({ dataAdapter: data });
  return {
    ...apps,
    env,
    emails,
  };
}
