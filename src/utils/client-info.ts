export function getClientInfo(headers: Headers) {
  return {
    auth0Client: headers.get("auth0-client")?.slice(0, 256),
    ip: headers.get("x-real-ip")?.slice(0, 29),
    useragent: headers.get("user-agent")?.slice(0, 256),
  };
}
