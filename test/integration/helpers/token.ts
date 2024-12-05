import { createJWT } from "oslo/jwt";
import { pemToBuffer } from "../../../src/utils/jwt";
import { TimeSpan } from "oslo";
import { createX509Certificate } from "../../../src/helpers/encryption";
import { SigningKey } from "authhero";

let signingKey: SigningKey | null = null;

export async function getCertificate() {
  if (!signingKey) {
    signingKey = await createX509Certificate({
      name: "CN=sesamy",
    });
  }

  return signingKey;
}

export async function getAdminToken() {
  const certificate = await getCertificate();

  return createJWT(
    "RS256",
    pemToBuffer(certificate.pkcs7!),
    {
      aud: "example.com",
      scope: "openid email profile",
      permissions: ["auth:read", "auth:write"],
      sub: "userId",
      iss: "test.example.com",
    },
    {
      includeIssuedTimestamp: true,
      expiresIn: new TimeSpan(1, "h"),
      headers: {
        kid: certificate.kid,
      },
    },
  );
}
