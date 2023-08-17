import { InvalidRedirectError } from "../errors";

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");
}

// This splits a url in a hosts part including the protocol and the path
const urlPattern: RegExp = /^((?:http[s]?:\/\/)?[^\/]+)(\/.*)?$/;

export function validateRedirectUrl(
  allowedUrls: string[],
  redirectUri?: string,
) {
  if (!redirectUri) {
    return;
  }

  const regexes = allowedUrls.map((allowedUrl) => {
    // This doesn't work in cloudflare workers for whatever reason
    // const url = new URL(allowedUrl);
    const match: RegExpMatchArray | null = allowedUrl.match(urlPattern);
    if (!match) {
      throw new Error("Invalid URL");
    }

    // This replaces * with .* and escapes any other regexes in the string
    const host = escapeRegExp(match[1]).replace(/\\\*/g, ".*");
    // This removes any trailing slahes in the path and escapes any other regexes in the string
    const path = escapeRegExp(match[2] || "").replace(/\/$/, "");

    return new RegExp(`^${host}${path}$`, "i");
  });

  const redirectUrlWithoutTrailingSlash = redirectUri.replace(/\/+$/, "");

  if (!regexes.some((regex) => regex.test(redirectUrlWithoutTrailingSlash))) {
    throw new InvalidRedirectError("Invalid redirectUri");
  }
}
