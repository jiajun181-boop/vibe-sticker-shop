import {
  isStatusTokenAuthorized,
  shouldIncludeSensitiveStatusFields,
} from "@/lib/order-status-security";

describe("order-status security", () => {
  it("rejects sessions without expected token (no legacy bypass)", () => {
    expect(isStatusTokenAuthorized(null, "")).toBe(false);
  });

  it("rejects mismatched status token", () => {
    expect(isStatusTokenAuthorized("abc", "xyz")).toBe(false);
  });

  it("allows matched status token", () => {
    expect(isStatusTokenAuthorized("abc", "abc")).toBe(true);
  });

  it("includes sensitive fields only when token matches", () => {
    expect(shouldIncludeSensitiveStatusFields("abc", "abc")).toBe(true);
    expect(shouldIncludeSensitiveStatusFields("abc", "xyz")).toBe(false);
    expect(shouldIncludeSensitiveStatusFields(null, "abc")).toBe(false);
  });
});
