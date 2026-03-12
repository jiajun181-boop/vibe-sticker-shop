/**
 * Regression tests for Customer Center helpers.
 *
 * Validates:
 *   C1: buildCustomerDetailHref — URL generation and encoding
 *   C2: buildCustomerCenterHref — workspace URL generation
 *   C3: CUSTOMER_CENTER_VIEWS — view model completeness
 */

import {
  buildCustomerDetailHref,
  buildCustomerCenterHref,
  getCustomerCenterView,
  CUSTOMER_CENTER_VIEWS,
} from "@/lib/admin-centers";

// ── C1: buildCustomerDetailHref ─────────────────────────────────────────────

describe("C1: buildCustomerDetailHref", () => {
  it("returns /admin/customers for null email", () => {
    expect(buildCustomerDetailHref(null)).toBe("/admin/customers");
  });

  it("returns /admin/customers for empty string", () => {
    expect(buildCustomerDetailHref("")).toBe("/admin/customers");
  });

  it("returns /admin/customers for undefined", () => {
    expect(buildCustomerDetailHref(undefined)).toBe("/admin/customers");
  });

  it("encodes a simple email", () => {
    const href = buildCustomerDetailHref("jay@lunarprint.ca");
    expect(href).toBe("/admin/customers/jay%40lunarprint.ca");
  });

  it("encodes an email with special characters", () => {
    const href = buildCustomerDetailHref("user+tag@example.com");
    expect(href).toBe("/admin/customers/user%2Btag%40example.com");
  });

  it("double-encodes are safe (already encoded input)", () => {
    // If someone passes an already-encoded email, it double-encodes but stays safe
    const href = buildCustomerDetailHref("jay%40lunarprint.ca");
    expect(href).toContain("/admin/customers/");
    expect(href).not.toBe("/admin/customers/");
  });

  it("returns a decodable path", () => {
    const email = "test@example.com";
    const href = buildCustomerDetailHref(email);
    const encoded = href.replace("/admin/customers/", "");
    expect(decodeURIComponent(encoded)).toBe(email);
  });
});

// ── C2: buildCustomerCenterHref ─────────────────────────────────────────────

describe("C2: buildCustomerCenterHref", () => {
  it("returns /admin/customers for default (customers) view", () => {
    expect(buildCustomerCenterHref()).toBe("/admin/customers");
    expect(buildCustomerCenterHref("customers")).toBe("/admin/customers");
  });

  it("returns ?view=messages for messages", () => {
    expect(buildCustomerCenterHref("messages")).toBe("/admin/customers?view=messages");
  });

  it("returns ?view=support for support", () => {
    expect(buildCustomerCenterHref("support")).toBe("/admin/customers?view=support");
  });

  it("returns ?view=b2b for b2b", () => {
    expect(buildCustomerCenterHref("b2b")).toBe("/admin/customers?view=b2b");
  });

  it("falls back to customers for unknown view", () => {
    expect(buildCustomerCenterHref("unknown")).toBe("/admin/customers");
  });

  it("applies overrides", () => {
    const href = buildCustomerCenterHref("support", { page: "2" });
    expect(href).toContain("view=support");
    expect(href).toContain("page=2");
  });
});

// ── C3: CUSTOMER_CENTER_VIEWS completeness ──────────────────────────────────

describe("C3: CUSTOMER_CENTER_VIEWS", () => {
  const viewIds = Object.keys(CUSTOMER_CENTER_VIEWS);

  it("contains all expected workspace views", () => {
    expect(viewIds).toContain("customers");
    expect(viewIds).toContain("messages");
    expect(viewIds).toContain("support");
    expect(viewIds).toContain("b2b");
  });

  it("each view has an id matching its key", () => {
    for (const [key, view] of Object.entries(CUSTOMER_CENTER_VIEWS)) {
      expect(view.id).toBe(key);
    }
  });

  it("each view has a labelKey", () => {
    for (const view of Object.values(CUSTOMER_CENTER_VIEWS)) {
      expect(view.labelKey).toBeTruthy();
      expect(typeof view.labelKey).toBe("string");
    }
  });

  it("getCustomerCenterView returns correct view", () => {
    expect(getCustomerCenterView("messages").id).toBe("messages");
    expect(getCustomerCenterView("support").id).toBe("support");
  });

  it("getCustomerCenterView falls back to customers", () => {
    expect(getCustomerCenterView("nonexistent").id).toBe("customers");
    expect(getCustomerCenterView(null).id).toBe("customers");
    expect(getCustomerCenterView(undefined).id).toBe("customers");
  });
});
