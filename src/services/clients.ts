import { Env } from "../types";
import { getDefaultSettings } from "../models/DefaultSettings";
import { HTTPException } from "hono/http-exception";
import { Client } from "@authhero/adapter-interfaces";

// TODO: Remove this and use strategys
const defaultSettings = {
  connections: [
    {
      name: "google-oauth2",
      scope: "email profile",
      authorization_endpoint: "https://accounts.google.com/o/oauth2/v2/auth",
      token_endpoint: "https://oauth2.googleapis.com/token",
      token_exchange_basic_auth: true,
      response_type: "code",
      response_mode: "query",
    },
    {
      name: "facebook",
      scope: "email public_profile openid",
      authorization_endpoint: "https://www.facebook.com/dialog/oauth",
      token_endpoint: "https://graph.facebook.com/oauth/access_token",
      token_exchange_basic_auth: true,
    },
  ],
};

export async function getClient(env: Env, clientId: string): Promise<Client> {
  const client = await env.data.clients.get(clientId);
  if (!client) {
    throw new HTTPException(403, { message: "Client not found" });
  }

  const envDefaultSettings = await getDefaultSettings(env);

  const connections = client.connections
    .map((connection) => {
      const defaultConnection =
        defaultSettings?.connections?.find((c) => c.name === connection.name) ||
        {};

      const envDefaultConnection =
        envDefaultSettings?.connections?.find(
          (c) => c.name === connection.name,
        ) || {};

      const mergedConnection = {
        ...defaultConnection,
        ...envDefaultConnection,
        ...connection,
      };

      return mergedConnection;
    })
    .filter((c) => c);

  return {
    ...client,
    web_origins: [
      ...(envDefaultSettings.web_origins || []),
      ...client.web_origins,
      `${env.ISSUER}u/login`,
    ],
    allowed_logout_urls: [
      ...(envDefaultSettings.allowed_logout_urls || []),
      ...client.allowed_logout_urls,
      env.ISSUER,
    ],
    callbacks: [
      ...(envDefaultSettings.callbacks || []),
      ...client.callbacks,
      `${env.ISSUER}u/info`,
    ],
    connections,
    domains: [...client.domains, ...(envDefaultSettings.domains || [])],
    tenant: {
      ...envDefaultSettings.tenant,
      ...client.tenant,
    },
  };
}
