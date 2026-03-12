/**
 * Tests for the canonical pricing focus contract.
 *
 * Validates:
 * 1. URL serialization (buildPricingUrl)
 * 2. URL parsing (parsePricingFocus)
 * 3. Round-trip consistency (build → parse → build)
 * 4. Exact-target detection (hasExactTarget)
 * 5. Order URL builder (buildOrderUrl)
 * 6. ops-action.ts re-exports focus contract
 */

import {
  buildPricingUrl,
  parsePricingFocus,
  buildOrderUrl,
  hasExactTarget,
  type PricingFocus,
} from "./focus";

// ── URL serialization ────────────────────────────────────────────

describe("buildPricingUrl", () => {
  test("tab only → /admin/pricing?tab=costs", () => {
    expect(buildPricingUrl({ tab: "costs" })).toBe("/admin/pricing?tab=costs");
  });

  test("tab + section → governance section", () => {
    const url = buildPricingUrl({ tab: "governance", section: "vendor" });
    expect(url).toContain("tab=governance");
    expect(url).toContain("section=vendor");
  });

  test("exact cost entry → orderId + itemId", () => {
    const url = buildPricingUrl({ tab: "costs", orderId: "o1", itemId: "i1" });
    expect(url).toContain("orderId=o1");
    expect(url).toContain("itemId=i1");
  });

  test("exact product → slug", () => {
    const url = buildPricingUrl({ tab: "products", slug: "die-cut" });
    expect(url).toContain("slug=die-cut");
  });

  test("exact approval → approvalId", () => {
    const url = buildPricingUrl({ tab: "governance", section: "approvals", approvalId: "apr-1" });
    expect(url).toContain("approvalId=apr-1");
  });

  test("returnTo is included", () => {
    const url = buildPricingUrl({ tab: "costs", returnTo: "/admin/orders/o1" });
    expect(url).toContain("returnTo=%2Fadmin%2Forders%2Fo1");
  });

  test("source is included", () => {
    const url = buildPricingUrl({ tab: "costs", source: "production" });
    expect(url).toContain("source=production");
  });

  test("empty focus → /admin/pricing", () => {
    expect(buildPricingUrl({})).toBe("/admin/pricing");
  });

  test("undefined fields are omitted", () => {
    const url = buildPricingUrl({ tab: "costs", orderId: undefined, slug: undefined });
    expect(url).toBe("/admin/pricing?tab=costs");
    expect(url).not.toContain("orderId");
    expect(url).not.toContain("slug");
  });
});

// ── URL parsing ──────────────────────────────────────────────────

describe("parsePricingFocus", () => {
  test("parses URLSearchParams", () => {
    const params = new URLSearchParams("tab=costs&orderId=o1&itemId=i1");
    const focus = parsePricingFocus(params);
    expect(focus.tab).toBe("costs");
    expect(focus.orderId).toBe("o1");
    expect(focus.itemId).toBe("i1");
  });

  test("parses string query", () => {
    const focus = parsePricingFocus("tab=governance&section=vendor&slug=roll-labels");
    expect(focus.tab).toBe("governance");
    expect(focus.section).toBe("vendor");
    expect(focus.slug).toBe("roll-labels");
  });

  test("parses plain object", () => {
    const focus = parsePricingFocus({ tab: "products", slug: "foam-board" });
    expect(focus.tab).toBe("products");
    expect(focus.slug).toBe("foam-board");
  });

  test("missing fields are undefined", () => {
    const focus = parsePricingFocus("tab=costs");
    expect(focus.orderId).toBeUndefined();
    expect(focus.itemId).toBeUndefined();
    expect(focus.slug).toBeUndefined();
    expect(focus.returnTo).toBeUndefined();
  });
});

// ── Round-trip consistency ────────────────────────────────────────

describe("round-trip: build → parse → build", () => {
  const cases: PricingFocus[] = [
    { tab: "costs", orderId: "o1", itemId: "i1" },
    { tab: "governance", section: "approvals", approvalId: "apr-1" },
    { tab: "products", slug: "die-cut" },
    { tab: "governance", section: "vendor", slug: "roll-labels" },
    { tab: "costs", orderId: "o2", returnTo: "/admin/orders/o2", source: "workstation" },
  ];

  for (const original of cases) {
    test(`round-trips: ${JSON.stringify(original)}`, () => {
      const url = buildPricingUrl(original);
      const qs = url.split("?")[1] || "";
      const parsed = parsePricingFocus(qs);
      const rebuilt = buildPricingUrl(parsed);
      expect(rebuilt).toBe(url);
    });
  }
});

// ── Exact target detection ───────────────────────────────────────

describe("hasExactTarget", () => {
  test("returns true when orderId is set", () => {
    expect(hasExactTarget({ orderId: "o1" })).toBe(true);
  });

  test("returns true when slug is set", () => {
    expect(hasExactTarget({ slug: "die-cut" })).toBe(true);
  });

  test("returns true when approvalId is set", () => {
    expect(hasExactTarget({ approvalId: "apr-1" })).toBe(true);
  });

  test("returns false when only tab is set", () => {
    expect(hasExactTarget({ tab: "costs" })).toBe(false);
  });

  test("returns false for empty focus", () => {
    expect(hasExactTarget({})).toBe(false);
  });
});

// ── Order URL builder ────────────────────────────────────────────

describe("buildOrderUrl", () => {
  test("basic order URL", () => {
    expect(buildOrderUrl("ord-1")).toBe("/admin/orders/ord-1");
  });

  test("with returnTo", () => {
    const url = buildOrderUrl("ord-1", "/admin/pricing?tab=costs");
    expect(url).toContain("/admin/orders/ord-1");
    expect(url).toContain("returnTo=");
    expect(url).toContain("pricing");
  });
});

// ── Re-export from ops-action ────────────────────────────────────

describe("ops-action re-exports focus contract", () => {
  test("ops-action.ts imports and re-exports focus helpers", () => {
    const fs = require("fs");
    const path = require("path");
    const src = fs.readFileSync(path.resolve(__dirname, "./ops-action.ts"), "utf-8");
    expect(src).toContain('from "./focus"');
    expect(src).toContain("buildPricingUrl");
    expect(src).toContain("parsePricingFocus");
    expect(src).toContain("hasExactTarget");
    expect(src).toContain("buildOrderUrl");
  });
});
