import { it, expect } from "vitest";
import { getTestServer } from "../helpers/test-server";
import { testClient } from "hono/testing";
import { chromium } from "playwright";
import { toMatchImageSnapshot } from "jest-image-snapshot";
import { AuthorizationResponseType } from "authhero";

// TODO - try this globally in vite config - the issue is the types!
expect.extend({ toMatchImageSnapshot });

it("should prefill email with login_hint if passed to /authorize", async () => {
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
      // this is the difference on this test
      login_hint: "suggested-email@example.com",
    },
  });

  expect(response.status).toBe(302);

  const location = response.headers.get("location");

  const stateParam = new URLSearchParams(location!.split("?")[1]);

  const query = Object.fromEntries(stateParam.entries());

  const getSendCodeResponse = await oauthClient.u["enter-email"].$get({
    query: { state: query.state },
  });

  // @ts-expect-error - dynamic import
  if (import.meta.env.TEST_SNAPSHOTS === "true") {
    const browser = await chromium.launch();
    const page = await browser.newPage();

    const responseText = await getSendCodeResponse.text();
    const responseBody = responseText.replace(
      "/css/tailwind.css",
      "http://auth2.sesamy.dev/css/tailwind.css",
    );
    await page.setContent(responseBody);

    // assert that username input is prefilled with this email address
    const usernameInput = await page.$('input[name="username"]');
    expect(usernameInput).not.toBeNull();
    const usernameValue = await usernameInput!.getAttribute("value");
    expect(usernameValue).toBe("suggested-email@example.com");

    const snapshot = await page.screenshot();
    expect(snapshot).toMatchImageSnapshot();

    await browser.close();
  }
});

it("should redirect the user back with a code if the email matches the current session", async () => {
  const { oauthApp, env } = await getTestServer();
  const oauthClient = testClient(oauthApp, env);

  // Login with password using the universal login so we get a session
  const authorizeResponse = await oauthClient.authorize.$get({
    query: {
      client_id: "clientId",
      vendor_id: "kvartal",
      response_type: AuthorizationResponseType.TOKEN_ID_TOKEN,
      scope: "openid",
      redirect_uri: "http://localhost:3000/callback",
      state: "state",
      login_hint: "foo@example.com",
    },
  });
  const location = authorizeResponse.headers.get("location");
  const stateParam = new URLSearchParams(location!.split("?")[1]);
  const query = Object.fromEntries(stateParam.entries());

  const passwordResponse = await oauthClient.u["enter-password"].$post({
    query: {
      state: query.state,
    },
    form: {
      password: "Test1234!",
    },
  });

  // Validate that the password response is successful and get the session cookie
  expect(passwordResponse.status).toBe(302);
  const passwordLoginLocation = new URL(
    passwordResponse.headers.get("location")!,
  );
  expect(passwordLoginLocation.hostname).toBe("localhost");
  const cookie = passwordResponse.headers.get("set-cookie");
  expect(cookie).toBeTypeOf("string");
  const sessionCookie = cookie!.split(";")[0].split("=")[1];

  // Make a request with matching login_hint
  const loginHintResponse = await oauthClient.authorize.$get(
    {
      query: {
        client_id: "clientId",
        vendor_id: "kvartal",
        response_type: AuthorizationResponseType.CODE,
        scope: "openid",
        redirect_uri: "http://localhost:3000/callback",
        state: "state",
        login_hint: "foo@example.com",
      },
    },
    {
      headers: {
        cookie: `tenantId-auth-token=${sessionCookie}`,
      },
    },
  );

  expect(loginHintResponse.status).toBe(302);

  const loginHintLocation = loginHintResponse.headers.get("location");
  const loginHinUrl = new URL("http://example.com" + loginHintLocation!);
  const code = loginHinUrl.searchParams.get("code");

  expect(code).toBeTypeOf("string");

  const tokenResponse = await oauthClient.oauth.token.$post({
    form: {
      client_id: "clientId",
      client_secret: "clientSecret",
      code: code!,
      grant_type: "authorization_code",
      redirect_uri: "http://localhost:3000/callback",
    },
  });

  expect(tokenResponse.status).toBe(200);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tokenBody: any = await tokenResponse.json();
  expect(tokenBody.access_token).toBeTypeOf("string");
});
