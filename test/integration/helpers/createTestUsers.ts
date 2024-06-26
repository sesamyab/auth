import { expect } from "vitest";
import { testClient } from "hono/testing";
import { getAdminToken } from "./token";
import { UserResponse } from "../../../src/types/auth0";
import { EnvType } from "./test-client";
import { managementApp } from "../../../src/app";

export default async function createTestUsers(env: EnvType, tenantId: string) {
  const token = await getAdminToken();
  const managementClient = testClient(managementApp, env);

  const createUserResponse1 = await managementClient.api.v2.users.$post(
    {
      json: {
        email: "test1@example.com",
        connection: "email",
      },
      header: {
        "tenant-id": tenantId,
      },
    },
    {
      headers: {
        authorization: `Bearer ${token}`,
      },
    },
  );

  expect(createUserResponse1.status).toBe(201);
  const newUser1 = (await createUserResponse1.json()) as UserResponse;

  const createUserResponse2 = await managementClient.api.v2.users.$post(
    {
      json: {
        email: "test2@example.com",
        connection: "email",
      },
      header: {
        "tenant-id": tenantId,
      },
    },
    {
      headers: {
        authorization: `Bearer ${token}`,
      },
    },
  );

  expect(createUserResponse2.status).toBe(201);
  const newUser2 = (await createUserResponse2.json()) as UserResponse;

  return [newUser1, newUser2];
}
