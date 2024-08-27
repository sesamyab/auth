import { createX509Certificate } from "../../src/helpers/encryption";
import { describe, expect, it } from "vitest";
import * as x509 from "@peculiar/x509";
import { createJWT, validateJWT } from "oslo/jwt";
import { TimeSpan } from "oslo";
import { pemToBuffer } from "../../src/utils/jwt";

describe("encryption", () => {
  describe("createX509Certificate", () => {
    it("should create a x509 cert", async () => {
      const signingKey = await createX509Certificate({
        name: "CN=authhero",
      });

      const pemCert = signingKey.cert;
      expect(pemCert).toContain("-----BEGIN CERTIFICATE-----");

      const importedCert = new x509.X509Certificate(pemCert);
      expect(importedCert.subject).toBe("CN=authhero");

      // Make a jwks key
      const publicKey = await importedCert.publicKey.export();
      const jwkKey = await crypto.subtle.exportKey("jwk", publicKey);
      expect(jwkKey.alg).toBe("RS256");

      // Make a public pem key
      const publicPEMKey = importedCert.publicKey.toString("pem");
      expect(publicPEMKey).toContain("-----BEGIN PUBLIC KEY-----");

      expect(importedCert.privateKey).toBe(undefined);

      // Create a jwt
      const jwt = await createJWT(
        "RS256",
        pemToBuffer(signingKey.pkcs7!),
        { foo: "bar" },
        {
          includeIssuedTimestamp: true,
          expiresIn: new TimeSpan(1, "d"),
          headers: {
            kid: "test",
          },
        },
      );

      // Validate the jwt
      const token = await validateJWT(
        "RS256",
        importedCert.publicKey.rawData,
        jwt,
      );
      expect((token.payload as any).foo).toBe("bar");
    });
  });
});
