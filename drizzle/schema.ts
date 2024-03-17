import {
  mysqlTable,
  mysqlSchema,
  AnyMySqlColumn,
  primaryKey,
  varchar,
  index,
  int,
  tinyint,
  unique,
  boolean,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

export const applications = mysqlTable(
  "applications",
  {
    id: varchar("id", { length: 255 }).notNull(),
    tenant_id: varchar("tenant_id", { length: 255 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    client_secret: varchar("client_secret", { length: 255 }),
    allowed_callback_urls: varchar("allowed_callback_urls", { length: 255 }),
    allowed_logout_urls: varchar("allowed_logout_urls", { length: 255 }),
    allowed_web_origins: varchar("allowed_web_origins", { length: 255 }),
    authentication_settings: varchar("authentication_settings", {
      length: 255,
    }),
    styling_settings: varchar("styling_settings", { length: 255 }),
    email_validation: varchar("email_validation", { length: 255 }),
    created_at: varchar("created_at", { length: 255 }),
    updated_at: varchar("updated_at", { length: 255 }),
  },
  (table) => {
    return {
      applications_id: primaryKey({
        columns: [table.id],
        name: "applications_id",
      }),
    };
  },
);

export const codes = mysqlTable(
  "codes",
  {
    id: varchar("id", { length: 255 }).notNull(),
    tenant_id: varchar("tenant_id", { length: 255 }).notNull(),
    user_id: varchar("user_id", { length: 255 }).notNull(),
    type: varchar("type", { length: 255 }).notNull(),
    created_at: varchar("created_at", { length: 255 }).notNull(),
    expires_at: varchar("expires_at", { length: 255 }).notNull(),
    used_at: varchar("used_at", { length: 255 }),
    code: varchar("code", { length: 255 }).notNull(),
  },
  (table) => {
    return {
      expires_at_idx: index("expires_at").on(table.expires_at),
      codes_id: primaryKey({ columns: [table.id], name: "codes_id" }),
    };
  },
);

export const connections = mysqlTable(
  "connections",
  {
    id: varchar("id", { length: 255 }).notNull(),
    tenant_id: varchar("tenant_id", { length: 255 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    client_id: varchar("client_id", { length: 255 }),
    client_secret: varchar("client_secret", { length: 255 }),
    authorization_endpoint: varchar("authorization_endpoint", { length: 255 }),
    token_endpoint: varchar("token_endpoint", { length: 255 }),
    scope: varchar("scope", { length: 255 }),
    response_type: varchar("response_type", { length: 255 }),
    response_mode: varchar("response_mode", { length: 255 }),
    private_key: varchar("private_key", { length: 767 }),
    kid: varchar("kid", { length: 255 }),
    team_id: varchar("team_id", { length: 255 }),
    created_at: varchar("created_at", { length: 255 }),
    updated_at: varchar("updated_at", { length: 255 }),
    userinfo_endpoint: varchar("userinfo_endpoint", { length: 256 }),
  },
  (table) => {
    return {
      connections_id: primaryKey({
        columns: [table.id],
        name: "connections_id",
      }),
    };
  },
);

export const domains = mysqlTable(
  "domains",
  {
    id: varchar("id", { length: 255 }).notNull(),
    tenant_id: varchar("tenant_id", { length: 255 }).notNull(),
    domain: varchar("domain", { length: 255 }).notNull(),
    email_service: varchar("email_service", { length: 255 }),
    email_api_key: varchar("email_api_key", { length: 255 }),
    dkim_private_key: varchar("dkim_private_key", { length: 2048 }),
    dkim_public_key: varchar("dkim_public_key", { length: 2048 }),
    created_at: varchar("created_at", { length: 255 }),
    updated_at: varchar("updated_at", { length: 255 }),
  },
  (table) => {
    return {
      domains_id: primaryKey({ columns: [table.id], name: "domains_id" }),
    };
  },
);

export const keys = mysqlTable(
  "keys",
  {
    kid: varchar("kid", { length: 255 }).notNull(),
    tenant_id: varchar("tenant_id", { length: 255 }),
    private_key: varchar("private_key", { length: 8192 }),
    public_key: varchar("public_key", { length: 1024 }),
    created_at: varchar("created_at", { length: 255 }),
    revoked_at: varchar("revoked_at", { length: 255 }),
  },
  (table) => {
    return {
      keys_kid: primaryKey({ columns: [table.kid], name: "keys_kid" }),
    };
  },
);

export const kysely_migration = mysqlTable(
  "kysely_migration",
  {
    name: varchar("name", { length: 255 }).notNull(),
    timestamp: varchar("timestamp", { length: 255 }).notNull(),
  },
  (table) => {
    return {
      kysely_migration_name: primaryKey({
        columns: [table.name],
        name: "kysely_migration_name",
      }),
    };
  },
);

export const kysely_migration_lock = mysqlTable(
  "kysely_migration_lock",
  {
    id: varchar("id", { length: 255 }).notNull(),
    is_locked: int("is_locked").default(0).notNull(),
  },
  (table) => {
    return {
      kysely_migration_lock_id: primaryKey({
        columns: [table.id],
        name: "kysely_migration_lock_id",
      }),
    };
  },
);

export const logs = mysqlTable(
  "logs",
  {
    id: varchar("id", { length: 255 }).notNull(),
    tenant_id: varchar("tenant_id", { length: 255 }).notNull(),
    user_id: varchar("user_id", { length: 255 }).notNull(),
    ip: varchar("ip", { length: 255 }),
    type: varchar("type", { length: 255 }),
    date: varchar("date", { length: 255 }),
    description: varchar("description", { length: 255 }),
    client_id: varchar("client_id", { length: 255 }),
    client_name: varchar("client_name", { length: 255 }),
    user_agent: varchar("user_agent", { length: 255 }),
    details: varchar("details", { length: 8192 }),
    user_name: varchar("user_name", { length: 255 }),
    auth0_client: varchar("auth0_client", { length: 255 }),
    isMobile: tinyint("isMobile"),
    connection: varchar("connection", { length: 255 }),
    connection_id: varchar("connection_id", { length: 255 }),
    audience: varchar("audience", { length: 255 }),
    scope: varchar("scope", { length: 255 }),
    strategy: varchar("strategy", { length: 255 }),
    strategy_type: varchar("strategy_type", { length: 255 }),
    hostname: varchar("hostname", { length: 255 }),
    session_connection: varchar("session_connection", { length: 255 }),
  },
  (table) => {
    return {
      user_id: index("logs_user_id").on(table.user_id),
      tenant_id: index("logs_tenant_id").on(table.tenant_id),
      date: index("logs_date").on(table.date),
      logs_id: primaryKey({ columns: [table.id], name: "logs_id" }),
    };
  },
);

export const members = mysqlTable(
  "members",
  {
    id: varchar("id", { length: 255 }).notNull(),
    tenant_id: varchar("tenant_id", { length: 255 }).notNull(),
    sub: varchar("sub", { length: 255 }),
    email: varchar("email", { length: 255 }),
    name: varchar("name", { length: 255 }),
    status: varchar("status", { length: 255 }),
    role: varchar("role", { length: 255 }),
    picture: varchar("picture", { length: 255 }),
    created_at: varchar("created_at", { length: 255 }),
    updated_at: varchar("updated_at", { length: 255 }),
  },
  (table) => {
    return {
      members_id: primaryKey({ columns: [table.id], name: "members_id" }),
    };
  },
);

export const migrations = mysqlTable(
  "migrations",
  {
    id: varchar("id", { length: 255 }).notNull(),
    tenant_id: varchar("tenant_id", { length: 255 }).notNull(),
    provider: varchar("provider", { length: 255 }),
    client_id: varchar("client_id", { length: 255 }),
    origin: varchar("origin", { length: 255 }),
    domain: varchar("domain", { length: 255 }),
    created_at: varchar("created_at", { length: 255 }),
    updated_at: varchar("updated_at", { length: 255 }),
  },
  (table) => {
    return {
      migrations_id: primaryKey({ columns: [table.id], name: "migrations_id" }),
    };
  },
);

export const otps = mysqlTable(
  "otps",
  {
    tenant_id: varchar("tenant_id", { length: 255 }).notNull(),
    id: varchar("id", { length: 255 }).notNull(),
    client_id: varchar("client_id", { length: 255 }).notNull(),
    code: varchar("code", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    user_id: varchar("user_id", { length: 255 }),
    send: varchar("send", { length: 255 }),
    nonce: varchar("nonce", { length: 255 }),
    state: varchar("state", { length: 1024 }),
    scope: varchar("scope", { length: 1024 }),
    response_type: varchar("response_type", { length: 256 }),
    response_mode: varchar("response_mode", { length: 256 }),
    redirect_uri: varchar("redirect_uri", { length: 1024 }),
    created_at: varchar("created_at", { length: 255 }).notNull(),
    expires_at: varchar("expires_at", { length: 255 }).notNull(),
    used_at: varchar("used_at", { length: 255 }),
    audience: varchar("audience", { length: 255 }),
  },
  (table) => {
    return {
      email_idx: index("email").on(table.email),
      expires_at_idx: index("expires_at").on(table.expires_at),
      otps_id: primaryKey({ columns: [table.id], name: "otps_id" }),
    };
  },
);

export const passwords = mysqlTable(
  "passwords",
  {
    tenant_id: varchar("tenant_id", { length: 255 }).notNull(),
    user_id: varchar("user_id", { length: 255 }).notNull(),
    created_at: varchar("created_at", { length: 255 }),
    updated_at: varchar("updated_at", { length: 255 }),
    password: varchar("password", { length: 255 }).notNull(),
  },
  (table) => {
    return {
      passwords_user_id: primaryKey({
        columns: [table.user_id],
        name: "passwords_user_id",
      }),
    };
  },
);

export const sessions = mysqlTable(
  "sessions",
  {
    tenant_id: varchar("tenant_id", { length: 255 }).notNull(),
    id: varchar("id", { length: 255 }).notNull(),
    client_id: varchar("client_id", { length: 255 }).notNull(),
    user_id: varchar("user_id", { length: 255 }).notNull(),
    created_at: varchar("created_at", { length: 255 }),
    expires_at: varchar("expires_at", { length: 255 }),
    used_at: varchar("used_at", { length: 255 }),
    deleted_at: varchar("deleted_at", { length: 255 }),
  },
  (table) => {
    return {
      sessions_id: primaryKey({ columns: [table.id], name: "sessions_id" }),
    };
  },
);

export const tenants = mysqlTable(
  "tenants",
  {
    id: varchar("id", { length: 255 }).notNull(),
    name: varchar("name", { length: 255 }),
    audience: varchar("audience", { length: 255 }),
    sender_email: varchar("sender_email", { length: 255 }),
    sender_name: varchar("sender_name", { length: 255 }),
    language: varchar("language", { length: 255 }),
    logo: varchar("logo", { length: 255 }),
    primary_color: varchar("primary_color", { length: 255 }),
    secondary_color: varchar("secondary_color", { length: 255 }),
    created_at: varchar("created_at", { length: 255 }),
    updated_at: varchar("updated_at", { length: 255 }),
    support_url: varchar("support_url", { length: 255 }),
  },
  (table) => {
    return {
      tenants_id: primaryKey({ columns: [table.id], name: "tenants_id" }),
    };
  },
);

export const tickets = mysqlTable(
  "tickets",
  {
    tenant_id: varchar("tenant_id", { length: 255 }).notNull(),
    id: varchar("id", { length: 255 }).notNull(),
    client_id: varchar("client_id", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    nonce: varchar("nonce", { length: 255 }),
    state: varchar("state", { length: 1024 }),
    scope: varchar("scope", { length: 1024 }),
    response_type: varchar("response_type", { length: 256 }),
    response_mode: varchar("response_mode", { length: 256 }),
    redirect_uri: varchar("redirect_uri", { length: 1024 }),
    created_at: varchar("created_at", { length: 255 }).notNull(),
    expires_at: varchar("expires_at", { length: 255 }).notNull(),
    used_at: varchar("used_at", { length: 255 }),
  },
  (table) => {
    return {
      tickets_id: primaryKey({ columns: [table.id], name: "tickets_id" }),
    };
  },
);

export const universal_login_sessions = mysqlTable(
  "universal_login_sessions",
  {
    id: varchar("id", { length: 255 }).notNull(),
    tenant_id: varchar("tenant_id", { length: 255 }).notNull(),
    client_id: varchar("client_id", { length: 255 }).notNull(),
    username: varchar("username", { length: 255 }),
    response_type: varchar("response_type", { length: 255 }),
    response_mode: varchar("response_mode", { length: 255 }),
    audience: varchar("audience", { length: 255 }),
    scope: varchar("scope", { length: 511 }),
    state: varchar("state", { length: 511 }),
    code_challenge_method: varchar("code_challenge_method", { length: 256 }),
    code_challenge: varchar("code_challenge", { length: 256 }),
    redirect_uri: varchar("redirect_uri", { length: 256 }),
    created_at: varchar("created_at", { length: 255 }).notNull(),
    updated_at: varchar("updated_at", { length: 255 }).notNull(),
    expires_at: varchar("expires_at", { length: 255 }).notNull(),
    nonce: varchar("nonce", { length: 255 }),
  },
  (table) => {
    return {
      universal_login_sessions_id: primaryKey({
        columns: [table.id],
        name: "universal_login_sessions_id",
      }),
    };
  },
);

export const users = mysqlTable(
  "users",
  {
    id: varchar("id", { length: 255 }).notNull(),
    tenant_id: varchar("tenant_id", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    given_name: varchar("given_name", { length: 255 }),
    family_name: varchar("family_name", { length: 255 }),
    nickname: varchar("nickname", { length: 255 }),
    name: varchar("name", { length: 255 }),
    picture: varchar("picture", { length: 2083 }),
    created_at: varchar("created_at", { length: 255 }),
    updated_at: varchar("updated_at", { length: 255 }),
    linked_to: varchar("linked_to", { length: 255 }),
    last_ip: varchar("last_ip", { length: 255 }),
    login_count: int("login_count"),
    last_login: varchar("last_login", { length: 255 }),
    provider: varchar("provider", { length: 255 }),
    connection: varchar("connection", { length: 255 }),
    email_verified: boolean("email_verified"),
    is_social: boolean("is_social"),
    app_metadata: varchar("app_metadata", { length: 8092 }),
    profileData: varchar("profileData", { length: 2048 }),
    locale: varchar("locale", { length: 255 }),
  },
  (table) => {
    return {
      email_idx: index("email").on(table.email),
      linked_to_idx: index("linked_to").on(table.linked_to),
      name_idx: index("name").on(table.name),
      users_id_tenant_id: primaryKey({
        columns: [table.id, table.tenant_id],
        name: "users_id_tenant_id",
      }),
      unique_email_provider: unique("unique_email_provider").on(
        table.email,
        table.provider,
        table.tenant_id,
      ),
    };
  },
);
