import { describe, it, expect } from "vitest";
import { getTestServer } from "../helpers/test-server";
import { testClient } from "hono/testing";
import exp from "constants";

describe("saml", () => {
  it.skip("should make a successful saml login", async () => {
    const { oauthApp, env, samlApp } = await getTestServer();
    const samlClient = testClient(samlApp, env);

    const samlRequest =
      "jZLLjtowFIZfJTuvEjtpgMYiSBGoEhKtRsxMF91UB+eMxsWX1Meh5e3HBKHSxVTdWv/l828vCawZZDfGV7fHnyNSzDoiDFF7t/aORovhEcNJK3ze71r2GuNAknNSg4FzQUetDBBpRYXyll/iuLr6WLZJcdrBJeuP84hnZTwci4A/DAbKKZxEWRBySBQ8IBhL3AJFDHwIPnrlzRTMsk8+KJxgWxbDmCq2m5Z9L/sG68Nhns+aQ53Xi7rJoTzMcrWAZjZbqLkQL0lKNOLWUQQXW1aJqs7Fx/yDeBKNrCop6m8s+5qAJtqqECz7bY0jealu2Ric9ECapAOLJKOSj93nnUxCCbfF7i3Dvz23m7HV8qKWE11Y/c++FiP0EGHJ753L61N+SU3bzYM3Wp2zzhj/a50mjXgbLE1oIb7PVhbldKL7/GWSSrSgTdf3AYkYX11b//4zqzc=";

    const response = await samlClient.samlp[":application_id"].$get({
      param: {
        application_id: "request",
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
