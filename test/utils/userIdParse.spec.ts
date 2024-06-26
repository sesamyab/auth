import { describe, it, expect, vitest } from "vitest";
import userIdParse from "../../src/utils/userIdParse";

describe("userIdParse", () => {
  it("should return the id part of the user_id if prefixed with provider and pipe", () => {
    const result = userIdParse("auth0|1234567890");
    expect(result).toEqual("1234567890");
  });

  it("should return the id if user_id only only contains the id", () => {
    // mock console.error
    console.error = vitest.fn();

    // this is the defensive programming
    const result = userIdParse("1234567890");
    expect(result).toEqual("1234567890");

    expect(console.error).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenCalledWith("Invalid user_id format");
  });
});
