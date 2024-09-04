import { describe, it, expect } from "vitest";
import { getTestServer } from "../helpers/test-server";
import { testClient } from "hono/testing";
import { IdentityProvider, ServiceProvider } from "samlify";

describe("saml", () => {
  it.only("should validate the functionalilty of the samlify library", async () => {
    const privateKey = `-----BEGIN PRIVATE KEY-----
MIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQDIWD5i+HzvVL3o
K06TXKUtafCFOQT5R/kv/cghyhtprIeVPrEB/1DmnippbaJHZjV3E/ejUBl37w4e
zLzaF7fj4xSLxw352OlYH7+jxyjO5XlNkyUbwaAFaGlGPdWCX0MfCVw9+yWdvUgn
kzfwn29/wMjD99rSx1p/Z1zW85kGchhYbfhLhdia3CaXJ4feCFLLH/g0lnvj2jQ2
aaA/WcoXbNGWp6h8Sjrh3fN9JURZKvHCH6nO0qK6f+0ny0u1DHeeaU+41aTOMC1s
q6mTItHXjzXcT/R9ycpoc0iR2bWCB2ammfEISu9OsKxo/sSqz4uPcWV5Y9UU4ekl
0+3FPcRJAgMBAAECggEABe8ghe5F8RF/AIH2iq8wpfbgghRYHTQbDDywRq6a/5cg
evSyPyoQpja4GzWn8Vp0f0mZnlOQiuNgn9vrmhV1bmwQSeWZozVgD//8vVKjAaHS
unqpxjfcJVzcMBGZId/wIoVfSedcTAmfugBbz1DsTLST8xiueWt14ZaDraA7KkbT
E3k9npImkiWwkW/tgYU75E8KAYDPqDj0+fsEJP4xPg82cuy6xfUt7ag/MhZJ984W
xx5zZml54NoO6zCzs5iMxpMqLu0OGMlSZavolXpvmWoecYbaLZp4B7GcIfAEBncN
JR6lfFzn/1he3rcWu98KO7MA2qFzBukhNYBWj7NDqQKBgQD1w3dxkk5DsKd6CLx/
zhgxFCOQb2wA5jD7KnvluRs/UxHkcHgwuB3HAuJe6a/LAnxkMVJAB5Is8tx+24Re
cKzOBSzy16TnsC6lG51oMKdu1WTU3YvWC3k7wmKU75+oQqpBhqM7qa5yz6yqY/59
XzWQW6DkeQPnJHTDFD42u0LdzQKBgQDQsHvo+gAQUJNmqlrn3ld4h6Dcizqi8iaG
qnh+RrjOpteSxYnHdnV8IpHgXNdBXYg1h9kxIdjrG/vSApAAl5QUXEsZaU1xBY2W
E7EBQyLRyPHuZQsnKAwSfBZOt7m86doWFwuekz7TjCIR6/MNpbR5qkyHjkftt0IH
w1okJGakbQKBgQDPl6KHHmxZpRhybnq7Ah1RJ4+660Mxpz9siUBKlYc8gDC244HC
tWMBvZ/1SDOjqZ/lCfxN9Zc1vJcf2NEA7PAqvhhvsFOtGRbthFv7rE1hw4L+g30g
+mQXZGTdJWOZP2aNHus29GdUt7ND4l8PC6M1IxDOrKHtVtACEFFU7ezXaQKBgQCV
J96YSL7s6jpAIbgxi2fnXMDrgJObTQmeLI9Mac3C3dqsK4XrS05zN94dhx3OuUQW
Ro9En5WDjQ+yLWSxF6Wd281NT0crZbWps09KwKpNWJsaMZwEE4p1V7016/jT/iyC
p1wFreY0my7qskKY2Xuhjcd/B4F/dQC7vbNaq621DQKBgQDibKfxaTVD39lJlFBu
arEPU1OvqJjVUwwdk435ciI9Bz1ua5KFkSLEVRpDm0hcFgxg7gWarNlz24SRskDD
8yeWnD4PZ2bcakUp/21xMz6mFy1XEJD5Knrz8wu3jGZ9Oa+8KpTH0Opc5hOSgAG8
QcS52EfulfCg46qho7I/hBQnxw==
-----END PRIVATE KEY-----`;

    const signingCert = ` -----BEGIN CERTIFICATE-----
MIIDDjCCAfagAwIBAgIVWEQ1V0lsWTRyMkp5ZlZGeUlka0cxMA0GCSqGSIb3DQEB
CwUAMBExDzANBgNVBAMTBnNlc2FteTAeFw0yNDA5MDQwODQyNDdaFw0yNTA5MDQw
ODQyNDdaMBExDzANBgNVBAMTBnNlc2FteTCCASIwDQYJKoZIhvcNAQEBBQADggEP
ADCCAQoCggEBAMhYPmL4fO9UvegrTpNcpS1p8IU5BPlH+S/9yCHKG2msh5U+sQH/
UOaeKmltokdmNXcT96NQGXfvDh7MvNoXt+PjFIvHDfnY6Vgfv6PHKM7leU2TJRvB
oAVoaUY91YJfQx8JXD37JZ29SCeTN/Cfb3/AyMP32tLHWn9nXNbzmQZyGFht+EuF
2JrcJpcnh94IUssf+DSWe+PaNDZpoD9Zyhds0ZanqHxKOuHd830lRFkq8cIfqc7S
orp/7SfLS7UMd55pT7jVpM4wLWyrqZMi0dePNdxP9H3JymhzSJHZtYIHZqaZ8QhK
706wrGj+xKrPi49xZXlj1RTh6SXT7cU9xEkCAwEAAaNdMFswEgYDVR0TAQH/BAgw
BgEB/wIBAjAWBgNVHSUBAf8EDDAKBggrBgEFBQcDATAOBgNVHQ8BAf8EBAMCAQYw
HQYDVR0OBBYEFI4SwNmEm0stZmkHnyXH6asTw8gDMA0GCSqGSIb3DQEBCwUAA4IB
AQCWT/ZSfKRuE8GGq3qUndWVDU/aolo7OrgFRySfqAcPDD3NwnaxpWTeSrYjFK5j
pj9f3oJR3RkHw2bd+JNa358OUGd6DxgaVN3pPg0cf2dnSrnV4bl6kShXo4YUsYy3
tYJQ7UiJayBq3/hHCAf6ThfrcF/AtdMBDJ3W0KNZopR0A02COmUcPPAiqlfCB/Wj
HRP6P/ZUroIbiqckgNvczA2odMX0RB5EML4QzhSWkC3rteTSKA9Vh1dqPVdOa8as
+FRc2ZbFnAlicxDbXpkXKALrF3SJjYtrkInbQcUZRZl7PDSxpyr6Qc1fQkx1wHpR
NxutvpOluWCZW0iAbiJnKBJ7
-----END CERTIFICATE-----`;

    const idp = IdentityProvider({
      privateKey,
      entityID: "https://example.com",
      signingCert,
      isAssertionEncrypted: false,
      singleSignOnService: [
        {
          Binding: "urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect",
          Location: "https://example.com/samlp/appId",
        },
        {
          Binding: "urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST",
          Location: "https://example.com/samlp/appId",
        },
      ],
      singleLogoutService: [
        {
          Binding: "urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect",
          Location: "https://example.com/samlp/appId/logout",
        },
        {
          Binding: "urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST",
          Location: "https://example.com/samlp/appId/logout",
        },
      ],
    });

    const genereatedMetadata = idp.getMetadata();
    expect(genereatedMetadata).toBeTypeOf("string");

    const sp = ServiceProvider({
      entityID: "https://scplay.skiclassics.com/saml/metadata",
    });

    const loginRequest = await idp.parseLoginRequest(sp, "redirect", {
      query: {
        SAMLRequest:
          "jZLLjtowFIZfJTuvEjtpgMYiSBGoEhKtRsxMF91UB+eMxsWX1Meh5e3HBKHSxVTdWv/l828vCawZZDfGV7fHnyNSzDoiDFF7t/aORovhEcNJK3ze71r2GuNAknNSg4FzQUetDBBpRYXyll/iuLr6WLZJcdrBJeuP84hnZTwci4A/DAbKKZxEWRBySBQ8IBhL3AJFDHwIPnrlzRTMsk8+KJxgWxbDmCq2m5Z9L/sG68Nhns+aQ53Xi7rJoTzMcrWAZjZbqLkQL0lKNOLWUQQXW1aJqs7Fx/yDeBKNrCop6m8s+5qAJtqqECz7bY0jealu2Ric9ECapAOLJKOSj93nnUxCCbfF7i3Dvz23m7HV8qKWE11Y/c++FiP0EGHJ753L61N+SU3bzYM3Wp2zzhj/a50mjXgbLE1oIb7PVhbldKL7/GWSSrSgTdf3AYkYX11b//4zqzc=",
      },
    });

    expect(loginRequest).toBeTypeOf("object");
  });

  it("should make a successful saml login", async () => {
    const { env, samlApp } = await getTestServer();
    const samlClient = testClient(samlApp, env);

    const samlRequest =
      "jZLLjtowFIZfJTuvEjtpgMYiSBGoEhKtRsxMF91UB+eMxsWX1Meh5e3HBKHSxVTdWv/l828vCawZZDfGV7fHnyNSzDoiDFF7t/aORovhEcNJK3ze71r2GuNAknNSg4FzQUetDBBpRYXyll/iuLr6WLZJcdrBJeuP84hnZTwci4A/DAbKKZxEWRBySBQ8IBhL3AJFDHwIPnrlzRTMsk8+KJxgWxbDmCq2m5Z9L/sG68Nhns+aQ53Xi7rJoTzMcrWAZjZbqLkQL0lKNOLWUQQXW1aJqs7Fx/yDeBKNrCop6m8s+5qAJtqqECz7bY0jealu2Ric9ECapAOLJKOSj93nnUxCCbfF7i3Dvz23m7HV8qKWE11Y/c++FiP0EGHJ753L61N+SU3bzYM3Wp2zzhj/a50mjXgbLE1oIb7PVhbldKL7/GWSSrSgTdf3AYkYX11b//4zqzc=";

    const response = await samlClient.samlp[":application_id"].$get({
      param: {
        application_id: "DEFAULT_CLIENT",
      },
      query: {
        SAMLRequest: samlRequest,
      },
    });

    expect(response.status).toBe(302);
    const location = response.headers.get("location");
    expect(location).toBeTypeOf("string");
    const state = new URL(location!).searchParams.get("state");

    expect(state).toBeTypeOf("string");
  });
});
