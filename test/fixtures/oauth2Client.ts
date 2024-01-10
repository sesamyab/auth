import { createToken } from "../../src/utils/jwt";
import {
  IOAuth2Client,
  OAuthProviderParams,
  TokenResponse,
} from "../../src/services/oauth2-client";
import { getCertificate } from "../../integration-test/helpers/token";

export function oAuth2ClientFactory(
  params: OAuthProviderParams,
  redirectUri: string,
): IOAuth2Client {
  return new OAuth2ClientFixture(params, redirectUri);
}

export class OAuth2ClientFixture implements IOAuth2Client {
  private readonly params: OAuthProviderParams;
  private readonly redirectUri: string;

  constructor(params: OAuthProviderParams, redirectUri: string) {
    this.params = params;
    this.redirectUri = redirectUri;
  }

  async getAuthorizationUrl(state: string): Promise<string> {
    return "https://example.com";
  }

  async exchangeCodeForTokenResponse(code: string): Promise<TokenResponse> {
    const access_token = await createToken({
      pemKey: getCertificate().private_key,
      alg: "RS256",
      headerAdditions: {},
      payload: {
        iss: "https://accounts.google.com",
        sub: "10451045104510451",
        aud: "250848680337272",
        exp: 1616470948,
        iat: 1616467348,
      },
    });

    const id_token = await createToken({
      pemKey: getCertificate().private_key,
      alg: "RS256",
      headerAdditions: {},
      payload: {
        iss: "https://accounts.google.com",
        sub: "10451045104510451",
        aud: "250848680337272",
        exp: 1616470948,
        iat: 1616467348,
        name: "Örjan Lindström",
        given_name: "Örjan",
        family_name: "Lindström",
        at_hash: "atHash",
        email: "örjan.lindström",
        email_verified: true,
      },
    });

    return {
      access_token,
      token_type: "token_type",
      id_token,
      expires_in: 3600,
      refresh_token: "refresh_token",
    };
  }

  async getUserProfile(
    accessToken: string,
  ): Promise<{ [key: string]: string }> {
    return {
      id: "id",
      email: "email",
      name: "name",
    };
  }
}
