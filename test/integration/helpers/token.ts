import { createJWT } from "oslo/jwt";
import { Certificate } from "@authhero/adapter-interfaces";
import { pemToBuffer } from "../../../src/utils/jwt";
import { TimeSpan } from "oslo";

export function getCertificate(): Certificate {
  return {
    private_key:
      "-----BEGIN PRIVATE KEY-----\r\n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\r\nZGmvO8nFDd8aA1glVFSFUNcpd2uD\r\n-----END PRIVATE KEY-----\r\n",
    public_key: JSON.stringify({
      alg: "RS256",
      e: "AQAB",
      kty: "RSA",
      n: "voTRJhX6-iV19z6Dy0Ewav4N-MKsv0DDg_j20ojC06rL1Wbnd4y_4aAsPXE37iCXEKhdo54ZEudYyD0MCnyaqFnbtOx_KmC1wnctqyejs4QbwLLAB2wGiiMJw7-e3V7lQONLKcDETlwy-GVFaZQOpI8n4Gr5CdrLcmpVzHFisaOq4kYZL11g6S9PS-W2RIlpIgoY6OIfp7d_kwehlOYy7YUnbgftgt-tO3-KSEb_KT0eA1PicmJH_7KpFbebPL1dv9bujan31gu0tKkuPpPdpmTbUeLLJ6r43b2UFJ2aZbAKRHtai9bmdkwKXbzuM_gByo0xpH8Hy5FfhWdFAoF2b8Mp3ZXeNzak6-kBoXzemzkz1CqVLA2LubP4BQ4AkjEAXDtQcl_1VVcS88c7r377dF3Y_hCTbXeg7LQ6e-KUlMX7azztHb84CSDmFj4a-Kj_zDe35dhQoEi2oThKHvfFETO9UYgNbu4GkmU1xUu_a0gBbt1rn74KeCC5I85ERX0x_VqfyNV37rPROgUoM_b6MP9swBCY4IC-L5SBpkU0EAuIcc2Sk6hKMa4T2umfX1eJK6n06OKqv6QzjlUNSw1tjA0FvbPoDAss-_71Xkse4_KWUyhInZQfhfHTQs-qrwedmIdO9Tb2EGqbofe0GA_YpBv0ShEzKnnxOHC99ZFijt8",
      use: "sig",
    }),
    kid: "s45bQJ933dwqmrB92ee-l",
    created_at: new Date().toISOString(),
  };
}

export async function getAdminToken() {
  const certificate = getCertificate();

  const keyBuffer = pemToBuffer(certificate.private_key);

  return createJWT(
    "RS256",
    keyBuffer,
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
