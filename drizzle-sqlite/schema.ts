import {
  primaryKey,
  index,
  int,
  unique,
  sqliteTable,
  text,
  integer,
} from "drizzle-orm/sqlite-core";

export const applications = sqliteTable(
  "applications",
  {
    id: text("id", { length: 255 }).notNull(),
    tenant_id: text("tenant_id", { length: 255 }).notNull(),
    name: text("name", { length: 255 }).notNull(),
    client_secret: text("client_secret", { length: 255 }),
    allowed_callback_urls: text("allowed_callback_urls", { length: 255 }),
    allowed_logout_urls: text("allowed_logout_urls", { length: 255 }),
    allowed_web_origins: text("allowed_web_origins", { length: 255 }),
    authentication_settings: text("authentication_settings", {
      length: 255,
    }),
    styling_settings: text("styling_settings", { length: 255 }),
    email_validation: text("email_validation", { length: 255 }),
    created_at: text("created_at", { length: 255 }),
    updated_at: text("updated_at", { length: 255 }),
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

export const codes = sqliteTable(
  "codes",
  {
    id: text("id", { length: 255 }).notNull(),
    tenant_id: text("tenant_id", { length: 255 }).notNull(),
    user_id: text("user_id", { length: 255 }).notNull(),
    type: text("type", { length: 255 }).notNull(),
    created_at: text("created_at", { length: 255 }).notNull(),
    expires_at: text("expires_at", { length: 255 }).notNull(),
    used_at: text("used_at", { length: 255 }),
    code: text("code", { length: 255 }).notNull(),
  },
  (table) => {
    return {
      expires_at_idx: index("expires_at").on(table.expires_at),
      codes_id: primaryKey({ columns: [table.id], name: "codes_id" }),
    };
  },
);

export const connections = sqliteTable(
  "connections",
  {
    id: text("id", { length: 255 }).notNull(),
    tenant_id: text("tenant_id", { length: 255 }).notNull(),
    name: text("name", { length: 255 }).notNull(),
    client_id: text("client_id", { length: 255 }),
    client_secret: text("client_secret", { length: 255 }),
    authorization_endpoint: text("authorization_endpoint", { length: 255 }),
    token_endpoint: text("token_endpoint", { length: 255 }),
    scope: text("scope", { length: 255 }),
    response_type: text("response_type", { length: 255 }),
    response_mode: text("response_mode", { length: 255 }),
    private_key: text("private_key", { length: 767 }),
    kid: text("kid", { length: 255 }),
    team_id: text("team_id", { length: 255 }),
    created_at: text("created_at", { length: 255 }),
    updated_at: text("updated_at", { length: 255 }),
    userinfo_endpoint: text("userinfo_endpoint", { length: 256 }),
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

export const domains = sqliteTable(
  "domains",
  {
    id: text("id", { length: 255 }).notNull(),
    tenant_id: text("tenant_id", { length: 255 }).notNull(),
    domain: text("domain", { length: 255 }).notNull(),
    email_service: text("email_service", { length: 255 }),
    email_api_key: text("email_api_key", { length: 255 }),
    dkim_private_key: text("dkim_private_key", { length: 2048 }),
    dkim_public_key: text("dkim_public_key", { length: 2048 }),
    created_at: text("created_at", { length: 255 }),
    updated_at: text("updated_at", { length: 255 }),
  },
  (table) => {
    return {
      domains_id: primaryKey({ columns: [table.id], name: "domains_id" }),
    };
  },
);

export const keys = sqliteTable(
  "keys",
  {
    kid: text("kid", { length: 255 }).notNull(),
    tenant_id: text("tenant_id", { length: 255 }),
    private_key: text("private_key", { length: 8192 }),
    public_key: text("public_key", { length: 1024 }),
    created_at: text("created_at", { length: 255 }),
    revoked_at: text("revoked_at", { length: 255 }),
  },
  (table) => {
    return {
      keys_kid: primaryKey({ columns: [table.kid], name: "keys_kid" }),
    };
  },
);

export const kysely_migration = sqliteTable(
  "kysely_migration",
  {
    name: text("name", { length: 255 }).notNull(),
    timestamp: text("timestamp", { length: 255 }).notNull(),
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

export const kysely_migration_lock = sqliteTable(
  "kysely_migration_lock",
  {
    id: text("id", { length: 255 }).notNull(),
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

export const logs = sqliteTable(
  "logs",
  {
    id: text("id", { length: 255 }).notNull(),
    tenant_id: text("tenant_id", { length: 255 }).notNull(),
    user_id: text("user_id", { length: 255 }).notNull(),
    ip: text("ip", { length: 255 }),
    type: text("type", { length: 255 }),
    date: text("date", { length: 255 }),
    description: text("description", { length: 255 }),
    client_id: text("client_id", { length: 255 }),
    client_name: text("client_name", { length: 255 }),
    user_agent: text("user_agent", { length: 255 }),
    details: text("details", { length: 8192 }),
    user_name: text("user_name", { length: 255 }),
    auth0_client: text("auth0_client", { length: 255 }),
    isMobile: integer("isMobile", { mode: "boolean" }),
    connection: text("connection", { length: 255 }),
    connection_id: text("connection_id", { length: 255 }),
    audience: text("audience", { length: 255 }),
    scope: text("scope", { length: 255 }),
    strategy: text("strategy", { length: 255 }),
    strategy_type: text("strategy_type", { length: 255 }),
    hostname: text("hostname", { length: 255 }),
    session_connection: text("session_connection", { length: 255 }),
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

export const members = sqliteTable(
  "members",
  {
    id: text("id", { length: 255 }).notNull(),
    tenant_id: text("tenant_id", { length: 255 }).notNull(),
    sub: text("sub", { length: 255 }),
    email: text("email", { length: 255 }),
    name: text("name", { length: 255 }),
    status: text("status", { length: 255 }),
    role: text("role", { length: 255 }),
    picture: text("picture", { length: 255 }),
    created_at: text("created_at", { length: 255 }),
    updated_at: text("updated_at", { length: 255 }),
  },
  (table) => {
    return {
      members_id: primaryKey({ columns: [table.id], name: "members_id" }),
    };
  },
);

export const migrations = sqliteTable(
  "migrations",
  {
    id: text("id", { length: 255 }).notNull(),
    tenant_id: text("tenant_id", { length: 255 }).notNull(),
    provider: text("provider", { length: 255 }),
    client_id: text("client_id", { length: 255 }),
    origin: text("origin", { length: 255 }),
    domain: text("domain", { length: 255 }),
    created_at: text("created_at", { length: 255 }),
    updated_at: text("updated_at", { length: 255 }),
  },
  (table) => {
    return {
      migrations_id: primaryKey({ columns: [table.id], name: "migrations_id" }),
    };
  },
);

export const otps = sqliteTable(
  "otps",
  {
    tenant_id: text("tenant_id", { length: 255 }).notNull(),
    id: text("id", { length: 255 }).notNull(),
    client_id: text("client_id", { length: 255 }).notNull(),
    code: text("code", { length: 255 }).notNull(),
    email: text("email", { length: 255 }).notNull(),
    user_id: text("user_id", { length: 255 }),
    send: text("send", { length: 255 }),
    nonce: text("nonce", { length: 255 }),
    state: text("state", { length: 1024 }),
    scope: text("scope", { length: 1024 }),
    response_type: text("response_type", { length: 256 }),
    response_mode: text("response_mode", { length: 256 }),
    redirect_uri: text("redirect_uri", { length: 1024 }),
    created_at: text("created_at", { length: 255 }).notNull(),
    expires_at: text("expires_at", { length: 255 }).notNull(),
    used_at: text("used_at", { length: 255 }),
    audience: text("audience", { length: 255 }),
  },
  (table) => {
    return {
      email_idx: index("email").on(table.email),
      expires_at_idx: index("expires_at").on(table.expires_at),
      otps_id: primaryKey({ columns: [table.id], name: "otps_id" }),
    };
  },
);

export const passwords = sqliteTable(
  "passwords",
  {
    tenant_id: text("tenant_id", { length: 255 }).notNull(),
    user_id: text("user_id", { length: 255 }).notNull(),
    created_at: text("created_at", { length: 255 }),
    updated_at: text("updated_at", { length: 255 }),
    password: text("password", { length: 255 }).notNull(),
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

export const sessions = sqliteTable(
  "sessions",
  {
    tenant_id: text("tenant_id", { length: 255 }).notNull(),
    id: text("id", { length: 255 }).notNull(),
    client_id: text("client_id", { length: 255 }).notNull(),
    user_id: text("user_id", { length: 255 }).notNull(),
    created_at: text("created_at", { length: 255 }),
    expires_at: text("expires_at", { length: 255 }),
    used_at: text("used_at", { length: 255 }),
    deleted_at: text("deleted_at", { length: 255 }),
  },
  (table) => {
    return {
      sessions_id: primaryKey({ columns: [table.id], name: "sessions_id" }),
    };
  },
);

export const tenants = sqliteTable(
  "tenants",
  {
    id: text("id", { length: 255 }).notNull(),
    name: text("name", { length: 255 }),
    audience: text("audience", { length: 255 }),
    sender_email: text("sender_email", { length: 255 }),
    sender_name: text("sender_name", { length: 255 }),
    language: text("language", { length: 255 }),
    logo: text("logo", { length: 255 }),
    primary_color: text("primary_color", { length: 255 }),
    secondary_color: text("secondary_color", { length: 255 }),
    created_at: text("created_at", { length: 255 }),
    updated_at: text("updated_at", { length: 255 }),
    support_url: text("support_url", { length: 255 }),
  },
  (table) => {
    return {
      tenants_id: primaryKey({ columns: [table.id], name: "tenants_id" }),
    };
  },
);

export const tickets = sqliteTable(
  "tickets",
  {
    tenant_id: text("tenant_id", { length: 255 }).notNull(),
    id: text("id", { length: 255 }).notNull(),
    client_id: text("client_id", { length: 255 }).notNull(),
    email: text("email", { length: 255 }).notNull(),
    nonce: text("nonce", { length: 255 }),
    state: text("state", { length: 1024 }),
    scope: text("scope", { length: 1024 }),
    response_type: text("response_type", { length: 256 }),
    response_mode: text("response_mode", { length: 256 }),
    redirect_uri: text("redirect_uri", { length: 1024 }),
    created_at: text("created_at", { length: 255 }).notNull(),
    expires_at: text("expires_at", { length: 255 }).notNull(),
    used_at: text("used_at", { length: 255 }),
  },
  (table) => {
    return {
      tickets_id: primaryKey({ columns: [table.id], name: "tickets_id" }),
    };
  },
);

export const universal_login_sessions = sqliteTable(
  "universal_login_sessions",
  {
    id: text("id", { length: 255 }).notNull(),
    tenant_id: text("tenant_id", { length: 255 }).notNull(),
    client_id: text("client_id", { length: 255 }).notNull(),
    username: text("username", { length: 255 }),
    response_type: text("response_type", { length: 255 }),
    response_mode: text("response_mode", { length: 255 }),
    audience: text("audience", { length: 255 }),
    scope: text("scope", { length: 511 }),
    state: text("state", { length: 511 }),
    code_challenge_method: text("code_challenge_method", { length: 256 }),
    code_challenge: text("code_challenge", { length: 256 }),
    redirect_uri: text("redirect_uri", { length: 256 }),
    created_at: text("created_at", { length: 255 }).notNull(),
    updated_at: text("updated_at", { length: 255 }).notNull(),
    expires_at: text("expires_at", { length: 255 }).notNull(),
    nonce: text("nonce", { length: 255 }),
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

export const users = sqliteTable(
  "users",
  {
    id: text("id", { length: 255 }).notNull(),
    tenant_id: text("tenant_id", { length: 255 }).notNull(),
    email: text("email", { length: 255 }).notNull(),
    given_name: text("given_name", { length: 255 }),
    family_name: text("family_name", { length: 255 }),
    nickname: text("nickname", { length: 255 }),
    name: text("name", { length: 255 }),
    picture: text("picture", { length: 2083 }),
    created_at: text("created_at", { length: 255 }),
    updated_at: text("updated_at", { length: 255 }),
    linked_to: text("linked_to", { length: 255 }),
    last_ip: text("last_ip", { length: 255 }),
    login_count: int("login_count"),
    last_login: text("last_login", { length: 255 }),
    provider: text("provider", { length: 255 }),
    connection: text("connection", { length: 255 }),
    email_verified: integer("email_verified", { mode: "boolean" }),
    is_social: integer("is_social", { mode: "boolean" }),
    app_metadata: text("app_metadata", { length: 8092 }),
    profileData: text("profileData", { length: 2048 }),
    locale: text("locale", { length: 255 }),
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
