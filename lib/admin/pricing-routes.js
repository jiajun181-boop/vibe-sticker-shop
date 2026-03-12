/**
 * Canonical pricing route helpers.
 *
 * Thin convenience wrappers around lib/pricing/focus.ts — the single
 * source of truth for all admin pricing URLs.
 *
 * Import these for ergonomic helpers (pricingCostsPath, pricingOpsPath, …).
 * Import focus.ts directly when you need exact-target fields like
 * itemId, alertType, approvalId, or resolve-and-return (returnTo/source).
 *
 * These wrappers exist so that 7+ UI components don't need to learn the
 * full PricingFocus interface for simple tab/section navigation.
 */

import { buildPricingUrl } from "@/lib/pricing/focus";

const BASE = "/admin/pricing";

/** Main pricing center, optionally with a tab. */
export function pricingCenterPath(tab) {
  if (!tab || tab === "products") return BASE;
  return buildPricingUrl({ tab });
}

/** Quick Quote for a specific product slug. */
export function pricingQuotePath(slug) {
  return buildPricingUrl({ tab: "quote", slug: slug || undefined });
}

/** Governance sub-section, optionally targeting a specific record + returnTo. */
export function pricingGovernancePath(section, targetId, returnTo) {
  if (!section) return buildPricingUrl({ tab: "governance" });

  const focus = { tab: "governance", section, returnTo: returnTo || undefined };

  // Map targetId to the correct exact-target field based on section
  if (targetId) {
    if (section === "approvals") focus.approvalId = targetId;
    else if (section === "vendor") focus.slug = targetId;
    else focus.slug = targetId; // generic fallback
  }

  return buildPricingUrl(focus);
}

/** Ops sub-section, optionally targeting a specific order/alert type + returnTo. */
export function pricingOpsPath(section, orderId, returnTo, alertType) {
  return buildPricingUrl({
    tab: "ops",
    section: section || undefined,
    orderId: orderId || undefined,
    alertType: alertType || undefined,
    returnTo: returnTo || undefined,
  });
}

/** Products tab (default landing). */
export function pricingProductsPath() {
  return BASE;
}

/** Dashboard tab. */
export function pricingDashboardPath() {
  return buildPricingUrl({ tab: "dashboard" });
}

/** Presets tab. */
export function pricingPresetsPath() {
  return buildPricingUrl({ tab: "presets" });
}

/** Costs tab, optionally targeting a specific order/item + returnTo. */
export function pricingCostsPath(orderId, returnTo, itemId) {
  return buildPricingUrl({
    tab: "costs",
    orderId: orderId || undefined,
    itemId: itemId || undefined,
    returnTo: returnTo || undefined,
  });
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
