/**
 * Regression tests for Tools Center view model (admin-centers.js).
 *
 * Validates:
 *   T1: TOOLS_CENTER_VIEWS completeness — all tool views present with required fields
 *   T2: getToolsCenterView — lookup with fallback
 *   T3: buildToolsCenterHref — URL generation for each view
 *   T4: Cross-system contract — views align with RBAC, navigation, and page access rules
 */

import {
  TOOLS_CENTER_VIEWS,
  getToolsCenterView,
  buildToolsCenterHref,
} from "@/lib/admin-centers";

import { ADMIN_NAV_ITEMS } from "@/lib/admin-navigation";

import {
  PERMISSION_MATRIX,
  hasPermission,
  canAccessAdminPage,
  MODULE_NAV_MAP,
  getAllowedNavHrefs,
} from "@/lib/admin-permissions";

// ── T1: TOOLS_CENTER_VIEWS completeness ─────────────────────────────────────

describe("T1: TOOLS_CENTER_VIEWS", () => {
  const REQUIRED_VIEW_IDS = ["hub", "contour", "proof", "stamp-studio", "unit-converter"];

  it("contains all expected tool views", () => {
    const ids = TOOLS_CENTER_VIEWS.map((v: { id: string }) => v.id);
    for (const id of REQUIRED_VIEW_IDS) {
      expect(ids).toContain(id);
    }
  });

  it("has exactly 5 views", () => {
    expect(TOOLS_CENTER_VIEWS).toHaveLength(5);
  });

  it("every view has id, labelKey, and href", () => {
    for (const view of TOOLS_CENTER_VIEWS) {
      expect(view).toHaveProperty("id");
      expect(view).toHaveProperty("labelKey");
      expect(view).toHaveProperty("href");
      expect(typeof view.labelKey).toBe("string");
      expect(view.href).toMatch(/^\/admin\/tools/);
    }
  });

  it("hub view points to /admin/tools", () => {
    const hub = TOOLS_CENTER_VIEWS.find((v: { id: string }) => v.id === "hub");
    expect(hub).toBeDefined();
    expect(hub!.href).toBe("/admin/tools");
  });
});

// ── T2: getToolsCenterView lookup ───────────────────────────────────────────

describe("T2: getToolsCenterView", () => {
  it("returns correct view for valid id", () => {
    expect(getToolsCenterView("hub").id).toBe("hub");
    expect(getToolsCenterView("contour").id).toBe("contour");
    expect(getToolsCenterView("proof").id).toBe("proof");
    expect(getToolsCenterView("stamp-studio").id).toBe("stamp-studio");
    expect(getToolsCenterView("unit-converter").id).toBe("unit-converter");
  });

  it("falls back to hub for unknown id", () => {
    expect(getToolsCenterView("nonexistent").id).toBe("hub");
  });

  it("falls back to hub for null/undefined", () => {
    expect(getToolsCenterView(null).id).toBe("hub");
    expect(getToolsCenterView(undefined).id).toBe("hub");
  });
});

// ── T3: buildToolsCenterHref URL generation ─────────────────────────────────

describe("T3: buildToolsCenterHref", () => {
  it("returns /admin/tools for default (hub)", () => {
    expect(buildToolsCenterHref()).toBe("/admin/tools");
    expect(buildToolsCenterHref("hub")).toBe("/admin/tools");
  });

  it("returns /admin/tools/contour for contour view", () => {
    expect(buildToolsCenterHref("contour")).toBe("/admin/tools/contour");
  });

  it("returns /admin/tools/proof for proof view", () => {
    expect(buildToolsCenterHref("proof")).toBe("/admin/tools/proof");
  });

  it("returns /admin/tools/stamp-studio for stamp-studio view", () => {
    expect(buildToolsCenterHref("stamp-studio")).toBe("/admin/tools/stamp-studio");
  });

  it("returns /admin/tools/unit-converter for unit-converter view", () => {
    expect(buildToolsCenterHref("unit-converter")).toBe("/admin/tools/unit-converter");
  });

  it("falls back to /admin/tools for unknown view", () => {
    expect(buildToolsCenterHref("nonexistent")).toBe("/admin/tools");
  });

  it("all hrefs start with /admin/tools", () => {
    for (const view of TOOLS_CENTER_VIEWS) {
      expect(buildToolsCenterHref(view.id)).toMatch(/^\/admin\/tools/);
    }
  });
});

// ── T4: Cross-system contract ───────────────────────────────────────────────

describe("T4: Tools Center cross-system contract", () => {
  it("PERMISSION_MATRIX has tools as a module", () => {
    expect(PERMISSION_MATRIX.admin.tools).toBe("admin");
  });

  it("admin role can access all Tools Center routes", () => {
    for (const view of TOOLS_CENTER_VIEWS) {
      expect(canAccessAdminPage("admin", view.href)).toBe(true);
    }
  });

  it("design and merch_ops roles can access tools (edit level)", () => {
    expect(hasPermission("design", "tools", "edit")).toBe(true);
    expect(hasPermission("merch_ops", "tools", "edit")).toBe(true);
  });

  it("production role can view tools", () => {
    expect(hasPermission("production", "tools", "view")).toBe(true);
  });

  it("cs role cannot access tools", () => {
    expect(hasPermission("cs", "tools", "view")).toBe(false);
    expect(canAccessAdminPage("cs", "/admin/tools")).toBe(false);
  });

  it("finance role cannot access tools", () => {
    expect(hasPermission("finance", "tools", "view")).toBe(false);
    expect(canAccessAdminPage("finance", "/admin/tools")).toBe(false);
  });

  it("MODULE_NAV_MAP.tools contains all tool routes", () => {
    const toolPaths = MODULE_NAV_MAP.tools;
    expect(toolPaths).toContain("/admin/tools");
    expect(toolPaths).toContain("/admin/tools/contour");
    expect(toolPaths).toContain("/admin/tools/proof");
    expect(toolPaths).toContain("/admin/tools/stamp-studio");
    expect(toolPaths).toContain("/admin/tools/unit-converter");
  });

  it("toolsHub nav item exists with correct href", () => {
    expect(ADMIN_NAV_ITEMS.toolsHub).toBeDefined();
    expect(ADMIN_NAV_ITEMS.toolsHub.href).toBe("/admin/tools");
  });

  it("individual tool nav items exist with correct hrefs", () => {
    expect(ADMIN_NAV_ITEMS.contour.href).toBe("/admin/tools/contour");
    expect(ADMIN_NAV_ITEMS.proof.href).toBe("/admin/tools/proof");
    expect(ADMIN_NAV_ITEMS.stampStudio.href).toBe("/admin/tools/stamp-studio");
  });

  it("getAllowedNavHrefs includes tools for design role", () => {
    const designHrefs = getAllowedNavHrefs("design");
    expect(designHrefs.has("/admin/tools")).toBe(true);
    expect(designHrefs.has("/admin/tools/contour")).toBe(true);
    expect(designHrefs.has("/admin/tools/proof")).toBe(true);
    expect(designHrefs.has("/admin/tools/stamp-studio")).toBe(true);
  });

  it("getAllowedNavHrefs excludes tools for cs role", () => {
    const csHrefs = getAllowedNavHrefs("cs");
    expect(csHrefs.has("/admin/tools")).toBe(false);
    expect(csHrefs.has("/admin/tools/contour")).toBe(false);
  });
});
