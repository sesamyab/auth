import { test } from "vitest";
import { getEnv } from "./integration/helpers/test-client";
import { oauthApp } from "../src/app";
import { testClient } from "hono/testing";
import { snapshotResponse } from "./integration/helpers/playwrightSnapshots";
import { AuthorizationResponseType } from "../src/types";

test("applies fokus customizations", async () => {
  const env = await getEnv();
  const oauthClient = testClient(oauthApp, env);

  const searchParams = {
    client_id: "clientId",
    vendor_id: "fokus",
    response_type: AuthorizationResponseType.TOKEN,
    scope: "openid",
    redirect_uri: "http://localhost:3000/callback",
    state: "state",
  };

  const response = await oauthClient.authorize.$get({
    query: searchParams,
  });
  const location = response.headers.get("location");
  const stateParam = new URLSearchParams(location!.split("?")[1]);
  const query = Object.fromEntries(stateParam.entries());

  const loginFormResponse = await oauthClient.u.code.$get({
    query: {
      state: query.state,
    },
  });

  await snapshotResponse(loginFormResponse);
});
