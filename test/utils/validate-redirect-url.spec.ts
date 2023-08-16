import { validateRedirectUrl } from "../../src/utils/validate-redirect-url";

describe("validateRedirectUrl", () => {
  it("should allow valid redirectUri", () => {
    const logoutUrls = ["https://*.example.com"];
    const redirectUri = "https://sub.example.com/path";
    expect(() => validateRedirectUrl(logoutUrls, redirectUri)).not.toThrow();
  });

  it("should disallow invalid redirectUri", () => {
    const logoutUrls = ["https://*.example.com"];
    const redirectUri = "https://notexample.com/path";
    expect(() => validateRedirectUrl(logoutUrls, redirectUri)).toThrow(
      "Invalid redirectUri",
    );
  });

  it("should be case insensitive", () => {
    const logoutUrls = ["https://*.EXAMPLE.com"];
    const redirectUri = "https://sub.example.com/path";
    expect(() => validateRedirectUrl(logoutUrls, redirectUri)).not.toThrow();
  });

  it("should handle URLs without wildcards", () => {
    const logoutUrls = ["https://sub.example.com"];
    const redirectUri = "https://sub.example.com/path";
    expect(() => validateRedirectUrl(logoutUrls, redirectUri)).not.toThrow();
  });

  it("should handle exact matches of urls with ports", () => {
    const logoutUrls = ["http://localhost:3000"];
    const redirectUri = "http://localhost:3000";
    expect(() => validateRedirectUrl(logoutUrls, redirectUri)).not.toThrow();
  });

  it("should throw error for URLs that don't exactly match", () => {
    const logoutUrls = ["https://sub.example.com"];
    const redirectUri = "https://sub2.example.com/path";
    expect(() => validateRedirectUrl(logoutUrls, redirectUri)).toThrow(
      "Invalid redirectUri",
    );
  });
});
