import { describe, it, expect } from "vitest";
import { parseJwt } from "../../../src/utils/parse-jwt";
import { doSilentAuthRequestAndReturnTokens } from "../helpers/silent-auth";
import { getTestServer } from "../helpers/test-server";
import { getAdminToken } from "../helpers/token";
import { testClient } from "hono/testing";
import { EmailOptions } from "../../../src/services/email/EmailOptions";
import { snapshotEmail } from "../helpers/playwrightSnapshots";
import { z } from "zod";
import { AuthorizationResponseType } from "@authhero/adapter-interfaces";

const AUTH_PARAMS = {
  nonce: "enljIoQjQQy7l4pCVutpw9mf001nahBC",
  redirect_uri: "https://login.example.com/callback",
  response_type: AuthorizationResponseType.TOKEN_ID_TOKEN,
  scope: "openid profile email",
  state:
    "client_id=clientId&redirect_uri=https://example.com/callback&vendor_id=vendorId&connection=auth2",
};

function getMagicLinkFromEmailBody(email: EmailOptions) {
  const linkEmailBody = email.content[0].value;
  const magicLink = linkEmailBody.match(
    /<a\s+(?:[^>]*?\s+)?href="([^"]*)"/,
  )![1];

  return magicLink;
}

const verifyCodeQuerySchema = z.object({
  scope: z.string(),
  response_type: z.nativeEnum(AuthorizationResponseType),
  redirect_uri: z.string(),
  state: z.string(),
  nonce: z.string(),
  verification_code: z.string(),
  connection: z.string(),
  client_id: z.string(),
  email: z.string(),
  audience: z.string().optional(),
});

