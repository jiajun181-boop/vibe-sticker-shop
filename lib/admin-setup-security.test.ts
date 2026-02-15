import {
  isSetupTokenAccepted,
  isSetupTokenRequired,
} from "@/lib/admin-setup-security";

describe("admin setup security", () => {
  it("requires token in production when token is missing", () => {
    expect(isSetupTokenRequired("production", "")).toBe(true);
    expect(isSetupTokenRequired("production", undefined)).toBe(true);
  });

  it("does not require token outside production", () => {
    expect(isSetupTokenRequired("development", "")).toBe(false);
  });

  it("accepts any provided token when requirement is disabled", () => {
    expect(isSetupTokenAccepted("", "anything")).toBe(true);
  });

  it("accepts only matching token when requirement is enabled", () => {
    expect(isSetupTokenAccepted("secret", "secret")).toBe(true);
    expect(isSetupTokenAccepted("secret", "wrong")).toBe(false);
  });
});
