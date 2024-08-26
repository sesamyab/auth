import { createX509Certificate } from "../../src/helpers/encryption";
import { describe, expect, it } from "vitest";
import * as x509 from "@peculiar/x509";
import { createJWT, validateJWT } from "oslo/jwt";
import { TimeSpan } from "oslo";

describe("encryption", () => {
  describe("createX509Certificate", () => {
    it("should create a x509 cert", async () => {
      const { cert, privateKey } = await createX509Certificate({
        name: "CN=authhero",
      });

      // Make a pem of the cert for storage
      const pemCert = cert.toString("pem");
      expect(pemCert).toContain("-----BEGIN CERTIFICATE-----");

      const importedCert = new x509.X509Certificate(pemCert);
      expect(importedCert.subject).toBe("CN=authhero");

      // Make a jwks key
      const publicKey = await importedCert.publicKey.export();
      const jwkKey = await crypto.subtle.exportKey("jwk", publicKey);
      expect(jwkKey.alg).toBe("RS256");

      // Make a puiblic pem key
      const publicPEMKey = importedCert.publicKey.toString("pem");
      expect(publicPEMKey).toContain("-----BEGIN PUBLIC KEY-----");

      // I guess this i by design
      expect(cert.privateKey).toBe(undefined);

      // Create a jwt
      const jwt = await createJWT(
        "RS256",
        privateKey,
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
