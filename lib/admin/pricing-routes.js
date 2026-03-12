/**
 * Canonical pricing route helpers.
 *
 * Single source of truth for all admin pricing URLs.
 * Import these instead of hand-writing `/admin/pricing?tab=...` strings.
 */

const BASE = "/admin/pricing";

/** Main pricing center, optionally with a tab. */
export function pricingCenterPath(tab) {
  if (!tab || tab === "products") return BASE;
  return `${BASE}?tab=${encodeURIComponent(tab)}`;
}

/** Quick Quote for a specific product slug. */
export function pricingQuotePath(slug) {
  if (!slug) return `${BASE}?tab=quote`;
  return `${BASE}?tab=quote&slug=${encodeURIComponent(slug)}`;
}

/** Governance sub-section. */
export function pricingGovernancePath(section) {
  if (!section) return `${BASE}?tab=governance`;
  return `${BASE}?tab=governance&section=${encodeURIComponent(section)}`;
}

/** Ops sub-section. */
export function pricingOpsPath(section) {
  if (!section) return `${BASE}?tab=ops`;
  return `${BASE}?tab=ops&section=${encodeURIComponent(section)}`;
}

/** Products tab (default landing). */
export function pricingProductsPath() {
  return BASE;
}

/** Dashboard tab. */
export function pricingDashboardPath() {
  return `${BASE}?tab=dashboard`;
}

/** Presets tab. */
export function pricingPresetsPath() {
  return `${BASE}?tab=presets`;
}

/** Costs tab. */
export function pricingCostsPath() {
  return `${BASE}?tab=costs`;
}

/**
 * Map of legacy pricing-dashboard routes to their canonical targets.
 * Used by redirect pages and for reference.
 */
export const LEGACY_REDIRECT_MAP = {
  "/admin/pricing-dashboard": BASE,
  "/admin/pricing-dashboard/governance": pricingGovernancePath(),
  "/admin/pricing-dashboard/approvals": pricingGovernancePath("approvals"),
  "/admin/pricing-dashboard/b2b-rules": pricingGovernancePath("b2b"),
  "/admin/pricing-dashboard/change-log": pricingGovernancePath("changelog"),
  "/admin/pricing-dashboard/log": pricingGovernancePath("changelog"),
  "/admin/pricing-dashboard/ops": pricingOpsPath("reminders"),
  "/admin/pricing-dashboard/profit-alerts": pricingOpsPath("alerts"),
  "/admin/pricing-dashboard/snapshots": pricingGovernancePath("snapshots"),
  "/admin/pricing-dashboard/vendor-costs": pricingGovernancePath("vendor"),
  "/admin/pricing-dashboard/remediation": pricingOpsPath("reminders"),
};

/**
 * Convert a legacy /admin/pricing-dashboard/[slug] path to canonical quote path.
 */
export function legacySlugToQuotePath(slug) {
  return pricingQuotePath(slug);
}