describe("magic link flow", () => {
  describe("should log in using the sent magic link, when", () => {
    it("is a new sign up", async () => {
      const token = await getAdminToken();
      const { managementApp, oauthApp, emails, env } = await getTestServer();
      const oauthClient = testClient(oauthApp, env);
      const managementClient = testClient(managementApp, env);

      // -----------------
      // Doing a new signup here, so expect this email not to exist
      // -----------------
      const resInitialQuery = await managementClient.api.v2[
        "users-by-email"
      ].$get(
        {
          query: {
            email: "new-user@example.com",
          },
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
      const results = await resInitialQuery.json();
      expect(results).toHaveLength(0);

      const response = await oauthClient.passwordless.start.$post({
        json: {
          authParams: AUTH_PARAMS,
          client_id: "clientId",
          connection: "email",
          email: "new-user@example.com",
          send: "link",
        },
      });

      if (response.status !== 200) {
        throw new Error(await response.text());
      }

      const magicLink = getMagicLinkFromEmailBody(emails[0]);

      await snapshotEmail(emails[0], true);

      expect(emails[0].to[0].email).toBe("new-user@example.com");

      const link = magicLink!;

      const authenticatePath = link?.split("https://example.com")[1];

      expect(authenticatePath).toContain("/passwordless/verify_redirect");

      const querySearchParams = new URLSearchParams(
        authenticatePath.split("?")[1],
      );
      const query = verifyCodeQuerySchema.parse(
        Object.fromEntries(querySearchParams.entries()),
      );

      const authenticateResponse =
        await oauthClient.passwordless.verify_redirect.$get({
          query,
        });

      if (authenticateResponse.status !== 302) {
        const errorMessage = `Failed to verify redirect with status: ${
          authenticateResponse.status
        } and message: ${await response.text()}`;
        throw new Error(errorMessage);
      }

      const redirectUri = new URL(
        authenticateResponse.headers.get("location")!,
      );
      expect(redirectUri.hostname).toBe("login.example.com");

      const searchParams = new URLSearchParams(redirectUri.hash.slice(1));

      const accessToken = searchParams.get("access_token");
      expect(accessToken).toBeTypeOf("string");

      const accessTokenPayload = parseJwt(accessToken!);
      expect(accessTokenPayload.aud).toBe("default");
      expect(accessTokenPayload.iss).toBe("https://example.com/");
      expect(accessTokenPayload.scope).toBe("openid profile email");

      const idToken = searchParams.get("id_token");
      const idTokenPayload = parseJwt(idToken!);
      expect(idTokenPayload.email).toBe("new-user@example.com");
      expect(idTokenPayload.aud).toBe("clientId");

      const authCookieHeader = authenticateResponse.headers.get("set-cookie")!;

      // now check silent auth works when logged in with magic link----------------------------------------
      const { idToken: silentAuthIdTokenPayload } =
        await doSilentAuthRequestAndReturnTokens(
          authCookieHeader,
          oauthClient,
          AUTH_PARAMS.nonce,
          "clientId",
        );

      const {
        // these are the fields that change on every test run
        exp,
        iat,
        sid,
        sub,
        ...restOfIdTokenPayload
      } = silentAuthIdTokenPayload;

      expect(sub).toContain("email|");
      expect(restOfIdTokenPayload).toEqual({
        aud: "clientId",
        name: "new-user@example.com",
        email: "new-user@example.com",
        email_verified: true,
        nonce: "enljIoQjQQy7l4pCVutpw9mf001nahBC",
        iss: "https://example.com/",
      });
    });

    it("is an existing primary user", async () => {
      const token = await getAdminToken();
      const { managementApp, oauthApp, emails, env } = await getTestServer();
      const oauthClient = testClient(oauthApp, env);
      const managementClient = testClient(managementApp, env);

      // -----------------
      // Create the user to log in with the magic link
      // -----------------
      env.data.users.create("tenantId", {
        user_id: "email|userId2",
        email: "bar@example.com",
        email_verified: true,
        name: "",
        nickname: "",
        picture: "https://example.com/foo.png",
        login_count: 0,
        provider: "email",
        connection: "email",
        is_social: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      const resInitialQuery = await managementClient.api.v2[
        "users-by-email"
      ].$get(
        {
          query: {
            email: "bar@example.com",
          },
          header: {
            "tenant-id": "tenantId",
          },
        },
        {
          headers: {
            authorization: `Bearer ${token}`,
            "tenant-id": "tenantId",
          },
        },
      );
      expect(resInitialQuery.status).toBe(200);

      // -----------------
      // Now get magic link emailed
      // -----------------

      await oauthClient.passwordless.start.$post({
        json: {
          authParams: AUTH_PARAMS,
          client_id: "clientId",
          connection: "email",
          email: "bar@example.com",
          send: "link",
        },
      });

      const magicLink = getMagicLinkFromEmailBody(emails[0]);

      expect(emails[0].to[0].email).toBe("bar@example.com");

      const link = magicLink!;

      const authenticatePath = link?.split("https://example.com")[1];

      expect(authenticatePath).toContain("/passwordless/verify_redirect");

      const querySearchParams = new URLSearchParams(
        authenticatePath.split("?")[1],
      );
      const query = verifyCodeQuerySchema.parse(
        Object.fromEntries(querySearchParams.entries()),
      );
      // -----------------
      // Authenticate using the magic link for the existing user
      // -----------------
      const authenticateResponse =
        await oauthClient.passwordless.verify_redirect.$get({
          query,
        });

      const redirectUri = new URL(
        authenticateResponse.headers.get("location")!,
      );
      expect(redirectUri.hostname).toBe("login.example.com");

      const searchParams = new URLSearchParams(redirectUri.hash.slice(1));

      const accessToken = searchParams.get("access_token");

      const accessTokenPayload = parseJwt(accessToken!);
      expect(accessTokenPayload.aud).toBe("default");
      expect(accessTokenPayload.iss).toBe("https://example.com/");
      expect(accessTokenPayload.scope).toBe("openid profile email");
      expect(accessTokenPayload.sub).toBe("email|userId2");

      const idToken = searchParams.get("id_token");
      const idTokenPayload = parseJwt(idToken!);
      expect(idTokenPayload.email).toBe("bar@example.com");
      expect(idTokenPayload.aud).toBe("clientId");
      expect(idTokenPayload.sub).toBe("email|userId2");

      const authCookieHeader = authenticateResponse.headers.get("set-cookie")!;

      // ----------------------------------------
      // now check silent auth works when logged in with magic link for existing user
      // ----------------------------------------
      const { idToken: silentAuthIdTokenPayload } =
        await doSilentAuthRequestAndReturnTokens(
          authCookieHeader,
          oauthClient,
          AUTH_PARAMS.nonce,
          "clientId",
        );

      const { exp, iat, sid, ...restOfIdTokenPayload } =
        silentAuthIdTokenPayload;

      expect(restOfIdTokenPayload).toEqual({
        sub: "email|userId2",
        aud: "clientId",
        name: "",
        nickname: "",
        picture: "https://example.com/foo.png",
        email: "bar@example.com",
        email_verified: true,
        nonce: "enljIoQjQQy7l4pCVutpw9mf001nahBC",
        iss: "https://example.com/",
      });
    });

    it("is an existing linked user", async () => {
      const { oauthApp, emails, env } = await getTestServer();
      const oauthClient = testClient(oauthApp, env);

      // -----------------
      // Create the linked user to log in with the magic link
      // -----------------
      env.data.users.create("tenantId", {
        user_id: "auth2|userId2",
        email: "foo@example.com",
        email_verified: true,
        name: "",
        nickname: "",
        picture: "https://example.com/foo.png",
        login_count: 0,
        provider: "email",
        connection: "email",
        is_social: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        linked_to: "auth2|userId",
      });

      // -----------------
      // Now get magic link emailed
      // -----------------

      await oauthClient.passwordless.start.$post({
        json: {
          authParams: AUTH_PARAMS,
          client_id: "clientId",
          connection: "email",
          email: "foo@example.com",
          send: "link",
        },
      });

      const magicLink = getMagicLinkFromEmailBody(emails[0]);

      expect(emails[0].to[0].email).toBe("foo@example.com");

      const link = magicLink!;

      const authenticatePath = link?.split("https://example.com")[1];

      expect(authenticatePath).toContain("/passwordless/verify_redirect");

      const querySearchParams = new URLSearchParams(
        authenticatePath.split("?")[1],
      );
      const query = verifyCodeQuerySchema.parse(
        Object.fromEntries(querySearchParams.entries()),
      );
      // -----------------
      // Authenticate using the magic link for the existing user
      // -----------------
      const authenticateResponse =
        await oauthClient.passwordless.verify_redirect.$get({
          query,
        });

      const redirectUri = new URL(
        authenticateResponse.headers.get("location")!,
      );
      expect(redirectUri.hostname).toBe("login.example.com");

      const searchParams = new URLSearchParams(redirectUri.hash.slice(1));

      const accessToken = searchParams.get("access_token");

      const accessTokenPayload = parseJwt(accessToken!);
      expect(accessTokenPayload.aud).toBe("default");
      expect(accessTokenPayload.iss).toBe("https://example.com/");
      expect(accessTokenPayload.scope).toBe("openid profile email");
      // this id shows we are fetching the primary user
      expect(accessTokenPayload.sub).toBe("auth2|userId");

      const idToken = searchParams.get("id_token");
      const idTokenPayload = parseJwt(idToken!);
      expect(idTokenPayload.email).toBe("foo@example.com");
      expect(idTokenPayload.aud).toBe("clientId");
      expect(idTokenPayload.sub).toBe("auth2|userId");

      const authCookieHeader = authenticateResponse.headers.get("set-cookie")!;

      // ----------------------------------------
      // now check silent auth works when logged in with magic link for existing user
      // ----------------------------------------
      const { idToken: silentAuthIdTokenPayload } =
        await doSilentAuthRequestAndReturnTokens(
          authCookieHeader,
          oauthClient,
          AUTH_PARAMS.nonce,
          "clientId",
        );

      const { exp, iat, sid, ...restOfIdTokenPayload } =
        silentAuthIdTokenPayload;

      expect(restOfIdTokenPayload).toEqual({
        sub: "auth2|userId",
        aud: "clientId",
        name: "Åkesson Þorsteinsson",
        nickname: "Åkesson Þorsteinsson",
        picture: "https://example.com/foo.png",
        email: "foo@example.com",
        email_verified: true,
        nonce: "enljIoQjQQy7l4pCVutpw9mf001nahBC",
        iss: "https://example.com/",
      });
    });

    it("is the same email address as an existing password user", async () => {
      const { oauthApp, emails, env } = await getTestServer();
      const oauthClient = testClient(oauthApp, env);

      // -----------------
      // Now get magic link emailed
      // -----------------

      await oauthClient.passwordless.start.$post(
        {
          json: {
            authParams: AUTH_PARAMS,
            client_id: "clientId",
            connection: "email",
            email: "foo@example.com",
            send: "link",
          },
        },
        {
          headers: {
            "content-type": "application/json",
          },
        },
      );

      const magicLink = getMagicLinkFromEmailBody(emails[0]);

      expect(emails[0].to[0].email).toBe("foo@example.com");

      const link = magicLink!;

      const authenticatePath = link?.split("https://example.com")[1];

      expect(authenticatePath).toContain("/passwordless/verify_redirect");

      const querySearchParams = new URLSearchParams(
        authenticatePath.split("?")[1],
      );
      const query = verifyCodeQuerySchema.parse(
        Object.fromEntries(querySearchParams.entries()),
      );
      // -----------------
      // Authenticate using the magic link for the existing user
      // -----------------
      const authenticateResponse =
        await oauthClient.passwordless.verify_redirect.$get({
          query,
        });

      const redirectUri = new URL(
        authenticateResponse.headers.get("location")!,
      );
      expect(redirectUri.hostname).toBe("login.example.com");

      const searchParams = new URLSearchParams(redirectUri.hash.slice(1));

      const accessToken = searchParams.get("access_token");

      const accessTokenPayload = parseJwt(accessToken!);
      expect(accessTokenPayload.aud).toBe("default");
      expect(accessTokenPayload.iss).toBe("https://example.com/");
      expect(accessTokenPayload.scope).toBe("openid profile email");
      // this should we are fetching the primary user
      expect(accessTokenPayload.sub).toBe("auth2|userId");

      const idToken = searchParams.get("id_token");
      const idTokenPayload = parseJwt(idToken!);
      expect(idTokenPayload.email).toBe("foo@example.com");
      expect(idTokenPayload.aud).toBe("clientId");
      expect(idTokenPayload.sub).toBe("auth2|userId");

      const authCookieHeader = authenticateResponse.headers.get("set-cookie")!;
      expect(authCookieHeader).toBeTypeOf("string");

      // ----------------------------------------
      // now check silent auth works when logged in with magic link for existing user
      // ----------------------------------------
      const { idToken: silentAuthIdTokenPayload } =
        await doSilentAuthRequestAndReturnTokens(
          authCookieHeader,
          oauthClient,
          AUTH_PARAMS.nonce,
          "clientId",
        );

      const { exp, iat, sid, ...restOfIdTokenPayload } =
        silentAuthIdTokenPayload;

      expect(restOfIdTokenPayload).toEqual({
        sub: "auth2|userId",
        aud: "clientId",
        name: "Åkesson Þorsteinsson",
        nickname: "Åkesson Þorsteinsson",
        picture: "https://example.com/foo.png",
        email: "foo@example.com",
        email_verified: true,
        nonce: "enljIoQjQQy7l4pCVutpw9mf001nahBC",
        iss: "https://example.com/",
      });
    });
  });
  it.skip("should only allow a magic link to be used once", async () => {
    const { oauthApp, emails, env } = await getTestServer();
    const oauthClient = testClient(oauthApp, env);

    // -----------
    // get code to log in
    // -----------
    await oauthClient.passwordless.start.$post(
      {
        json: {
          authParams: AUTH_PARAMS,
          client_id: "clientId",
          connection: "email",
          email: "test@example.com",
          send: "link",
        },
      },
      {
        headers: {
          "content-type": "application/json",
        },
      },
    );

    const magicLink = getMagicLinkFromEmailBody(emails[0]);

    const link = magicLink!;

    const authenticatePath = link?.split("https://example.com")[1];

    expect(authenticatePath).toContain("/passwordless/verify_redirect");

    const querySearchParams = new URLSearchParams(
      authenticatePath.split("?")[1],
    );
    const query = verifyCodeQuerySchema.parse(
      Object.fromEntries(querySearchParams.entries()),
    );
    // ------------
    // Use the magic link
    // ----------------
    const authenticateResponse =
      await oauthClient.passwordless.verify_redirect.$get({
        query,
      });
    expect(authenticateResponse.status).toBe(302);
    // ------------
    // Try using the magic link twice
    // ----------------
    const authenticateResponse2 =
      await oauthClient.passwordless.verify_redirect.$get({
        query,
      });
    expect(authenticateResponse2.status).toBe(302);
    const redirectUri2 = new URL(
      authenticateResponse2.headers.get("location")!,
    );
    expect(redirectUri2.hostname).toBe("login2.sesamy.dev");
    // we also show this page if the code is incorrect
    expect(redirectUri2.pathname).toBe("/expired-code");
  });

  it("should not accept an invalid code in the magic link", async () => {
    const { oauthApp, emails, env } = await getTestServer();
    const oauthClient = testClient(oauthApp, env);

    // -----------
    // get code to log in
    // -----------
    await oauthClient.passwordless.start.$post(
      {
        json: {
          authParams: AUTH_PARAMS,
          client_id: "clientId",
          connection: "email",
          email: "test@example.com",
          send: "link",
        },
      },
      {
        headers: {
          "content-type": "application/json",
        },
      },
    );

    const magicLink = getMagicLinkFromEmailBody(emails[0]);

    const link = magicLink!;
    // ------------
    // Overwrite the magic link with a bad code, and try and use it
    // ----------------
    const magicLinkWithBadCode = new URL(link!);
    magicLinkWithBadCode.searchParams.set("verification_code", "123456");

    const query = verifyCodeQuerySchema.parse(
      Object.fromEntries(magicLinkWithBadCode.searchParams.entries()),
    );

    const authenticateResponse =
      await oauthClient.passwordless.verify_redirect.$get({
        query,
      });

    // we are still getting a redirect but to a page on login2 saying the code is expired
    expect(authenticateResponse.status).toBe(302);
    const redirectUri = new URL(authenticateResponse.headers.get("location")!);
    expect(redirectUri.hostname).toBe("login.example.com");
    expect(redirectUri.pathname).toBe("/callback");
    expect(redirectUri.searchParams.get("error")).toBe(
      "Code not found or expired",
    );
  });

  it("should not accept a magic link where the email has been altered", async () => {
    const { oauthApp, emails, env } = await getTestServer();
    const oauthClient = testClient(oauthApp, env);

    // -----------
    // get code to log in
    // -----------
    await oauthClient.passwordless.start.$post(
      {
        json: {
          authParams: AUTH_PARAMS,
          client_id: "clientId",
          connection: "email",
          email: "test@example.com",
          send: "link",
        },
      },
      {
        headers: {
          "content-type": "application/json",
        },
      },
    );

    const magicLink = getMagicLinkFromEmailBody(emails[0]);

    const link = magicLink!;
    // ------------
    // Overwrite the magic link with a different email, and try and use it
    // ----------------
    const magicLinkWithBadEmail = new URL(link!);
    magicLinkWithBadEmail.searchParams.set("email", "another@email.com");

    const authenticateResponse2 =
      await oauthClient.passwordless.verify_redirect.$get({
        query: verifyCodeQuerySchema.parse(
          Object.fromEntries(magicLinkWithBadEmail.searchParams.entries()),
        ),
      });
    expect(authenticateResponse2.status).toBe(302);
    const redirectUri2 = new URL(
      authenticateResponse2.headers.get("location")!,
    );
    expect(redirectUri2.hostname).toBe("login.example.com");
    expect(redirectUri2.pathname).toBe("/callback");
    expect(redirectUri2.searchParams.get("error")).toBe("Email does not match");
  });

  describe("edge cases", () => {
    it("should ignore un-verified password account when signing up with magic link", async () => {
      const { oauthApp, emails, env } = await getTestServer();
      const oauthClient = testClient(oauthApp, env);

      // -----------------
      // signup new user
      // -----------------

      const createUserResponse = await oauthClient.dbconnections.signup.$post({
        json: {
          client_id: "clientId",
          connection: "Username-Password-Authentication",
          email: "same-user-signin@example.com",
          password: "Password1234!",
        },
      });
      expect(createUserResponse.status).toBe(200);

      const unverifiedPasswordUser = await createUserResponse.json();

      //-----------------
      // sign up new code user that has same email address
      //-----------------
      await oauthClient.passwordless.start.$post({
        json: {
          authParams: AUTH_PARAMS,
          client_id: "clientId",
          connection: "email",
          email: "same-user-signin@example.com",
          send: "link",
        },
      });

      const magicLink = getMagicLinkFromEmailBody(emails[1]);

      const authenticatePath = magicLink!?.split("https://example.com")[1];

      const querySearchParams = new URLSearchParams(
        authenticatePath.split("?")[1],
      );
      const query = verifyCodeQuerySchema.parse(
        Object.fromEntries(querySearchParams.entries()),
      );

      const authenticateResponse =
        await oauthClient.passwordless.verify_redirect.$get({
          query,
        });
      expect(authenticateResponse.status).toBe(302);

      const redirectUri = new URL(
        authenticateResponse.headers.get("location")!,
      );

      const searchParams = new URLSearchParams(redirectUri.hash.slice(1));

      const accessToken = searchParams.get("access_token");

      const accessTokenPayload = parseJwt(accessToken!);
      expect(accessTokenPayload.sub).not.toBe(unverifiedPasswordUser._id);

      const idToken = searchParams.get("id_token");
      const idTokenPayload = parseJwt(idToken!);
      expect(idTokenPayload.sub).not.toBe(unverifiedPasswordUser._id);
      expect(idTokenPayload.email_verified).toBe(true);
    });
  });
});
// TO TEST
// - should we do silent auth after each of these calls?
