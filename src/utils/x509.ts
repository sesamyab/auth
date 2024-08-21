import * as x509 from "@peculiar/x509";
import { nanoid } from "nanoid";
import { encodeHex } from "oslo/encoding";

export async function createX509Certificate() {
  const alg = {
    name: "RSASSA-PKCS1-v1_5",
    hash: "SHA-256",
    publicExponent: new Uint8Array([1, 0, 1]),
    modulusLength: 2048,
  };
  const keys = await crypto.subtle.generateKey(alg, false, ["sign", "verify"]);

  // Generate a nanoid and convert it directly to hex
  const nanoId = nanoid();
  const serialNumber = encodeHex(new TextEncoder().encode(nanoId));

  const cert = await x509.X509CertificateGenerator.createSelfSigned({
    serialNumber,
    name: "CN=Test",
    notBefore: new Date(),
    notAfter: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
    signingAlgorithm: alg,
    keys,
    extensions: [
      new x509.BasicConstraintsExtension(true, 2, true),
      new x509.ExtendedKeyUsageExtension(["1.3.6.1.5.5.7.3.1"], true), // serverAuth
      new x509.KeyUsagesExtension(
        x509.KeyUsageFlags.keyCertSign | x509.KeyUsageFlags.cRLSign,
        true,
      ),
      await x509.SubjectKeyIdentifierExtension.create(keys.publicKey),
    ],
  });

  return cert.toString("base64");
}
