import { describe, expect, it } from "@jest/globals";
import { contextFixture, controllerFixture } from "../fixtures";

import { socialAuth, socialAuthCallback } from "../../src/authentication-flows";
import {
  AuthorizationResponseMode,
  AuthorizationResponseType,
} from "../../src/types";
import { CLIENT_FIXTURE } from "../fixtures/client";
import { parseJwt } from "../../src/utils/parse-jwt";

describe("socialAuth", () => {
  const date = new Date();

  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(date);
  });
  afterAll(() => {
    jest.useRealTimers();
  });

  it("should redirect to the social connection", async () => {
    const ctx = contextFixture({});
    const controller = controllerFixture();

    const state = "state";
    const redirect_uri = "https://example.com";

    const response = await socialAuth(
      ctx.env,
      controller,
      CLIENT_FIXTURE,
      "google-oauth2",
      {
        client_id: "clientId",
        state,
        redirect_uri,
        scope: "openid profile email",
        response_type: AuthorizationResponseType.TOKEN,
        response_mode: AuthorizationResponseMode.FRAGMENT,
      },
    );
    expect(response).toBe("Redirecting to google-oauth2");

    const redirectHeader = controller.getHeader("location") as string;
    expect(redirectHeader).toBe(
      "https://accounts.google.com/o/oauth2/v2/auth?scope=openid+profile+email&state=eyJhdXRoUGFyYW1zIjp7ImNsaWVudF9pZCI6ImNsaWVudElkIiwic3RhdGUiOiJzdGF0ZSIsInJlZGlyZWN0X3VyaSI6Imh0dHBzOi8vZXhhbXBsZS5jb20iLCJzY29wZSI6Im9wZW5pZCBwcm9maWxlIGVtYWlsIiwicmVzcG9uc2VfdHlwZSI6InRva2VuIiwicmVzcG9uc2VfbW9kZSI6ImZyYWdtZW50In0sImNvbm5lY3Rpb24iOiJnb29nbGUtb2F1dGgyIn0&redirect_uri=https%3A%2F%2Fauth.example.com%2Fcallback&client_id=googleClientId&response_type=code&response_mode=query",
    );
  });

  it("should fetch the user profile from the id-token", async () => {
    const ctx = contextFixture({});
    // There is a mocked user in the fixture
    const controller = controllerFixture();

    const response = await socialAuthCallback({
      ctx,
      controller,
      state: {
        connection: "google-oauth2",
        authParams: {
          client_id: "clientId",
          redirect_uri: "https://example.com",
          response_type: AuthorizationResponseType.TOKEN_ID_TOKEN,
        },
        state: "state",
      },
      code: "code",
    });

    expect(response).toBe("Redirecting");

    const redirectUrl = new URL(controller.getHeader("location") as string);

    const accessToken = parseJwt(
      redirectUrl.searchParams.get("access_token") as string,
    );
    const idToken = parseJwt(
      redirectUrl.searchParams.get("id_token") as string,
    );

    expect(accessToken.sub).toBe("google-oauth2|10451045104510451");
    expect(idToken.email).toBe("örjan.lindström");
  });
});
