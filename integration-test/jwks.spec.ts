import { start } from "./server";

describe("ping", () => {
  let worker;

  beforeEach(async () => {
    worker = await start();
  });

  afterEach(() => {
    worker.stop();
  });

  describe("jwks", () => {
    it("should return an empty list in an empty system", async () => {
      const response = await worker.fetch("/.well-known/jwks.json");

      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body).toEqual({ keys: [] });
    });

    it("should create a new rsa-key and return it", async () => {
      await worker.fetch("/create-key", {
        method: "POST",
      });

      const response = await worker.fetch("/.well-known/jwks.json");

      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body.keys.length).toBe(1);
    });
  });

  it("openid-configuration", async () => {
    const response = await worker.fetch("/.well-known/openid-configuration");

    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.issuer).toBe("https://auth2.sesamy.dev/");
  });
});
