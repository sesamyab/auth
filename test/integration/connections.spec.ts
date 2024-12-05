import { test, expect } from "vitest";
import { testClient } from "hono/testing";
import { getTestServer } from "./helpers/test-server";
import { snapshotResponse } from "./helpers/playwrightSnapshots";
import { AuthorizationResponseType } from "authhero";

test("should hide social buttons for fokus by not specifying any connection", async () => {
  const testTenantLanguage = "en";
  const { oauthApp, env } = await getTestServer({
    testTenantLanguage,
  });
  const oauthClient = testClient(oauthApp, env);

  await env.data.tenants.create({
    id: "fokus",
    name: "Test Tenant",
    audience: "https://example.com",
    sender_email: "login@example.com",
    sender_name: "SenderName",
  });
  await env.data.applications.create("fokus", {
    id: "fokus",
    name: "Test Client",
    client_secret: "clientSecret",
    email_validation: "enforced",
    disable_sign_ups: false,
  });
  // we do not specify any connections so no social buttons will be shown
  const response = await oauthClient.authorize.$get({
    query: {
      client_id: "fokus",
      vendor_id: "fokus",
      response_type: AuthorizationResponseType.TOKEN_ID_TOKEN,
      scope: "openid",
      redirect_uri: "http://localhost:3000/callback",
      state: "state",
    },
  });
  const location = response.headers.get("location");
  const stateParam = new URLSearchParams(location!.split("?")[1]);
  const query = Object.fromEntries(stateParam.entries());

  const enterEmailStep = await oauthClient.u["enter-email"].$get({
    query: {
      state: query.state,
    },
  });

  await snapshotResponse(enterEmailStep);
});

test("should show Vipps for parcferme as entered as connection", async () => {
  const testTenantLanguage = "en";
  const { oauthApp, env } = await getTestServer({
    testTenantLanguage,
  });
  const oauthClient = testClient(oauthApp, env);

  await env.data.tenants.create({
    id: "parcferme",
    name: "Test Tenant",
    audience: "https://example.com",
    sender_email: "login@example.com",
    sender_name: "SenderName",
  });
  await env.data.applications.create("parcferme", {
    id: "parcferme",
    name: "Test Client",
    client_secret: "clientSecret",
    email_validation: "enforced",
    disable_sign_ups: false,
  });
  await env.data.connections.create("parcferme", {
    id: "parcferme-connection1",
    name: "vipps",
    strategy: "vipps",
  });
  await env.data.connections.create("parcferme", {
    id: "parcferme-connection2",
    name: "facebook",
    strategy: "facebook",
  });
  await env.data.connections.create("parcferme", {
    id: "parcferme-connection3",
    name: "google-oauth2",
    strategy: "google-oauth2",
  });
  await env.data.connections.create("parcferme", {
    id: "parcferme-connection4",
    name: "apple",
    strategy: "apple",
  });

  const response = await oauthClient.authorize.$get({
    query: {
      client_id: "parcferme",
      vendor_id: "parcferme",
      response_type: AuthorizationResponseType.TOKEN_ID_TOKEN,
      scope: "openid",
      redirect_uri: "http://localhost:3000/callback",
      state: "state",
    },
  });
  const location = response.headers.get("location");
  const stateParam = new URLSearchParams(location!.split("?")[1]);
  const query = Object.fromEntries(stateParam.entries());

  const enterEmailStep = await oauthClient.u["enter-email"].$get({
    query: {
      state: query.state,
    },
  });

  await snapshotResponse(enterEmailStep);
});

test("should hide password entry button if auth2 not specified as a connection", async () => {
  const testTenantLanguage = "en";
  const { oauthApp, env } = await getTestServer({
    testTenantLanguage,
  });
  const oauthClient = testClient(oauthApp, env);

  await env.data.tenants.create({
    id: "code-only",
    name: "Test Tenant",
    audience: "https://example.com",
    sender_email: "foo@bar.com",
    sender_name: "SenderName",
  });

  await env.data.applications.create("code-only", {
    id: "code-only",
    name: "Test Client",
    client_secret: "clientSecret",
    email_validation: "enforced",
    disable_sign_ups: false,
  });

  const response = await oauthClient.authorize.$get({
    query: {
      client_id: "code-only",
      vendor_id: "code-only",
      response_type: AuthorizationResponseType.TOKEN_ID_TOKEN,
      scope: "openid",
      redirect_uri: "http://localhost:3000/callback",
      state: "state",
      login_hint: "foo@example.com",
    },
  });
  expect(response.status).toBe(302);

  const location = response.headers.get("location");
  const stateParam = new URLSearchParams(location!.split("?")[1]);
  const query = Object.fromEntries(stateParam.entries());
  const enterCodeStep = await oauthClient.u["enter-code"].$get({
    query: {
      state: query.state,
    },
  });

  expect(enterCodeStep.status).toBe(200);
  // this should not have "enter a password" button
  await snapshotResponse(enterCodeStep);
});
