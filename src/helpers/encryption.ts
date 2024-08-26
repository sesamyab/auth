import { Certificate } from "@authhero/adapter-interfaces";
import { nanoid } from "nanoid";
import * as x509 from "@peculiar/x509";
import { encodeHex, base64 } from "oslo/encoding";

export async function createRsaCertificate(): Promise<Certificate> {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 4096,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["encrypt", "decrypt"],
  );

  const kid = nanoid();

  const private_key = await toPrivatePEM(keyPair.privateKey);
  const publicJWKS = await toJWKS(keyPair.publicKey);

  return {
    private_key,
    public_key: JSON.stringify({
      alg: "RS256",
      e: "AQAB",
      kty: "RSA",
      n: publicJWKS.n,
      use: "sig",
    }),
    kid,
    created_at: new Date().toISOString(),
  };
}

export interface CreateX509CertificateParams {
  name: string;
}
export async function createX509Certificate(
  params: CreateX509CertificateParams,
) {
  const alg = {
    name: "RSASSA-PKCS1-v1_5",
    hash: "SHA-256",
    publicExponent: new Uint8Array([1, 0, 1]),
    modulusLength: 2048,
  };
  const keys = await crypto.subtle.generateKey(alg, true, ["sign", "verify"]);

  // Generate a nanoid and convert it directly to hex
  const nanoId = nanoid();
  const serialNumber = encodeHex(new TextEncoder().encode(nanoId));

  const cert = await x509.X509CertificateGenerator.createSelfSigned({
    serialNumber,
    name: params.name,
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

  const privateKey = await crypto.subtle.exportKey("pkcs8", keys.privateKey!);

  return {
    cert,
    privateKey,
  };
}

function convertBinaryToPem(binaryData: ArrayBuffer) {
  const base64Cert = base64.encode(new Uint8Array(binaryData));
  // const base64Cert = arrayBufferToBase64String(binaryData);
  let pemCert = "-----BEGIN PRIVATE KEY-----\r\n";
  let nextIndex = 0;

  while (nextIndex < base64Cert.length) {
    if (nextIndex + 64 <= base64Cert.length) {
      pemCert += base64Cert.substr(nextIndex, 64) + "\r\n";
    } else {
      pemCert += base64Cert.substr(nextIndex) + "\r\n";
    }
    nextIndex += 64;
  }
  pemCert += "-----END PRIVATE KEY-----\r\n";
  return pemCert;
}

async function toPrivatePEM(key: CryptoKey): Promise<string> {
  const pkcs8Key = await crypto.subtle.exportKey("pkcs8", key);

  return convertBinaryToPem(pkcs8Key);
}

async function toJWKS(key: CryptoKey): Promise<JsonWebKey> {
  return await crypto.subtle.exportKey("jwk", key);
}
