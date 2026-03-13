/**
 * Regression tests for Products Center view model (admin-centers.js).
 *
 * Validates:
 *   P1: PRODUCT_CENTER_VIEWS completeness — all peer views present with required fields
 *   P2: getProductCenterView — lookup with fallback
 *   P3: buildProductCenterHref — URL generation for each view
 *   P4: Deep workspaces — image-dashboard maps to media parent
 *   P5: Cross-system contract — views align with RBAC and navigation
 */

import {
  PRODUCT_CENTER_VIEWS,
  getProductCenterView,
  buildProductCenterHref,
  getProductCenterDeep,
} from "@/lib/admin-centers";

import { ADMIN_NAV_ITEMS } from "@/lib/admin-navigation";

import {
  canAccessAdminPage,
  MODULE_NAV_MAP,
} from "@/lib/admin-permissions";

// ── P1: PRODUCT_CENTER_VIEWS completeness ───────────────────────────────────

describe("P1: PRODUCT_CENTER_VIEWS", () => {
  const REQUIRED_VIEW_IDS = ["products", "pricing", "materials", "media", "coupons"];

  it("contains all expected peer views", () => {
    const ids = PRODUCT_CENTER_VIEWS.map((v: { id: string }) => v.id);
    for (const id of REQUIRED_VIEW_IDS) {
      expect(ids).toContain(id);
    }
  });

  it("has exactly 5 views", () => {
    expect(PRODUCT_CENTER_VIEWS).toHaveLength(5);
  });

  it("every view has id, labelKey, and href", () => {
    for (const view of PRODUCT_CENTER_VIEWS) {
      expect(view).toHaveProperty("id");
      expect(view).toHaveProperty("labelKey");
      expect(view).toHaveProperty("href");
      expect(typeof view.labelKey).toBe("string");
      expect(view.href).toMatch(/^\/admin\//);
    }
  });
});

// ── P2: getProductCenterView lookup ─────────────────────────────────────────

describe("P2: getProductCenterView", () => {
  it("returns correct view for valid id", () => {
    expect(getProductCenterView("products").id).toBe("products");
    expect(getProductCenterView("pricing").id).toBe("pricing");
    expect(getProductCenterView("materials").id).toBe("materials");
    expect(getProductCenterView("media").id).toBe("media");
    expect(getProductCenterView("coupons").id).toBe("coupons");
  });

  it("falls back to products for unknown id", () => {
    expect(getProductCenterView("nonexistent").id).toBe("products");
  });

  it("falls back to products for null/undefined", () => {
    expect(getProductCenterView(null).id).toBe("products");
    expect(getProductCenterView(undefined).id).toBe("products");
  });
});

// ── P3: buildProductCenterHref URL generation ───────────────────────────────

describe("P3: buildProductCenterHref", () => {
  it("returns /admin/products for default", () => {
    expect(buildProductCenterHref()).toBe("/admin/products");
    expect(buildProductCenterHref("products")).toBe("/admin/products");
  });

  it("returns /admin/pricing for pricing view", () => {
    expect(buildProductCenterHref("pricing")).toBe("/admin/pricing");
  });

  it("returns /admin/materials for materials view", () => {
    expect(buildProductCenterHref("materials")).toBe("/admin/materials");
  });

  it("returns /admin/media for media view", () => {
    expect(buildProductCenterHref("media")).toBe("/admin/media");
  });

  it("returns /admin/coupons for coupons view", () => {
    expect(buildProductCenterHref("coupons")).toBe("/admin/coupons");
  });

  it("falls back to /admin/products for unknown view", () => {
    expect(buildProductCenterHref("nonexistent")).toBe("/admin/products");
  });

  it("all hrefs start with /admin/", () => {
    for (const view of PRODUCT_CENTER_VIEWS) {
      expect(buildProductCenterHref(view.id)).toMatch(/^\/admin\//);
    }
  });
});

// ── P4: Deep workspaces ─────────────────────────────────────────────────────

describe("P4: Product Center deep workspaces", () => {
  it("image-dashboard maps to media parent", () => {
    const deep = getProductCenterDeep("image-dashboard");
    expect(deep).not.toBeNull();
    expect(deep.parentView).toBe("media");
    expect(deep.href).toBe("/admin/image-dashboard");
  });

  it("returns null for unknown deep workspace", () => {
    expect(getProductCenterDeep("nonexistent")).toBeNull();
  });
});

// ── P5: Cross-system contract ───────────────────────────────────────────────

describe("P5: Product Center cross-system contract", () => {
  it("admin role can access all Product Center routes", () => {
    for (const view of PRODUCT_CENTER_VIEWS) {
      expect(canAccessAdminPage("admin", view.href)).toBe(true);
    }
  });

  it("merch_ops can access products, pricing, media, coupons", () => {
    expect(canAccessAdminPage("merch_ops", "/admin/products")).toBe(true);
    expect(canAccessAdminPage("merch_ops", "/admin/pricing")).toBe(true);
    expect(canAccessAdminPage("merch_ops", "/admin/media")).toBe(true);
    expect(canAccessAdminPage("merch_ops", "/admin/coupons")).toBe(true);
  });

  it("cs role cannot access product center routes", () => {
    expect(canAccessAdminPage("cs", "/admin/products")).toBe(false);
    expect(canAccessAdminPage("cs", "/admin/pricing")).toBe(false);
    expect(canAccessAdminPage("cs", "/admin/media")).toBe(false);
  });

  it("Product Center hub routes are registered in MODULE_NAV_MAP", () => {
    expect(MODULE_NAV_MAP.products).toContain("/admin/products");
    expect(MODULE_NAV_MAP.pricing).toContain("/admin/pricing");
    expect(MODULE_NAV_MAP.media).toContain("/admin/media");
    expect(MODULE_NAV_MAP.coupons).toContain("/admin/coupons");
  });

  it("productOps nav item href matches products view", () => {
    expect(ADMIN_NAV_ITEMS.productOps.href).toBe("/admin/catalog-ops");
  });

  it("pricingRules nav item href matches pricing view", () => {
    expect(ADMIN_NAV_ITEMS.pricingRules.href).toBe("/admin/pricing");
  });

  it("materials nav item href matches materials view", () => {
    expect(ADMIN_NAV_ITEMS.materials.href).toBe("/admin/materials");
  });

  it("media nav item href matches media view", () => {
    expect(ADMIN_NAV_ITEMS.media.href).toBe("/admin/media");
  });

  it("coupons nav item href matches coupons view", () => {
    expect(ADMIN_NAV_ITEMS.coupons.href).toBe("/admin/coupons");
  });
});
