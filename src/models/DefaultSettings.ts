import { Env } from "../types";

export async function getDefaultSettings(env: Env) {
  const defaultSetttingsClient = await env.data.clients.get("DEFAULT_CLIENT");
  if (defaultSetttingsClient) {
    return defaultSetttingsClient;
  }
  return {
    allowed_logout_urls: [],
    web_origins: [],
    callbacks: [],
    connections: [],
    domains: [],
    tenant: {
      logo: "",
      primary_color: "",
      secondary_color: "",
      sender_email: "",
      sender_name: "",
    },
  };
}
