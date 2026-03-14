/**
 * Regression tests for admin center view models (admin-centers.js).
 *
 * Covers:
 *   Orders Center     — C1–C6 (existing)
 *   Customer Center   — CC1–CC5
 *   Product Center    — PC1–PC4
 *   Settings Center   — SC1–SC3
 *   Tools Center      — TC1–TC3
 */

import {
  ORDER_CENTER_VIEWS,
  buildOrderCenterHref,
  getOrderCenterView,
  CUSTOMER_CENTER_VIEWS,
  buildCustomerCenterHref,
  getCustomerCenterView,
  buildCustomerDetailHref,
  buildCustomerWorkspaceHref,
  PRODUCT_CENTER_VIEWS,
  buildProductCenterHref,
  getProductCenterView,
  getProductCenterDeep,
  SETTINGS_CENTER_VIEWS,
  buildSettingsCenterHref,
  getSettingsCenterView,
  TOOLS_CENTER_VIEWS,
  buildToolsCenterHref,
  getToolsCenterView,
} from "@/lib/admin-centers";

// ═══════════════════════════════════════════════════════════════════════════
// Orders Center
// ═══════════════════════════════════════════════════════════════════════════

// ── C1: View model completeness ─────────────────────────────────────────────

describe("C1: ORDER_CENTER_VIEWS completeness", () => {
  const REQUIRED_VIEWS = [
    "all",
    "pending",
    "missing_artwork",
    "in_production",
    "ready_to_ship",
    "shipped",
    "exceptions",
  ];

  it("contains all canonical lifecycle views", () => {
    for (const viewId of REQUIRED_VIEWS) {
      expect(ORDER_CENTER_VIEWS).toHaveProperty(viewId);
    }
  });

  it("every view has id, labelKey, params, and badgeColor", () => {
    for (const [key, view] of Object.entries(ORDER_CENTER_VIEWS)) {
      expect(view).toHaveProperty("id", key);
      expect(view).toHaveProperty("labelKey");
      expect(typeof (view as { labelKey: string }).labelKey).toBe("string");
      expect(view).toHaveProperty("params");
      expect(view).toHaveProperty("badgeColor");
    }
  });

  it("view ids match their object keys", () => {
    for (const [key, view] of Object.entries(ORDER_CENTER_VIEWS)) {
      expect((view as { id: string }).id).toBe(key);
    }
  });
});

// ── C2: buildOrderCenterHref URL generation ─────────────────────────────────

describe("C2: buildOrderCenterHref URL generation", () => {
  it("'all' view returns /admin/orders with no params", () => {
    expect(buildOrderCenterHref("all")).toBe("/admin/orders");
  });

  it("'pending' view includes view=pending and status=pending", () => {
    const href = buildOrderCenterHref("pending");
    expect(href).toContain("view=pending");
    expect(href).toContain("status=pending");
  });

  it("'missing_artwork' view includes artwork=missing and sort=priority", () => {
    const href = buildOrderCenterHref("missing_artwork");
    expect(href).toContain("view=missing_artwork");
    expect(href).toContain("artwork=missing");
    expect(href).toContain("sort=priority");
  });

  it("'in_production' view includes production=in_production", () => {
    const href = buildOrderCenterHref("in_production");
    expect(href).toContain("view=in_production");
    expect(href).toContain("production=in_production");
  });

  it("'ready_to_ship' view includes production=ready_to_ship", () => {
    const href = buildOrderCenterHref("ready_to_ship");
    expect(href).toContain("view=ready_to_ship");
    expect(href).toContain("production=ready_to_ship");
  });

  it("'shipped' view includes production=shipped", () => {
    const href = buildOrderCenterHref("shipped");
    expect(href).toContain("view=shipped");
    expect(href).toContain("production=shipped");
  });

  it("'exceptions' view includes production=on_hold", () => {
    const href = buildOrderCenterHref("exceptions");
    expect(href).toContain("view=exceptions");
    expect(href).toContain("production=on_hold");
  });

  it("all hrefs start with /admin/orders", () => {
    for (const viewId of Object.keys(ORDER_CENTER_VIEWS)) {
      expect(buildOrderCenterHref(viewId)).toMatch(/^\/admin\/orders/);
    }
  });
});

// ── C3: buildOrderCenterHref override merging ───────────────────────────────

describe("C3: buildOrderCenterHref overrides", () => {
  it("overrides add extra params", () => {
    const href = buildOrderCenterHref("all", { page: "2" });
    expect(href).toContain("page=2");
  });

  it("overrides can replace view-defined params", () => {
    const href = buildOrderCenterHref("pending", { status: "paid" });
    expect(href).toContain("status=paid");
    expect(href).not.toContain("status=pending");
  });

  it("null/empty overrides remove params", () => {
    const href = buildOrderCenterHref("missing_artwork", { artwork: null });
    expect(href).not.toContain("artwork=");
  });

  it("defaults to 'all' when called with no args", () => {
    expect(buildOrderCenterHref()).toBe("/admin/orders");
  });
});

