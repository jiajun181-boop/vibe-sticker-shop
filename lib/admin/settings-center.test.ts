/**
 * Regression tests for Settings Center helpers.
 *
 * Validates:
 *   S1: SETTINGS_CENTER_VIEWS — view model completeness
 *   S2: getSettingsCenterView — lookup with fallback
 *   S3: buildSettingsCenterHref — canonical URL generation
 *   S4: Finance/analytics RBAC alignment — finance is a distinct module
 *   S5: Cross-system contract consistency — all views agree across 4 systems
 */

import {
  SETTINGS_CENTER_VIEWS,
  getSettingsCenterView,
  buildSettingsCenterHref,
} from "@/lib/admin-centers";

import {
  PERMISSION_MATRIX,
  hasPermission,
  canAccessAdminPage,
  MODULE_NAV_MAP,
  getAllowedNavHrefs,
} from "@/lib/admin-permissions";

import { ADMIN_NAV_ITEMS } from "@/lib/admin-navigation";

// ── S1: SETTINGS_CENTER_VIEWS completeness ──────────────────────────────────

describe("S1: SETTINGS_CENTER_VIEWS", () => {
  const viewIds = Object.keys(SETTINGS_CENTER_VIEWS);

  it("contains all expected settings views", () => {
    expect(viewIds).toContain("system");
    expect(viewIds).toContain("analytics_reports");
    expect(viewIds).toContain("finance");
    expect(viewIds).toContain("users_permissions");
    expect(viewIds).toContain("api_keys");
    expect(viewIds).toContain("logs");
    expect(viewIds).toContain("factories");
  });

  it("has exactly 7 views", () => {
    expect(viewIds).toHaveLength(7);
  });

  it("each view has an id matching its key", () => {
    for (const [key, view] of Object.entries(SETTINGS_CENTER_VIEWS)) {
      expect(view.id).toBe(key);
    }
  });

  it("each view has a labelKey", () => {
    for (const view of Object.values(SETTINGS_CENTER_VIEWS)) {
      expect(view.labelKey).toBeTruthy();
      expect(typeof view.labelKey).toBe("string");
    }
  });

  it("each view has a route starting with /admin/", () => {
    for (const view of Object.values(SETTINGS_CENTER_VIEWS)) {
      expect(view.route).toMatch(/^\/admin\//);
    }
  });

  it("each view has a permModule", () => {
    for (const view of Object.values(SETTINGS_CENTER_VIEWS)) {
      expect(view.permModule).toBeTruthy();
      expect(typeof view.permModule).toBe("string");
    }
  });
});

// ── S2: getSettingsCenterView ────────────────────────────────────────────────

describe("S2: getSettingsCenterView", () => {
  it("returns correct view for valid id", () => {
    expect(getSettingsCenterView("system").id).toBe("system");
    expect(getSettingsCenterView("analytics_reports").id).toBe("analytics_reports");
    expect(getSettingsCenterView("finance").id).toBe("finance");
    expect(getSettingsCenterView("users_permissions").id).toBe("users_permissions");
    expect(getSettingsCenterView("api_keys").id).toBe("api_keys");
    expect(getSettingsCenterView("logs").id).toBe("logs");
    expect(getSettingsCenterView("factories").id).toBe("factories");
  });

  it("falls back to system for unknown id", () => {
    expect(getSettingsCenterView("nonexistent").id).toBe("system");
  });

  it("falls back to system for null", () => {
    expect(getSettingsCenterView(null).id).toBe("system");
  });

  it("falls back to system for undefined", () => {
    expect(getSettingsCenterView(undefined).id).toBe("system");
  });
});

// ── S3: buildSettingsCenterHref ──────────────────────────────────────────────

describe("S3: buildSettingsCenterHref", () => {
  it("returns /admin/settings for default (system)", () => {
    expect(buildSettingsCenterHref()).toBe("/admin/settings");
    expect(buildSettingsCenterHref("system")).toBe("/admin/settings");
  });

  it("returns /admin/analytics for analytics_reports", () => {
    expect(buildSettingsCenterHref("analytics_reports")).toBe("/admin/analytics");
  });

  it("returns /admin/finance for finance", () => {
    expect(buildSettingsCenterHref("finance")).toBe("/admin/finance");
  });

  it("returns /admin/users for users_permissions", () => {
    expect(buildSettingsCenterHref("users_permissions")).toBe("/admin/users");
  });

  it("returns /admin/api-keys for api_keys", () => {
    expect(buildSettingsCenterHref("api_keys")).toBe("/admin/api-keys");
  });

  it("returns /admin/logs for logs", () => {
    expect(buildSettingsCenterHref("logs")).toBe("/admin/logs");
  });

  it("returns /admin/factories for factories", () => {
    expect(buildSettingsCenterHref("factories")).toBe("/admin/factories");
  });

  it("falls back to /admin/settings for unknown view", () => {
    expect(buildSettingsCenterHref("nonexistent")).toBe("/admin/settings");
  });
});

// ── S4: Finance / analytics RBAC alignment ──────────────────────────────────

describe("S4: finance is a distinct permission module", () => {
  it("PERMISSION_MATRIX has finance as a separate module on admin role", () => {
    expect(PERMISSION_MATRIX.admin.finance).toBe("admin");
    expect(PERMISSION_MATRIX.admin.analytics).toBe("admin");
  });

  it("finance role has finance:edit (not just analytics:view)", () => {
    expect(PERMISSION_MATRIX.finance.finance).toBe("edit");
    expect(hasPermission("finance", "finance", "edit")).toBe(true);
  });

  it("finance role retains analytics:view separately", () => {
    expect(PERMISSION_MATRIX.finance.analytics).toBe("view");
    expect(hasPermission("finance", "analytics", "view")).toBe(true);
  });

  it("sales role can view finance", () => {
    expect(hasPermission("sales", "finance", "view")).toBe(true);
  });

  it("roles without finance module are denied", () => {
    expect(hasPermission("cs", "finance", "view")).toBe(false);
    expect(hasPermission("design", "finance", "view")).toBe(false);
    expect(hasPermission("qa", "finance", "view")).toBe(false);
  });

  it("canAccessAdminPage routes /admin/finance through finance module", () => {
    expect(canAccessAdminPage("finance", "/admin/finance")).toBe(true);
    expect(canAccessAdminPage("sales", "/admin/finance")).toBe(true);
    expect(canAccessAdminPage("cs", "/admin/finance")).toBe(false);
  });

  it("canAccessAdminPage routes /admin/analytics through analytics module", () => {
    expect(canAccessAdminPage("finance", "/admin/analytics")).toBe(true);
    expect(canAccessAdminPage("merch_ops", "/admin/analytics")).toBe(true);
    expect(canAccessAdminPage("cs", "/admin/analytics")).toBe(false);
  });

  it("MODULE_NAV_MAP has finance as its own entry, not under analytics", () => {
    expect(MODULE_NAV_MAP.finance).toContain("/admin/finance");
    expect(MODULE_NAV_MAP.analytics).not.toContain("/admin/finance");
  });

  it("SETTINGS_CENTER_VIEWS finance.permModule is finance, not analytics", () => {
    expect(SETTINGS_CENTER_VIEWS.finance.permModule).toBe("finance");
    expect(SETTINGS_CENTER_VIEWS.analytics_reports.permModule).toBe("analytics");
  });
});

// ── S5: Cross-system contract consistency ───────────────────────────────────
//
// Each Settings Center view must agree across 4 systems:
//   1. SETTINGS_CENTER_VIEWS — view model (permModule, route)
//   2. PERMISSION_MATRIX — admin role has every permModule
//   3. MODULE_NAV_MAP — view route listed under its permModule
//   4. PAGE_ACCESS_RULES (via canAccessAdminPage) — route resolves to permModule
//
// Each view uses its own distinct permModule (not all under "settings").
// This is an explicit design: Settings Center is a navigation grouping,
// while permission control remains per-module.

describe("S5: Settings Center cross-system contract", () => {
  const views = Object.values(SETTINGS_CENTER_VIEWS);

  it("every view's permModule exists in admin PERMISSION_MATRIX", () => {
    for (const view of views) {
      expect(PERMISSION_MATRIX.admin).toHaveProperty(view.permModule);
    }
  });

  it("every view's route is listed under its permModule in MODULE_NAV_MAP", () => {
    for (const view of views) {
      const navPaths = MODULE_NAV_MAP[view.permModule];
      expect(navPaths).toBeDefined();
      expect(navPaths).toContain(view.route);
    }
  });

  it("every view's route resolves through its permModule in PAGE_ACCESS_RULES", () => {
    // Test with a role that has only the target permModule:
    // canAccessAdminPage checks PAGE_ACCESS_RULES → hasPermission(role, module)
    // A role with the permModule should access it; one without should not.
    const viewRoleMatrix: Array<{ viewId: string; allowedRole: string; deniedRole: string }> = [
      { viewId: "system", allowedRole: "finance", deniedRole: "qa" },
      { viewId: "analytics_reports", allowedRole: "merch_ops", deniedRole: "design" },
      { viewId: "finance", allowedRole: "finance", deniedRole: "cs" },
      { viewId: "users_permissions", allowedRole: "admin", deniedRole: "cs" },
      { viewId: "api_keys", allowedRole: "admin", deniedRole: "cs" },
      { viewId: "logs", allowedRole: "cs", deniedRole: "design" },
      { viewId: "factories", allowedRole: "production", deniedRole: "cs" },
    ];

    for (const { viewId, allowedRole, deniedRole } of viewRoleMatrix) {
      const view = SETTINGS_CENTER_VIEWS[viewId];
      expect(canAccessAdminPage(allowedRole, view.route)).toBe(true);
      expect(canAccessAdminPage(deniedRole, view.route)).toBe(false);
    }
  });

  it("every view has a corresponding nav item whose href matches the view route", () => {
    // Map from Settings Center view ID → nav item ID
    const viewToNavItem: Record<string, string> = {
      system: "settings",
      analytics_reports: "analyticsReports",
      finance: "finance",
      users_permissions: "users",
      api_keys: "apiKeys",
      logs: "activityLog",
      factories: "factories",
    };

    for (const [viewId, navItemId] of Object.entries(viewToNavItem)) {
      const view = SETTINGS_CENTER_VIEWS[viewId];
      const navItem = ADMIN_NAV_ITEMS[navItemId];
      expect(navItem).toBeDefined();
      expect(navItem.href).toBe(view.route);
    }
  });

  it("getAllowedNavHrefs includes Settings view routes for roles with the permModule", () => {
    // finance role should see /admin/finance (finance module) AND /admin/analytics (analytics module)
    const financeHrefs = getAllowedNavHrefs("finance");
    expect(financeHrefs.has("/admin/finance")).toBe(true);
    expect(financeHrefs.has("/admin/analytics")).toBe(true);
    expect(financeHrefs.has("/admin/settings")).toBe(true);
    expect(financeHrefs.has("/admin/logs")).toBe(true);
    // finance role should NOT see users/apiKeys/factories
    expect(financeHrefs.has("/admin/users")).toBe(false);
    expect(financeHrefs.has("/admin/api-keys")).toBe(false);
    expect(financeHrefs.has("/admin/factories")).toBe(false);
  });

  // ── Specific view deep-checks (analytics_reports + logs) ──────────────

  it("analytics_reports: full end-to-end alignment", () => {
    const view = SETTINGS_CENTER_VIEWS.analytics_reports;
    // View model
    expect(view.permModule).toBe("analytics");
    expect(view.route).toBe("/admin/analytics");
    // RBAC
    expect(hasPermission("merch_ops", "analytics", "view")).toBe(true);
    expect(hasPermission("sales", "analytics", "view")).toBe(true);
    expect(hasPermission("design", "analytics", "view")).toBe(false);
    // Route access
    expect(canAccessAdminPage("merch_ops", "/admin/analytics")).toBe(true);
    expect(canAccessAdminPage("design", "/admin/analytics")).toBe(false);
    // Nav map
    expect(MODULE_NAV_MAP.analytics).toContain("/admin/analytics");
    // Nav item
    expect(ADMIN_NAV_ITEMS.analyticsReports.href).toBe("/admin/analytics");
  });

  it("logs: full end-to-end alignment", () => {
    const view = SETTINGS_CENTER_VIEWS.logs;
    // View model
    expect(view.permModule).toBe("logs");
    expect(view.route).toBe("/admin/logs");
    // RBAC
    expect(hasPermission("cs", "logs", "view")).toBe(true);
    expect(hasPermission("finance", "logs", "view")).toBe(true);
    expect(hasPermission("design", "logs", "view")).toBe(false);
    // Route access
    expect(canAccessAdminPage("cs", "/admin/logs")).toBe(true);
    expect(canAccessAdminPage("design", "/admin/logs")).toBe(false);
    // Nav map
    expect(MODULE_NAV_MAP.logs).toContain("/admin/logs");
    // Nav item
    expect(ADMIN_NAV_ITEMS.activityLog.href).toBe("/admin/logs");
  });
});
