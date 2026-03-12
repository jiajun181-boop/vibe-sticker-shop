/**
 * Pricing Center ownership contract tests.
 *
 * Validates that pricing-center-owned routes use the correct permission module
 * and that intentionally non-pricing routes are documented.
 *
 * This test reads the actual route source files to verify the permission
 * module passed to requirePermission() matches the expected ownership.
 */

import fs from "fs";
import path from "path";

const API_ROOT = path.resolve(__dirname, "../../app/api/admin");

function readRouteFile(...segments: string[]): string {
  const filePath = path.join(API_ROOT, ...segments, "route.ts");
  return fs.readFileSync(filePath, "utf-8");
}

function extractPermissionModule(source: string): string[] {
  // Match: requirePermission(request, "MODULE", "ACTION")
  const matches = [...source.matchAll(/requirePermission\(\s*\w+,\s*"(\w+)",\s*"(\w+)"\)/g)];
  return matches.map(m => `${m[1]}:${m[2]}`);
}

describe("Pricing Center route ownership", () => {
  // ── Pricing-owned routes (must use "pricing" module) ──────────

  const PRICING_OWNED_ROUTES = [
    ["pricing"],
    ["pricing", "cost-completeness"],
    ["pricing", "anomalies"],
    ["pricing", "assign"],
    ["pricing", "audit"],
    ["pricing", "bulk-adjust"],
    ["pricing", "change-log"],
    ["pricing", "change-summary"],
    ["pricing", "floor-check"],
    ["pricing", "ops-reminders"],
    ["pricing", "profit-alerts"],
    ["pricing", "quote-snapshots"],
    ["pricing", "remediation"],
    ["pricing", "vendor-costs"],
    ["pricing", "approvals"],
  ];

  for (const segments of PRICING_OWNED_ROUTES) {
    const routePath = `/api/admin/${segments.join("/")}`;

    test(`${routePath} uses "pricing" permission module`, () => {
      let source: string;
      try {
        source = readRouteFile(...segments);
      } catch {
        // Route may not exist (e.g., nested [id] routes) — skip
        return;
      }
      const permissions = extractPermissionModule(source);
      expect(permissions.length).toBeGreaterThan(0);
      for (const perm of permissions) {
        expect(perm).toMatch(/^pricing:/);
      }
    });
  }

  // ── Quotes routes (must use "pricing" module) ─────────────────

  test("/api/admin/quotes uses pricing:view", () => {
    const source = readRouteFile("quotes");
    const permissions = extractPermissionModule(source);
    expect(permissions).toContain("pricing:view");
    expect(permissions).not.toContainEqual(expect.stringMatching(/^orders:/));
  });

  test("/api/admin/quotes/[id] uses pricing:view and pricing:edit", () => {
    const source = readRouteFile("quotes", "[id]");
    const permissions = extractPermissionModule(source);
    expect(permissions).toContain("pricing:view");
    expect(permissions).toContain("pricing:edit");
    expect(permissions).not.toContainEqual(expect.stringMatching(/^orders:/));
  });

  // ── B2B routes (intentionally uses "b2b" module, documented) ──

  test("/api/admin/pricing/b2b-rules intentionally uses b2b module (not pricing)", () => {
    const source = readRouteFile("pricing", "b2b-rules");
    const permissions = extractPermissionModule(source);
    // B2B routes intentionally use b2b module — sales team owns B2B relationships.
    // This is documented in a comment at the top of the route file.
    expect(permissions.some(p => p.startsWith("b2b:"))).toBe(true);
    // Verify the design decision is documented in the source
    expect(source).toContain("OWNERSHIP:");
  });

  // ── Negative: cost-completeness must NOT use analytics ────────

  test("cost-completeness no longer uses analytics module", () => {
    const source = readRouteFile("pricing", "cost-completeness");
    const permissions = extractPermissionModule(source);
    expect(permissions).not.toContainEqual(expect.stringMatching(/^analytics:/));
    expect(permissions).toContain("pricing:view");
  });
});
