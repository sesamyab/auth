import { describe, it, expect } from "vitest";
import { testClient } from "hono/testing";
import { getAdminToken } from "./helpers/token";
import { getTestServer } from "./helpers/test-server";
import {
  jwksKeySchema,
  openIDConfigurationSchema,
} from "@authhero/adapter-interfaces";

describe("jwks", () => {
  it("should return a list with the test certificate", async () => {
    const { oauthApp, env } = await getTestServer();
    const client = testClient(oauthApp, env);

    const response = await client[".well-known"]["jwks.json"].$get(
      {
        param: {},
      },
      {
        headers: {
          "tenant-id": "tenantId",
        },
      },
    );

    expect(response.status).toBe(200);

    const body = await response.json();
    const jwks = jwksKeySchema.parse(body);
    expect(jwks.keys.length).toBe(1);
  });

  it("should create a new rsa-key and return it", async () => {
    const { oauthApp, managementApp, env } = await getTestServer();
    const oauthClient = testClient(oauthApp, env);
    const managementClient = testClient(managementApp, env);

    const initialKey = await oauthClient[".well-known"]["jwks.json"].$get(
      {
        param: {},
      },
      {
        headers: {
          "tenant-id": "tenantId",
        },
      },
    );

    const initialKeys = jwksKeySchema.parse(await initialKey.json());
    expect(initialKeys.keys[0].kid).not.toBe("testid-0");

    const token = await getAdminToken();

    const createKeyResponse = await managementClient.keys.signing.rotate.$post(
      {
        header: {
          "tenant-id": "tenantId",
        },
      },
      {
        headers: {
          authorization: `Bearer ${token}`,
        },
      },
    );

    expect(createKeyResponse.status).toBe(201);

    const response = await oauthClient[".well-known"]["jwks.json"].$get(
      {
        param: {},
      },
      {
        headers: {
          "tenant-id": "tenantId",
        },
      },
    );

    expect(response.status).toBe(200);

    const body = jwksKeySchema.parse(await response.json());

    // The rotated key is available for 24 hours
    expect(body.keys.length).toBe(2);
  });

  it("should return an openid-configuration with the current issues", async () => {
    const { oauthApp, env } = await getTestServer();
    const client = testClient(oauthApp, env);

    const response = await client[".well-known"]["openid-configuration"].$get(
      {
        param: {},
      },
      {
        headers: {
          "tenant-id": "tenantId",
        },
      },
    );

    expect(response.status).toBe(200);

    const body = openIDConfigurationSchema.parse(await response.json());
    expect(body.issuer).toBe("https://example.com/");
  });
});
