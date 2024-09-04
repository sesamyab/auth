import { Context } from "hono";
import { IdentityProvider } from "samlify";
import { Env, Var } from "../types";
import { Client } from "@authhero/adapter-interfaces";

export function generateSAMLRepsonse(
  ctx: Context<{ Bindings: Env; Variables: Var }>,
  client: Client,
) {
  const idp = IdentityProvider({
    entityID: "https://idp.example.com",
    signingCert: fs.readFileSync("./idp-signing-cert.pem", "utf8"),
    privateKey: idpPrivateKey,
    nameIDFormat: ["urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress"],
    singleSignOnService: [
      {
        Binding: "urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect",
        Location: "https://idp.example.com/sso/saml",
      },
      {
        Binding: "urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST",
        Location: "https://idp.example.com/sso/saml",
      },
    ],
    singleLogoutService: [
      {
        Binding: "urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect",
        Location: "https://idp.example.com/sso/saml/logout",
      },
    ],
  });
}
