import { test, expect } from "vitest";
import { getTestServer } from "../helpers/test-server";
import { testClient } from "hono/testing";
import { AuthorizationResponseType } from "authhero";

test("Should user the language passed in the authorize call", async () => {
  const { oauthApp, env } = await getTestServer();
  const oauthClient = testClient(oauthApp, env);

  const response = await oauthClient.authorize.$get({
    query: {
      client_id: "clientId",
      vendor_id: "fokus",
      response_type: AuthorizationResponseType.TOKEN_ID_TOKEN,
      scope: "openid",
      redirect_uri: "http://localhost:3000/callback",
      state: "state",
      ui_locales: "cs",
    },
  });

  expect(response.status).toBe(302);

  const location = response.headers.get("location");

  const stateParam = new URLSearchParams(location!.split("?")[1]);

  const query = Object.fromEntries(stateParam.entries());

  const getSendCodeResponse = await oauthClient.u["enter-email"].$get({
    query: { state: query.state },
  });

  expect(getSendCodeResponse.status).toBe(200);
  const body = await getSendCodeResponse.text();

  expect(body).toContain("Vítejte na");
});
