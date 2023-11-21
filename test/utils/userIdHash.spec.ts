import userIdHash from "../../src/utils/userIdHash";

describe("userIdHash", () => {
  it("generates a hash", () => {
    const hash = userIdHash({
      tenantId: "tenantId",
      provider: "provider",
      email: "example@hash-id.com",
    });

    expect(hash).toEqual("960657464dcc8b4f4bc48297");
  });
});
