import { describe, it, expect } from "vitest";
import { getClient } from "../../src/services/clients";
import { contextFixture } from "../fixtures";
import {
  Application,
  AuthorizationResponseMode,
  AuthorizationResponseType,
  Connection,
  Domain,
  Tenant,
} from "authhero";

const TENANT_FIXTURE: Tenant = {
  id: "tenantId",
  name: "tenantName",
  audience: "audience",
  sender_email: "senderEmail",
  sender_name: "senderName",
  support_url: "https://example.com/support",
  created_at: "created_at",
  updated_at: "updated_at",
};

const APPLICATION_FIXTURE: Application = {
  id: "testClient",
  name: "clientName",
  email_validation: "enabled",
  client_secret: "clientSecret",
  created_at: "created_at",
  updated_at: "updated_at",
  disable_sign_ups: false,
};

const CONNECTION_FIXTURE: Connection = {
  id: "connectionId",
  name: "facebook",
  strategy: "facebook",
  options: {
    client_id: "facebookClientId",
    client_secret: "facebookClientSecret",
    scope: "email public_profile openid",
    token_endpoint: "https://graph.facebook.com/oauth/access_token",
    authorization_endpoint: "https://www.facebook.com/dialog/oauth",
  },
  response_mode: AuthorizationResponseMode.QUERY,
  response_type: AuthorizationResponseType.CODE,
  created_at: "created_at",
  updated_at: "updated_at",
};

const DOMAIN_FIXTURE: Domain = {
  id: "domainId",
  domain: "example2.com",
  email_api_key: "",
  email_service: "mailgun",
  created_at: "created_at",
  updated_at: "updated_at",
  dkim_private_key: "",
  dkim_public_key: "",
};

describe("getClient", () => {
  it("should get the connection settings from the DefaultSettings", async () => {
    const ctx = await contextFixture({
      applications: [APPLICATION_FIXTURE],
      tenants: [TENANT_FIXTURE],
      connections: [
        {
          id: "defaultConnection1",
          name: "facebook",
          strategy: "facebook",
          options: {
            client_id: "facebookClientId",
            client_secret: "facebookClientSecret",
            scope: "email public_profile openid",
            authorization_endpoint: "https://www.facebook.com/dialog/oauth",
            token_endpoint: "https://graph.facebook.com/oauth/access_token",
          },
          response_mode: AuthorizationResponseMode.QUERY,
          response_type: AuthorizationResponseType.CODE,
        },
        {
          // only has minimal specified so we are getting the rest from default settings
          id: "connectionId",
          name: "facebook",
          strategy: "facebook",
        },
      ],
      domains: [DOMAIN_FIXTURE],
    });

    const client = await getClient(ctx.env, "testClient");
    const facebookConnection = client!.connections.find(
      (c) => c.name === "facebook",
    );

    expect(facebookConnection?.options?.client_id).toBe("facebookClientId");
    expect(facebookConnection?.options?.authorization_endpoint).toBe(
      "https://www.facebook.com/dialog/oauth",
    );
  });

  it("should add a domain from the envDefaultSettings to the client domains", async () => {
    const ctx = await contextFixture({
      applications: [APPLICATION_FIXTURE],
      tenants: [TENANT_FIXTURE],
      connections: [CONNECTION_FIXTURE],
      domains: [
        {
          id: "defaultDomain1",
          domain: "example.com",
          dkim_private_key: "",
          dkim_public_key: "",
          email_service: "mailchannels",
          created_at: "created_at",
          updated_at: "updated_at",
          email_api_key: "",
        },
        DOMAIN_FIXTURE,
      ],
    });

    const client = await getClient(ctx.env, "testClient");

    expect(client!.domains.sort()).toMatchObject([
      {
        domain: "example.com",
        dkim_private_key: "",
        email_service: "mailchannels",
        email_api_key: "",
        dkim_public_key: "",
      },
      {
        email_api_key: "",
        domain: "example2.com",
        email_service: "mailgun",
        dkim_private_key: "",
        dkim_public_key: "",
      },
    ]);
  });

  it("should add a domain from the envDefaultSettings to the client domains", async () => {
    const ctx = await contextFixture({
      applications: [APPLICATION_FIXTURE],
      tenants: [TENANT_FIXTURE],
      connections: [CONNECTION_FIXTURE],
      domains: [
        {
          id: "defaultDomain1",
          domain: "example.com",
          dkim_private_key: "",
          dkim_public_key: "",
          email_service: "mailchannels",
          created_at: "created_at",
          updated_at: "updated_at",
          email_api_key: "",
        },
        DOMAIN_FIXTURE,
      ],
    });

    const client = await getClient(ctx.env, "testClient");

    expect(client!.domains.sort()).toMatchObject([
      {
        domain: "example.com",
        dkim_private_key: "",
        email_service: "mailchannels",
        email_api_key: "",
        dkim_public_key: "",
      },
      {
        domain: "example2.com",
        email_api_key: "",
        email_service: "mailgun",
        dkim_private_key: "",
        dkim_public_key: "",
      },
    ]);
  });

  it("should store the support url from the tenant in the client", async () => {
    const ctx = await contextFixture({
      applications: [APPLICATION_FIXTURE],
      tenants: [
        {
          ...TENANT_FIXTURE,
          support_url: "https://example.foo/bar",
        },
      ],
      connections: [CONNECTION_FIXTURE],
      domains: [DOMAIN_FIXTURE],
    });

    const client = await getClient(ctx.env, "testClient");

    expect(client!.tenant.support_url).toBe("https://example.foo/bar");
  });
});
