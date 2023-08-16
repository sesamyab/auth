export function validateRedirectUrl(
  logoutUrls: string[],
  redirectUri?: string,
) {
  if (!redirectUri) {
    return;
  }

  const url = new URL(redirectUri);
  const urlToCompare = `${url.protocol}//${url.host}`;

  const regexes = logoutUrls.map(
    // This replaces * with .* but not if there's already a regex wildcard
    (url) =>
      new RegExp(
        url
          .replace(/\./g, "\\.")
          .replace(/\//g, "\\/")
          .replace(/(?<!\.)\*/g, ".*"),
        "i",
      ),
  );

  if (!regexes.some((regex) => regex.test(urlToCompare))) {
    throw new Error("Invalid redirectUri");
  }
}
