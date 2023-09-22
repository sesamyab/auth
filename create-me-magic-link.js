// programatically create a URL like this
// https://auth.sesamy.dev/passwordless/verify_redirect?scope=openid%20profile%20email&response_type=token%20id_token&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fcallback&audience=https%3A%2F%2Fsesamy.com&state=BzXDdrjFHtV-LKRiCJe7E_DfanfEto7r&nonce=cVtXwaJSy-saHKdYnls71c3s9Ra09Lsy&verification_code=643052&connection=email&client_id=0N0wUHXFl0TMTY2L9aDJYvwX7Xy84HkW&email=dan%2Bnew-magic-link%40sesamy.com

const createMeUrl = (email, verificationCode, clientId, redirectUri) => {
  const url = new URL("https://auth2.sesamy.dev/passwordless/verify_redirect");

  url.searchParams.append("scope", "openid profile email");
  url.searchParams.append("response_type", "token id_token");
  url.searchParams.append("redirect_uri", redirectUri);
  url.searchParams.append("audience", "https://sesamy.com");
  url.searchParams.append("state", "state-key");
  url.searchParams.append("nonce", "nonce-key");
  url.searchParams.append("verification_code", verificationCode);
  url.searchParams.append("connection", "email");
  url.searchParams.append("client_id", clientId);
  url.searchParams.append("email", email);

  return url.toString();
};

console.log(
  createMeUrl("dan+456@sesamy.com", "196178", "breakit", "https://example.com"),
);

// https://login2.sesamy.dev/enter-email?client_id=breakit&connection=auth2