// ── C4: getOrderCenterView fallback ─────────────────────────────────────────

describe("C4: getOrderCenterView fallback", () => {
  it("returns the correct view for known ids", () => {
    expect(getOrderCenterView("pending")).toHaveProperty("id", "pending");
    expect(getOrderCenterView("shipped")).toHaveProperty("id", "shipped");
    expect(getOrderCenterView("exceptions")).toHaveProperty("id", "exceptions");
  });

  it("falls back to 'all' for unknown view id", () => {
    expect(getOrderCenterView("nonexistent")).toHaveProperty("id", "all");
  });

  it("falls back to 'all' for null/undefined", () => {
    expect(getOrderCenterView(null)).toHaveProperty("id", "all");
    expect(getOrderCenterView(undefined)).toHaveProperty("id", "all");
  });
});

// ── C5: View ↔ URL roundtrip ────────────────────────────────────────────────

describe("C5: view ↔ URL roundtrip", () => {
  it("URL generated for each view contains its view= param (except all)", () => {
    for (const [key, view] of Object.entries(ORDER_CENTER_VIEWS)) {
      const href = buildOrderCenterHref(key);
      if (key === "all") {
        expect(href).toBe("/admin/orders");
      } else {
        const url = new URL(href, "http://localhost");
        expect(url.searchParams.get("view")).toBe((view as { id: string }).id);
      }
    }
  });

  it("view params are faithfully encoded in the URL", () => {
    for (const [key, view] of Object.entries(ORDER_CENTER_VIEWS)) {
      const href = buildOrderCenterHref(key);
      const url = new URL(href, "http://localhost");
      for (const [paramKey, paramValue] of Object.entries(
        (view as { params: Record<string, string> }).params || {}
      )) {
        expect(url.searchParams.get(paramKey)).toBe(String(paramValue));
      }
    }
  });
});

// ── C6: Shipped view — lifecycle completion ─────────────────────────────────

