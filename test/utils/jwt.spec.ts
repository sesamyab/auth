import { subtle } from "crypto";

async function pemToBuffer(pem: string): Promise<ArrayBuffer> {
  const base64String = pem
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\s/g, "");
  return Uint8Array.from(atob(base64String), (c) => c.charCodeAt(0)).buffer;
}

describe("jwtUtils", () => {
  it("should import a pkcs8 key", async () => {
    const pemKey = `-----BEGIN PRIVATE KEY-----
MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQgdRbxAMk+pDNTJpNa
6DnccPdjtZeE62yrXE64rnlqnuagCgYIKoZIzj0DAQehRANCAASp10nVIi/WDLnC
BUGjmNLYjf4T5yJk59Q25sACNL/MCoSYiVO+eP8UgAmbWPigQLEURewtjUKkqAzh
0C9bC4jV
-----END PRIVATE KEY-----`;

    const keyBuffer = await pemToBuffer(pemKey);

    const key = await subtle.importKey(
      "pkcs8",
      keyBuffer,
      {
        name: "ECDSA",
        namedCurve: "P-256", // Assuming P-256 curve (change if needed)
      },
      false, // Not extractable
      ["sign"],
    );

    const msgBuffer = new TextEncoder().encode("Hello");
    const signature = await subtle.sign(
      {
        name: "ECDSA",
        hash: { name: "SHA-256" }, // Using SHA-256 (change if needed)
      },
      key,
      msgBuffer,
    );

    console.log(signature);
  });
});
