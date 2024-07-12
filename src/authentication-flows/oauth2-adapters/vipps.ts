import { OAuth2Provider } from "arctic";
import { OAuth2Client } from "oslo/oauth2";

export class Vipps implements OAuth2Provider {
  private client: OAuth2Client;
  private clientSecret: string;

  constructor(clientId: string, clientSecret: string, redirectURI: string) {
    const authorizeEndpoint =
      "https://api.vipps.no/access-management-1.0/access/oauth2/auth";
    const tokenEndpoint =
      "https://api.vipps.no/access-management-1.0/access/oauth2/token";
    this.client = new OAuth2Client(clientId, authorizeEndpoint, tokenEndpoint, {
      redirectURI,
    });
    this.clientSecret = clientSecret;
  }

  public async createAuthorizationURL(
    state: string,
    options?: {
      scopes?: string[];
    },
  ): Promise<URL> {
    const scopes = options?.scopes ?? [];
    return await this.client.createAuthorizationURL({
      state,
      scopes: [...scopes, "openid"],
    });
  }

  public async validateAuthorizationCode(code: string): Promise<VippsTokens> {
    const result =
      await this.client.validateAuthorizationCode<TokenResponseBody>(code, {
        credentials: this.clientSecret,
      });
    const tokens: VippsTokens = {
      accessToken: result.access_token,
      refreshToken: result.refresh_token,
      idToken: result.id_token,
    };
    return tokens;
  }

  public async refreshAccessToken(refreshToken: string): Promise<VippsTokens> {
    const result = await this.client.refreshAccessToken<TokenResponseBody>(
      refreshToken,
      {
        credentials: this.clientSecret,
      },
    );
    const tokens: VippsTokens = {
      accessToken: result.access_token,
      refreshToken: result.refresh_token,
      idToken: result.id_token,
    };
    return tokens;
  }
}

interface TokenResponseBody {
  access_token: string;
  refresh_token: string;
  id_token: string;
}

export interface VippsTokens {
  accessToken: string;
  refreshToken: string;
  idToken: string;
}
