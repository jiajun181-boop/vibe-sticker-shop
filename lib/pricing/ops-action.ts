/**
 * lib/pricing/ops-action.ts
 *
 * Shared action vocabulary for pricing ops surfaces.
 * Maps pricing issues to machine-readable action hints so the UI
 * can route operators to the exact next step without guessing.
 *
 * Used by: cost-completeness, profit-alerts, ops-reminders, CostEntryPanel, OpsPanel.
 */

// ── Action types ─────────────────────────────────────────────────

export type OpsActionType =
  | "enter_actual_cost"       // Go to cost entry panel → update item actual cost
  | "enter_vendor_cost"       // Go to vendor costs → add vendor cost for product
  | "review_pricing"          // Go to pricing center → review product pricing
  | "review_approval"         // Go to governance → approve/reject pending change
  | "update_display_price"    // Go to product → set displayFromPrice
  | "update_floor_policy"     // Go to product → set floor pricing policy
  | "verify_vendor_cost"      // Go to vendor costs → re-verify stale cost
  | "review_order"            // Go to order detail → review profit/margin
  | "review_changelog"        // Go to governance changelog → review high-drift changes
  ;

export type OpsEntityType = "order" | "orderItem" | "product" | "approval" | "material" | "hardware";

/**
 * Structured context for action routing.
 * Callers pass whichever fields they have — the action builder uses them
 * to produce a precise URL and structured entity references.
 */
export interface OpsActionContext {
  orderId?: string;
  orderItemId?: string;
  productSlug?: string;
  approvalId?: string;
  section?: string;
  /** Where the operator should return after resolving the issue */
  returnTo?: string;
  /** Which surface sent the operator (e.g., "production", "workstation", "order-detail") */
  source?: string;
}

export interface OpsActionHint {
  /** Machine-readable action identifier */
  action: OpsActionType;
  /** The tab/section this action routes to */
  target: "costs" | "ops" | "governance" | "products" | "order";
  /** @deprecated Use structured fields (orderId, orderItemId, productSlug) instead */
  entityId?: string;
  /** What kind of entity this action targets */
  entityType?: OpsEntityType;
  /** Order ID when the action targets an order or order item */
  orderId?: string;
  /** Order item ID when the action targets a specific line item */
  orderItemId?: string;
  /** Product slug when the action targets a product */
  productSlug?: string;
  /** Approval ID when the action targets a pending approval */
  approvalId?: string;
  /** Human-readable summary (for tooltip/aria, not primary display) */
  summary: string;
  /** Pre-computed canonical URL — the exact place the operator should navigate */
  url: string;
}

// Re-export focus contract for consumers that import from ops-action
export { buildPricingUrl, buildOrderUrl, parsePricingFocus, hasExactTarget } from "./focus";
import { buildPricingUrl, buildOrderUrl, type PricingFocus, type PricingTab } from "./focus";

// ── Internal: normalize context ──────────────────────────────────

function normalizeContext(ctx?: string | OpsActionContext): OpsActionContext {
  if (!ctx) return {};
  if (typeof ctx === "string") return { orderId: ctx };
  return ctx;
}

// ── Canonical URL builder (delegates to focus contract) ──────────

function buildUrl(
  target: OpsActionHint["target"],
  ctx: OpsActionContext
): string {
  // "order" target routes to order detail, not pricing center
  if (target === "order") {
    return ctx.orderId ? buildOrderUrl(ctx.orderId, ctx.returnTo, ctx.source) : "/admin/orders";
  }

  // All pricing-center targets use the focus contract
  const focus: PricingFocus = {
    tab: target as PricingTab,
    section: ctx.section,
    orderId: ctx.orderId,
    itemId: ctx.orderItemId,
    slug: ctx.productSlug,
    approvalId: ctx.approvalId,
    returnTo: ctx.returnTo,
    source: ctx.source,
  };

  // "ops" target has a fixed section
  if (target === "ops") {
    focus.section = "alerts";
  }

  return buildPricingUrl(focus);
}

// ── Mapping: alert type → action hint ────────────────────────────

/**
 * Given a profit alert type, return the recommended operator action.
 * Accepts either a legacy entityId string or structured OpsActionContext.
 */
