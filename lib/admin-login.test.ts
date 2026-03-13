import fs from "fs";
import path from "path";
import {
  getAdminRuntimeFailure,
  hasLegacyAdminPasswordConfigured,
  matchesLegacyAdminPassword,
} from "@/lib/admin-login";

const loginRoutePath = path.resolve(
  __dirname,
  "../app/api/admin/login/route.ts"
);
const loginPagePath = path.resolve(
  __dirname,
  "../app/admin/login/page.js"
);

describe("admin login helpers", () => {
  test("recognizes configured legacy admin password", () => {
    expect(hasLegacyAdminPasswordConfigured("secret")).toBe(true);
    expect(hasLegacyAdminPasswordConfigured("   ")).toBe(false);
  });

  test("matches legacy admin password using timing-safe comparison", () => {
    expect(matchesLegacyAdminPassword("secret", "secret")).toBe(true);
    expect(matchesLegacyAdminPassword("secret", "different")).toBe(false);
    expect(matchesLegacyAdminPassword("secret", "")).toBe(false);
  });

  test("maps missing admin JWT secret to actionable error", () => {
    expect(
      getAdminRuntimeFailure(new Error("ADMIN_JWT_SECRET env var is required"))
    ).toEqual({
      error: "Admin session secret is not configured.",
      status: 500,
    });
  });

  test("maps Prisma initialization issues to database errors", () => {
    expect(
      getAdminRuntimeFailure({
        name: "PrismaClientInitializationError",
        message: "Environment variable not found: DATABASE_URL",
      })
    ).toEqual({
      error: "Admin database is not configured.",
      status: 500,
    });

    expect(
      getAdminRuntimeFailure({
        name: "PrismaClientInitializationError",
        message: "Can't reach database server at example",
      })
    ).toEqual({
      error: "Admin database is unavailable.",
      status: 503,
    });
  });
});

describe("admin login compatibility contract", () => {
  test("login route keeps legacy password fallback available", () => {
    const src = fs.readFileSync(loginRoutePath, "utf-8");
    expect(src).toContain("legacyPasswordAccepted");
    expect(src).toContain("createLegacyLoginResponse");
    expect(src).toContain("Preserve legacy single-password access");
  });

  test("admin login page exposes optional email for legacy sign-in", () => {
    const src = fs.readFileSync(loginPagePath, "utf-8");
    expect(src).toMatch(/\{mode === "email"[\s\S]*placeholder="Email \(optional\)"/);
    expect(src).toMatch(
      /\{mode === "email"[\s\S]*leave this blank to use the legacy admin password/
    );
    expect(src).toMatch(/\{mode === "setup"[\s\S]*placeholder="Email"[\s\S]*required/);
  });
});
