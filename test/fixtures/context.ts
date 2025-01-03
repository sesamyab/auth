import { Context } from "hono";
import {
  Application,
  ConnectionInsert,
  Domain,
  Password,
  SessionInsert,
  Tenant,
  User,
} from "authhero";
import { Env } from "../../src/types";
import { EmailOptions } from "../../src/services/email/EmailOptions";
import { Var } from "../../src/types/Var";
import { getCertificate } from "../integration/helpers/token";
import { sendLink, sendCode } from "../../src/controllers/email";
import {
  APPLICATION_FIXTURE,
  TENANT_FIXTURE,
  CONNECTIONS_FIXTURE,
  DOMAINS_FIXTURE,
} from "./client";
import { migrateToLatest } from "../../migrate/migrate";
import SQLite from "better-sqlite3";
import { Kysely, SqliteDialect } from "kysely";
import createAdapters, { Database } from "@authhero/kysely-adapter";

interface ContextFixtureParams {
  headers?: { [key: string]: string };
  stateData?: { [key: string]: string };
  sessions?: SessionInsert[];
  passwords?: Password[];
  users?: User[];
  userData?: { [key: string]: string | boolean };
  email?: {
    sendLink?: typeof sendLink;
    sendCode?: typeof sendCode;
  };
  logs?: any[];
  applications?: Application[];
  tenants?: Tenant[];
  connections?: ConnectionInsert[];
  domains?: Domain[];
}

export async function contextFixture(
  params?: ContextFixtureParams,
): Promise<Context<{ Bindings: Env; Variables: Var }>> {
  const {
    headers = {},
    logs = [],
    sessions,
    users,
    passwords,
    email,
    connections,
    applications,
    tenants,
    domains,
  } = params || {};

  const dialect = new SqliteDialect({
    database: new SQLite(":memory:"),
  });

  const db = new Kysely<Database>({ dialect: dialect });
  await migrateToLatest(dialect, false, db);

  const data = createAdapters(db);

  // seed default settings------------------
  await data.tenants.create({
    id: "DEFAULT_SETTINGS",
    name: "Default Settings",
    sender_email: "foo@sesamy.com",
    sender_name: "Sesamy",
    audience: "https://sesamy.com",
  });
  await data.applications.create("DEFAULT_SETTINGS", {
    id: "DEFAULT_CLIENT",
    name: "Default Client",
    email_validation: "enabled",
    client_secret: "secret",
    disable_sign_ups: false,
  });
  //----------------------------------------

  const seedingClient = !!applications || !!tenants || !!connections;

  if (!seedingClient) {
    await data.tenants.create(TENANT_FIXTURE);
    await data.applications.create(TENANT_FIXTURE.id, APPLICATION_FIXTURE);
    await data.connections.create(TENANT_FIXTURE.id, CONNECTIONS_FIXTURE[0]);
    await data.connections.create(TENANT_FIXTURE.id, CONNECTIONS_FIXTURE[1]);
    await data.domains.create(TENANT_FIXTURE.id, DOMAINS_FIXTURE[0]);
  } else {
    if (tenants) {
      await Promise.all(tenants.map((tenant) => data.tenants.create(tenant)));
    }
    if (applications) {
      applications.forEach((application) => {
        data.applications.create(TENANT_FIXTURE.id, application);
      });
    }
    if (connections) {
      connections.forEach((connection) => {
        data.connections.create(TENANT_FIXTURE.id, connection);
      });
    }
    if (domains) {
      domains.forEach((domain) => {
        data.domains.create(TENANT_FIXTURE.id, domain);
      });
    }
  }

  if (users) {
    users.forEach((user) => {
      data.users.create(TENANT_FIXTURE.id, user);
    });
  }

  if (sessions) {
    sessions.forEach(async (session) => {
      data.sessions.create(TENANT_FIXTURE.id, session);
    });
  }

  if (passwords) {
    passwords.forEach((password) => {
      data.passwords.create(TENANT_FIXTURE.id, password);
    });
  }

  // Add a known certificate
  const signingKey = await getCertificate();
  await data.keys.create(signingKey);

  return {
    set: () => {},
    req: {
      header: (key: string) => headers[key],
    },
    env: {
      ISSUER: "https://auth.example.com/",
      API_URL: "https://api.sesamy.dev",
      ENVIRONMENT: "dev",
      sendEmail: async (emailOptions: EmailOptions) => {
        logs.push(emailOptions);
      },
      IMAGE_PROXY_URL: "https://imgproxy.dev.sesamy.cloud",
      data: {
        ...data,
        email,
        logs: {
          create: () => {},
        },
      },
    },
  } as unknown as Context<{ Bindings: Env; Variables: Var }>;
}
