/**
 * lib/pricing/focus.ts
 *
 * Canonical pricing focus contract.
 * One shared interface for exact-target pricing navigation.
 *
 * Used by:
 * - ops-action.ts (URL generation)
 * - pricing APIs (query param parsing)
 * - pricing UI surfaces (reading focus from URL)
 * - operator surfaces (generating "fix this" links)
 *
 * The focus contract answers: "What exact pricing record should the
 * operator be looking at, and where should they return after fixing it?"
 */

// ── Pricing tabs ─────────────────────────────────────────────────

export type PricingTab = "costs" | "ops" | "governance" | "products";

export type GovernanceSection = "vendor" | "approvals" | "changelog";

// ── Focus interface ──────────────────────────────────────────────

export interface PricingFocus {
  /** Which pricing tab to show */
  tab?: PricingTab;
  /** Governance sub-section */
  section?: GovernanceSection | string;
  /** Target a specific order */
  orderId?: string;
  /** Target a specific order item (used with orderId for cost entry) */
  itemId?: string;
  /** Target a specific product by slug */
  slug?: string;
  /** Target a specific approval */
  approvalId?: string;
  /** Filter to a specific alert type */
  alertType?: string;
  /** Where to navigate after resolving the issue */
  returnTo?: string;
  /** Source surface that sent the operator here (for analytics/context) */
  source?: string;
}

// ── Serialize: focus → URL ───────────────────────────────────────

const PRICING_BASE = "/admin/pricing";

/**
 * Build a canonical pricing center URL from a focus object.
 * Only includes params that are set — no empty strings or undefined values.
 */
export function buildPricingUrl(focus: PricingFocus): string {
  const params = new URLSearchParams();

  if (focus.tab) params.set("tab", focus.tab);
  if (focus.section) params.set("section", focus.section);
  if (focus.orderId) params.set("orderId", focus.orderId);
  if (focus.itemId) params.set("itemId", focus.itemId);
  if (focus.slug) params.set("slug", focus.slug);
  if (focus.approvalId) params.set("approvalId", focus.approvalId);
  if (focus.alertType) params.set("alertType", focus.alertType);
  if (focus.returnTo) params.set("returnTo", focus.returnTo);
  if (focus.source) params.set("source", focus.source);

  const qs = params.toString();
  return qs ? `${PRICING_BASE}?${qs}` : PRICING_BASE;
}

// ── Deserialize: URL search params → focus ───────────────────────

/**
 * Parse a PricingFocus from URL search params.
 * Works with both URLSearchParams and plain string query strings.
 */
export function parsePricingFocus(
  input: URLSearchParams | string | Record<string, string | undefined>
): PricingFocus {
  let get: (key: string) => string | null;

  if (input instanceof URLSearchParams) {
    get = (k) => input.get(k);
  } else if (typeof input === "string") {
    const params = new URLSearchParams(input);
    get = (k) => params.get(k);
  } else {
    get = (k) => input[k] ?? null;
  }

  return {
    tab: (get("tab") as PricingTab) || undefined,
    section: get("section") || undefined,
    orderId: get("orderId") || undefined,
    itemId: get("itemId") || undefined,
    slug: get("slug") || undefined,
    approvalId: get("approvalId") || undefined,
    alertType: get("alertType") || undefined,
    returnTo: get("returnTo") || undefined,
    source: get("source") || undefined,
  };
}

// ── Focus-aware URL for non-pricing targets ──────────────────────

/**
 * Build an order detail URL, optionally with returnTo and source for resolve-and-return.
 */
export function buildOrderUrl(orderId: string, returnTo?: string, source?: string): string {
  const base = `/admin/orders/${orderId}`;
  const params = new URLSearchParams();
  if (returnTo) params.set("returnTo", returnTo);
  if (source) params.set("source", source);
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}

// ── Convenience: check if focus has an exact target ──────────────

/**
 * Returns true if the focus identifies a specific record (not just a tab).
 */
export function hasExactTarget(focus: PricingFocus): boolean {
  return !!(focus.orderId || focus.itemId || focus.slug || focus.approvalId);
}
