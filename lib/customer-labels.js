/**
 * Customer-facing, i18n-backed labels for order status, production status,
 * and timeline actions.  Used by /account/orders/[id] and /track-order.
 *
 * Intentionally separate from lib/timeline-labels.js which serves admin views.
 */

/**
 * Customer-readable order-payment status label.
 * Falls back to the raw value title-cased if a key is missing.
 */
export function getCustomerOrderStatus(t, status) {
  const key = `customerLabel.orderStatus.${status}`;
  const label = t(key);
  // t() returns the key itself when no translation exists
  return label !== key ? label : (status || "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Customer-readable production status label.
 */
export function getCustomerProductionStatus(t, status) {
  const key = `customerLabel.productionStatus.${status}`;
  const label = t(key);
  return label !== key ? label : (status || "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Customer-readable timeline action label.
 * Covers common fulfillment + proof lifecycle events.
 * Internal-only actions (priority_changed, bulk_update, assigned, etc.)
 * are mapped to a generic neutral label so they never leak jargon.
 */
export function getCustomerTimelineLabel(t, action) {
  const key = `customerLabel.timeline.${action}`;
  const label = t(key);
  return label !== key ? label : t("customerLabel.timeline._default");
}