describe("C6: shipped view lifecycle", () => {
  it("shipped view exists and maps to production=shipped", () => {
    const shipped = ORDER_CENTER_VIEWS.shipped;
    expect(shipped).toBeDefined();
    expect(shipped.id).toBe("shipped");
    expect(shipped.params).toEqual({ production: "shipped" });
  });

  it("shipped view has a badge color", () => {
    expect(ORDER_CENTER_VIEWS.shipped.badgeColor).toBeTruthy();
  });

  it("lifecycle views cover the full production pipeline", () => {
    const productionViews = Object.values(ORDER_CENTER_VIEWS)
      .filter((v) => (v as { params: Record<string, string> }).params?.production)
      .map((v) => (v as { params: Record<string, string> }).params.production);

    expect(productionViews).toContain("in_production");
    expect(productionViews).toContain("ready_to_ship");
    expect(productionViews).toContain("shipped");
    expect(productionViews).toContain("on_hold");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Customer Center
// ═══════════════════════════════════════════════════════════════════════════

describe("CC1: CUSTOMER_CENTER_VIEWS completeness", () => {
  const REQUIRED = ["customers", "messages", "support", "b2b"];

  it("contains all canonical views", () => {
    for (const viewId of REQUIRED) {
      expect(CUSTOMER_CENTER_VIEWS).toHaveProperty(viewId);
    }
  });

  it("every view has id and labelKey", () => {
    for (const [key, view] of Object.entries(CUSTOMER_CENTER_VIEWS)) {
      expect(view).toHaveProperty("id", key);
      expect(typeof (view as { labelKey: string }).labelKey).toBe("string");
    }
  });
});

describe("CC2: getCustomerCenterView fallback", () => {
  it("returns the correct view for known ids", () => {
    expect(getCustomerCenterView("messages")).toHaveProperty("id", "messages");
    expect(getCustomerCenterView("b2b")).toHaveProperty("id", "b2b");
  });

  it("falls back to 'customers' for unknown/null", () => {
    expect(getCustomerCenterView("nonexistent")).toHaveProperty("id", "customers");
    expect(getCustomerCenterView(null)).toHaveProperty("id", "customers");
    expect(getCustomerCenterView(undefined)).toHaveProperty("id", "customers");
  });
});

describe("CC3: buildCustomerCenterHref URL generation", () => {
  it("'customers' view returns /admin/customers", () => {
    expect(buildCustomerCenterHref("customers")).toBe("/admin/customers");
    expect(buildCustomerCenterHref()).toBe("/admin/customers");
  });

  it("non-default views include view= param", () => {
    expect(buildCustomerCenterHref("messages")).toContain("view=messages");
    expect(buildCustomerCenterHref("b2b")).toContain("view=b2b");
    expect(buildCustomerCenterHref("support")).toContain("view=support");
  });

  it("overrides are merged", () => {
    const href = buildCustomerCenterHref("customers", { page: "3" });
    expect(href).toContain("page=3");
  });

  it("null overrides remove params", () => {
    const href = buildCustomerCenterHref("messages", { view: null });
    expect(href).not.toContain("view=");
  });
});

describe("CC4: buildCustomerDetailHref", () => {
  it("encodes email in the URL path", () => {
    expect(buildCustomerDetailHref("user@example.com")).toBe(
      "/admin/customers/user%40example.com"
    );
  });

  it("returns /admin/customers for falsy email", () => {
    expect(buildCustomerDetailHref("")).toBe("/admin/customers");
    expect(buildCustomerDetailHref(null)).toBe("/admin/customers");
    expect(buildCustomerDetailHref(undefined)).toBe("/admin/customers");
  });
});

describe("CC5: buildCustomerWorkspaceHref", () => {
  it("returns workspace route without email", () => {
    expect(buildCustomerWorkspaceHref("messages")).toBe("/admin/customers/messages");
    expect(buildCustomerWorkspaceHref("support")).toBe("/admin/customers/support");
    expect(buildCustomerWorkspaceHref("b2b")).toBe("/admin/customers/b2b");
  });

  it("appends email param when provided", () => {
    const href = buildCustomerWorkspaceHref("messages", "a@b.com");
    expect(href).toBe("/admin/customers/messages?email=a%40b.com");
  });

  it("falls back to /admin/customers for unknown workspace", () => {
    expect(buildCustomerWorkspaceHref("nonexistent" as any)).toBe("/admin/customers");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Product Center
// ═══════════════════════════════════════════════════════════════════════════

describe("PC1: PRODUCT_CENTER_VIEWS completeness", () => {
  const REQUIRED = ["products", "pricing", "materials", "media", "coupons"];

  it("contains all canonical views", () => {
    const ids = PRODUCT_CENTER_VIEWS.map((v: { id: string }) => v.id);
    for (const viewId of REQUIRED) {
      expect(ids).toContain(viewId);
    }
  });

  it("every view has id, labelKey, and href", () => {
    for (const view of PRODUCT_CENTER_VIEWS) {
      expect(view).toHaveProperty("id");
      expect(view).toHaveProperty("labelKey");
      expect(view).toHaveProperty("href");
      expect(typeof (view as { href: string }).href).toBe("string");
    }
  });

  it("all hrefs start with /admin/", () => {
    for (const view of PRODUCT_CENTER_VIEWS) {
      expect((view as { href: string }).href).toMatch(/^\/admin\//);
    }
  });
});

describe("PC2: getProductCenterView", () => {
  it("returns the correct view for known ids", () => {
    expect(getProductCenterView("pricing")).toHaveProperty("id", "pricing");
    expect(getProductCenterView("media")).toHaveProperty("id", "media");
  });

  it("falls back to first view (products) for unknown id", () => {
    expect(getProductCenterView("nonexistent")).toHaveProperty("id", "products");
  });
});

describe("PC3: buildProductCenterHref", () => {
  it("returns /admin/products for default/null/products", () => {
    expect(buildProductCenterHref()).toBe("/admin/products");
    expect(buildProductCenterHref(null)).toBe("/admin/products");
    expect(buildProductCenterHref("products")).toBe("/admin/products");
  });

  it("returns correct href for each view", () => {
    expect(buildProductCenterHref("pricing")).toBe("/admin/pricing");
    expect(buildProductCenterHref("materials")).toBe("/admin/materials");
    expect(buildProductCenterHref("media")).toBe("/admin/media");
    expect(buildProductCenterHref("coupons")).toBe("/admin/coupons");
  });
});

describe("PC4: getProductCenterDeep", () => {
  it("returns image-dashboard deep workspace", () => {
    const deep = getProductCenterDeep("image-dashboard");
    expect(deep).not.toBeNull();
    expect(deep.parentView).toBe("media");
    expect(deep.href).toBe("/admin/image-dashboard");
  });

  it("returns null for unknown deep workspace", () => {
    expect(getProductCenterDeep("nonexistent")).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Settings Center
// ═══════════════════════════════════════════════════════════════════════════

describe("SC1: SETTINGS_CENTER_VIEWS completeness", () => {
  const REQUIRED = [
    "system",
    "analytics_reports",
    "finance",
    "users_permissions",
    "api_keys",
    "logs",
    "factories",
  ];

  it("contains all canonical views", () => {
    for (const viewId of REQUIRED) {
      expect(SETTINGS_CENTER_VIEWS).toHaveProperty(viewId);
    }
  });

  it("every view has id, labelKey, route, and permModule", () => {
    for (const [key, view] of Object.entries(SETTINGS_CENTER_VIEWS)) {
      expect(view).toHaveProperty("id", key);
      expect(view).toHaveProperty("labelKey");
      expect(view).toHaveProperty("route");
      expect(view).toHaveProperty("permModule");
      expect(typeof (view as { route: string }).route).toBe("string");
    }
  });

  it("all routes start with /admin/", () => {
    for (const view of Object.values(SETTINGS_CENTER_VIEWS)) {
      expect((view as { route: string }).route).toMatch(/^\/admin\//);
    }
  });
});

describe("SC2: getSettingsCenterView", () => {
  it("returns the correct view for known ids", () => {
    expect(getSettingsCenterView("finance")).toHaveProperty("id", "finance");
    expect(getSettingsCenterView("logs")).toHaveProperty("id", "logs");
  });

  it("falls back to 'system' for unknown/null", () => {
    expect(getSettingsCenterView("nonexistent")).toHaveProperty("id", "system");
    expect(getSettingsCenterView(null)).toHaveProperty("id", "system");
    expect(getSettingsCenterView(undefined)).toHaveProperty("id", "system");
  });
});

describe("SC3: buildSettingsCenterHref", () => {
  it("returns /admin/settings for default/system", () => {
    expect(buildSettingsCenterHref()).toBe("/admin/settings");
    expect(buildSettingsCenterHref("system")).toBe("/admin/settings");
  });

  it("returns correct route for each view", () => {
    expect(buildSettingsCenterHref("analytics_reports")).toBe("/admin/analytics");
    expect(buildSettingsCenterHref("finance")).toBe("/admin/finance");
    expect(buildSettingsCenterHref("users_permissions")).toBe("/admin/users");
    expect(buildSettingsCenterHref("api_keys")).toBe("/admin/api-keys");
    expect(buildSettingsCenterHref("logs")).toBe("/admin/logs");
    expect(buildSettingsCenterHref("factories")).toBe("/admin/factories");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Tools Center
// ═══════════════════════════════════════════════════════════════════════════

describe("TC1: TOOLS_CENTER_VIEWS completeness", () => {
  const REQUIRED = ["hub", "contour", "proof", "stamp-studio", "unit-converter"];

  it("contains all canonical tool views", () => {
    const ids = TOOLS_CENTER_VIEWS.map((v: { id: string }) => v.id);
    for (const viewId of REQUIRED) {
      expect(ids).toContain(viewId);
    }
  });

  it("every view has id, labelKey, and href", () => {
    for (const view of TOOLS_CENTER_VIEWS) {
      expect(view).toHaveProperty("id");
      expect(view).toHaveProperty("labelKey");
      expect(view).toHaveProperty("href");
      expect(typeof (view as { href: string }).href).toBe("string");
    }
  });

  it("hub view points to /admin/tools", () => {
    const hub = TOOLS_CENTER_VIEWS.find((v: { id: string }) => v.id === "hub");
    expect(hub).toBeDefined();
    expect((hub as { href: string }).href).toBe("/admin/tools");
  });

  it("all non-hub hrefs are under /admin/tools/", () => {
    for (const view of TOOLS_CENTER_VIEWS) {
      const v = view as { id: string; href: string };
      if (v.id !== "hub") {
        expect(v.href).toMatch(/^\/admin\/tools\//);
      }
    }
  });
});

describe("TC2: getToolsCenterView", () => {
  it("returns the correct view for known ids", () => {
    expect(getToolsCenterView("contour")).toHaveProperty("id", "contour");
    expect(getToolsCenterView("proof")).toHaveProperty("id", "proof");
    expect(getToolsCenterView("stamp-studio")).toHaveProperty("id", "stamp-studio");
    expect(getToolsCenterView("unit-converter")).toHaveProperty("id", "unit-converter");
  });

  it("falls back to hub for unknown id", () => {
    expect(getToolsCenterView("nonexistent")).toHaveProperty("id", "hub");
  });
});

describe("TC3: buildToolsCenterHref", () => {
  it("returns /admin/tools for default/null/hub", () => {
    expect(buildToolsCenterHref()).toBe("/admin/tools");
    expect(buildToolsCenterHref(null)).toBe("/admin/tools");
    expect(buildToolsCenterHref("hub")).toBe("/admin/tools");
  });

  it("returns correct href for each tool view", () => {
    expect(buildToolsCenterHref("contour")).toBe("/admin/tools/contour");
    expect(buildToolsCenterHref("proof")).toBe("/admin/tools/proof");
    expect(buildToolsCenterHref("stamp-studio")).toBe("/admin/tools/stamp-studio");
    expect(buildToolsCenterHref("unit-converter")).toBe("/admin/tools/unit-converter");
  });
});
