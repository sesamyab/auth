import { createUsersAdapter } from "./users";
import { createMembersAdapter } from "./members";
import { createTenantsAdapter } from "./tenants";
import { createLogsAdapter } from "./logs";
import { createSessionsAdapter } from "./sessions";
import { createTicketsAdapter } from "./tickets";
import { createOTPAdapter } from "./otps";
import { createPasswordAdapter } from "./passwords";
import { createCodesAdapter } from "./codes";
import { createUniversalLoginSessionAdapter } from "./universalLoginSessions";
import { createApplicationsAdapter } from "./applications";
import { createConnectionsAdapter } from "./connections";
import { createClientsAdapter } from "./clients";
import { createKeysAdapter } from "./keys";
import { createDomainsAdapter } from "./domains";
import { DrizzleSQLiteDatabase } from "../../services/drizzle-sqlite";

export default function createAdapters(db: DrizzleSQLiteDatabase) {
  return {
    applications: createApplicationsAdapter(db),
    clients: createClientsAdapter(db),
    members: createMembersAdapter(db),
    keys: createKeysAdapter(db),
    users: createUsersAdapter(db),
    sessions: createSessionsAdapter(db),
    tenants: createTenantsAdapter(db),
    tickets: createTicketsAdapter(db),
    universalLoginSessions: createUniversalLoginSessionAdapter(db),
    OTP: createOTPAdapter(db),
    logs: createLogsAdapter(db),
    passwords: createPasswordAdapter(db),
    codes: createCodesAdapter(db),
    connections: createConnectionsAdapter(db),
    domains: createDomainsAdapter(db),
  };
}