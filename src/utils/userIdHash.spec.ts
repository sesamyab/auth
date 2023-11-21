import userIdHash from "./userIdHash";

describe("userIdHash", () => {
  it("generates a hash", () => {
    const hash = userIdHash({
      tenantId: "tenantId",
      provider: "provider",
      email: "example@hash-id.com",
    });

    expect(hash).toEqual("e9f5b0b1f7e15f9c4d1c4f7d1");
  });

  it("hey", () => {
    expect(true).toEqual(false);
  });
});
