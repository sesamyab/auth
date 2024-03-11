import { PartialClient, SqlConnectionSchema } from "../../../types";
import { HTTPException } from "hono/http-exception";
import { DrizzleDatabase } from "../../../services/drizzle";
import {
  applications,
  tenants,
  connections,
  domains,
} from "../../../../drizzle/schema";
import { eq } from "drizzle-orm";

function removeNullProperties<T = any>(obj: Record<string, any>) {
  const clone = { ...obj };

  for (const key in clone) {
    if (clone[key] === null) {
      delete clone[key];
    }
  }

  return clone as T;
}

function splitUrls(value?: string) {
  if (!value?.length) {
    return [];
  }
  return value.split(",").map((key) => key.trim());
}

export function createClientsAdapter(db: DrizzleDatabase) {
  return {
    get: async (applicationId: string) => {
      const [application] = await db
        .select()
        .from(applications)
        .where(eq(applications.id, applicationId));

      if (!application) {
        throw new HTTPException(404, { message: "Client not found" });
      }

      const [tenant] = await db
        .select()
        .from(tenants)
        .where(eq(tenants.id, application.tenant_id));

      if (!tenant) {
        throw new HTTPException(404, { message: "Tenant not found" });
      }

      const connectionsResults = await db
        .select()
        .from(connections)
        .where(eq(connections.tenant_id, application.tenant_id));

      const domainsResults = await db
        .select()
        .from(domains)
        .where(eq(domains.tenant_id, application.tenant_id));

      const client: PartialClient = {
        id: application.id,
        name: application.name,
        connections: connectionsResults.map((connection) =>
          SqlConnectionSchema.parse(removeNullProperties(connection)),
        ),
        domains: removeNullProperties(domainsResults),
        tenant_id: tenant.id,
        allowed_callback_urls: splitUrls(
          application.allowed_callback_urls || "",
        ),
        allowed_logout_urls: splitUrls(application.allowed_logout_urls || ""),
        allowed_web_origins: splitUrls(application.allowed_web_origins || ""),
        email_validation: application.email_validation || "",
        client_secret: application.client_secret || "",
        tenant: removeNullProperties({
          audience: tenant.audience,
          logo: tenant.logo,
          primary_color: tenant.primary_color,
          secondary_color: tenant.secondary_color,
          sender_email: tenant.sender_email,
          sender_name: tenant.sender_name,
          language: tenant.language,
          support_url: tenant.support_url,
        }),
      };

      return client;
    },
  };
}
