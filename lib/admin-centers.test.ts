/**
 * Regression tests for Orders Center view model (admin-centers.js).
 *
 * Validates:
 *   C1: ORDER_CENTER_VIEWS completeness — all canonical views present with required fields
 *   C2: buildOrderCenterHref — URL generation for each view
 *   C3: buildOrderCenterHref — override merging
 *   C4: getOrderCenterView — fallback to "all" for unknown values
 *   C5: View ↔ URL roundtrip — URL params match view definition
 *   C6: shipped view — lifecycle completion
 */

import {
  ORDER_CENTER_VIEWS,
  buildOrderCenterHref,
  getOrderCenterView,
} from "@/lib/admin-centers";

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
