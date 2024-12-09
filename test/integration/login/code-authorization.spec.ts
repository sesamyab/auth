import { test, expect } from "vitest";
import { getTestServer } from "../helpers/test-server";
import { testClient } from "hono/testing";
import { AuthorizationResponseType } from "authhero";

test("code authorization flow should work", async () => {
  const { oauthApp, env } = await getTestServer({
    testTenantLanguage: "en",
  });
  const oauthClient = testClient(oauthApp, env);

  // --------------------------------
  // start universal auth session where response_type is code
  // --------------------------------

  const response = await oauthClient.authorize.$get({
    query: {
      client_id: "clientId",
      vendor_id: "kvartal",
      //   This is the test! Every other test is using TOKEN or ID_TOKEN here
      response_type: AuthorizationResponseType.CODE,
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

  // --------------------------------
  // Login to get PKCE code
  // --------------------------------
  const postLoginResponse = await oauthClient.u["enter-password"].$post({
    query: {
      state: query.state,
    },
    form: {
      password: "Test1234!",
    },
  });

  expect(postLoginResponse.status).toBe(302);
  const loginLocation = postLoginResponse.headers.get("location");
  const redirectUrl = new URL(loginLocation!);
  expect(redirectUrl.pathname).toBe("/callback");

  const code = redirectUrl.searchParams.get("code");
  expect(code).toBeTypeOf("string");
});
