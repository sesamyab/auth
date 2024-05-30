import { test } from "vitest";
import { testClient } from "hono/testing";
import { getEnv } from "./helpers/test-client";
import { oauthApp } from "../../src/app";

test("should hide social buttons for fokus", () => {
  // see open PR
  // seed tenants & clients with fokus id
});

test("should show social buttons for parcferme", () => {
  // see open PR
  // seed tenants & clients with parceferme id
});
