import { test, expect } from "vitest";
import { getEnv } from "../helpers/test-client";
import { oauthApp } from "../../../src/app";
import { testClient } from "hono/testing";
import { AuthorizationResponseType } from "../../../src/types";

test("Should go to code entry step if email_hint is passed to /authorize", async () => {
  const env = await getEnv();
  const oauthClient = testClient(oauthApp, env);

  const response = await oauthClient.authorize.$get({
    query: {
      client_id: "clientId",
      vendor_id: "fokus",
      response_type: AuthorizationResponseType.TOKEN_ID_TOKEN,
      scope: "openid",
      redirect_uri: "http://localhost:3000/callback",
      state: "state",
      // this is the difference on this test
      email_hint: "suggested-email@example.com",
    },
  });

  expect(response.status).toBe(302);

  const location = response.headers.get("location");

  // ----------------------------------------------
  // We should have gone straight to the code entry page
  // ----------------------------------------------
  expect(location).toContain("/u/enter-code");

  // ----------------------------------------------
  // Expect a code email to have been sent
  // ----------------------------------------------
  await new Promise((resolve) => setTimeout(resolve, 0));
  expect(env.data.emails.length).toBe(1);
});