export function alertTypeToAction(
  alertType: string,
  context?: string | OpsActionContext
): OpsActionHint {
  const ctx = normalizeContext(context);

  switch (alertType) {
    case "missing_actual_cost": {
      const target = "costs" as const;
      return {
        action: "enter_actual_cost",
        target,
        entityId: ctx.orderItemId || ctx.orderId,
        entityType: ctx.orderItemId ? "orderItem" : ctx.orderId ? "order" : undefined,
        orderId: ctx.orderId,
        orderItemId: ctx.orderItemId,
        productSlug: ctx.productSlug,
        summary: "Enter actual production cost for this item",
        url: buildUrl(target, ctx),
      };
    }
    case "missing_vendor_cost": {
      const target = "governance" as const;
      const govCtx = { ...ctx, section: "vendor" };
      return {
        action: "enter_vendor_cost",
        target,
        entityId: ctx.productSlug || ctx.orderId,
        entityType: ctx.productSlug ? "product" : undefined,
        orderId: ctx.orderId,
        productSlug: ctx.productSlug,
        summary: "Add vendor cost data for this product",
        url: buildUrl(target, govCtx),
      };
    }
    case "negative_margin":
    case "cost_exceeds_revenue": {
      const target = ctx.productSlug ? "products" as const : "order" as const;
      return {
        action: "review_pricing",
        target,
        entityId: ctx.productSlug || ctx.orderId,
        entityType: ctx.productSlug ? "product" : ctx.orderId ? "order" : undefined,
        orderId: ctx.orderId,
        orderItemId: ctx.orderItemId,
        productSlug: ctx.productSlug,
        summary: "Review pricing — margin is negative",
        url: buildUrl(target, ctx),
      };
    }
    case "below_floor":
    case "below_target": {
      const target = ctx.productSlug ? "products" as const : "order" as const;
      return {
        action: "review_pricing",
        target,
        entityId: ctx.productSlug || ctx.orderId,
        entityType: ctx.productSlug ? "product" : ctx.orderId ? "order" : undefined,
        orderId: ctx.orderId,
        orderItemId: ctx.orderItemId,
        productSlug: ctx.productSlug,
        summary: "Review pricing — margin below threshold",
        url: buildUrl(target, ctx),
      };
    }
    default: {
      const target = "order" as const;
      return {
        action: "review_order",
        target,
        entityId: ctx.orderId,
        entityType: ctx.orderId ? "order" : undefined,
        orderId: ctx.orderId,
        summary: "Review order for pricing issues",
        url: buildUrl(target, ctx),
      };
    }
  }
}

/**
 * Given a reminder key from ops-reminders, return the recommended action.
 * Accepts either a legacy entityId string or structured OpsActionContext.
 */
export function reminderToAction(
  reminderKey: string,
  context?: string | OpsActionContext
): OpsActionHint {
  const ctx = normalizeContext(context);

  switch (reminderKey) {
    case "missingDisplayPrice": {
      const target = "products" as const;
      return {
        action: "update_display_price",
        target,
        entityId: ctx.productSlug,
        entityType: ctx.productSlug ? "product" : undefined,
        productSlug: ctx.productSlug,
        summary: "Set display price for product",
        url: buildUrl(target, ctx),
      };
    }
    case "missingFloorPolicy": {
      const target = "products" as const;
      return {
        action: "update_floor_policy",
        target,
        entityId: ctx.productSlug,
        entityType: ctx.productSlug ? "product" : undefined,
        productSlug: ctx.productSlug,
        summary: "Set floor pricing policy for product",
        url: buildUrl(target, ctx),
      };
    }
    case "missingVendorCost": {
      const target = "governance" as const;
      const govCtx = { ...ctx, section: "vendor" };
      return {
        action: "enter_vendor_cost",
        target,
        entityId: ctx.productSlug,
        entityType: ctx.productSlug ? "product" : undefined,
        productSlug: ctx.productSlug,
        summary: "Add vendor cost data",
        url: buildUrl(target, govCtx),
      };
    }
    case "staleVendorCosts": {
      const target = "governance" as const;
      const govCtx = { ...ctx, section: "vendor" };
      return {
        action: "verify_vendor_cost",
        target,
        entityId: ctx.productSlug,
        entityType: ctx.productSlug ? "product" : undefined,
        productSlug: ctx.productSlug,
        summary: "Re-verify stale vendor cost (>90 days)",
        url: buildUrl(target, govCtx),
      };
    }
    case "highDriftChanges": {
      const target = "governance" as const;
      return {
        action: "review_changelog",
        target,
        entityId: undefined,
        summary: "Review high-drift price changes",
        url: buildUrl(target, { section: "changelog" }),
      };
    }
    case "pendingApprovals": {
      const target = "governance" as const;
      const govCtx = { ...ctx, section: "approvals" };
      return {
        action: "review_approval",
        target,
        entityId: ctx.approvalId,
        entityType: ctx.approvalId ? "approval" : undefined,
        approvalId: ctx.approvalId,
        summary: "Review pending pricing approvals",
        url: buildUrl(target, govCtx),
      };
    }
    default: {
      const target = "products" as const;
      return {
        action: "review_pricing",
        target,
        entityId: ctx.productSlug,
        productSlug: ctx.productSlug,
        summary: "Review pricing configuration",
        url: buildUrl(target, ctx),
      };
    }
  }
}

/**
 * Canonical URL builder for ops actions.
 * Prefer using the pre-computed `url` field on OpsActionHint directly.
 * This function exists for callers that build hints manually.
 */
export function opsActionUrl(hint: OpsActionHint): string {
  return hint.url || buildUrl(hint.target, {
    orderId: hint.orderId,
    orderItemId: hint.orderItemId,
    productSlug: hint.productSlug || hint.entityId,
    approvalId: hint.approvalId,
  });
}
