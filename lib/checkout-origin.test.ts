import {
  buildBaseOriginFromHeaders,
  buildSafeRedirectUrls,
  ensureSameOriginUrl,
} from "@/lib/checkout-origin";

describe("checkout origin security", () => {
  it("prefers site url env origin when provided", () => {
    const headers = new Headers({ origin: "https://evil.example" });
    expect(buildBaseOriginFromHeaders(headers, "https://lunarprint.ca/path")).toBe(
      "https://lunarprint.ca"
    );
  });

  it("falls back to origin header", () => {
    const headers = new Headers({ origin: "https://shop.example" });
    expect(buildBaseOriginFromHeaders(headers)).toBe("https://shop.example");
  });

  it("rejects cross-origin redirect url", () => {
    expect(() =>
      ensureSameOriginUrl("https://evil.example/success", "https://shop.example")
    ).toThrow("Redirect URLs must use the same origin");
  });

  it("adds status token to success url", () => {
    const { safeSuccessUrl } = buildSafeRedirectUrls({
      baseOrigin: "https://shop.example",
      successUrl: "https://shop.example/success?foo=1",
      cancelUrl: "https://shop.example/cart",
      statusToken: "tok123",
    });
    expect(safeSuccessUrl).toContain("st=tok123");
    expect(safeSuccessUrl).toContain("foo=1");
  });
});
