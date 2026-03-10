/**
 * Order item classification utilities.
 *
 * Centralizes the service-fee detection predicate used by:
 *   - reorder route (excludes service fees from cart rebuild)
 *   - production-manifest (excludes from manifest)
 *   - production-readiness (excludes from assessment)
 *   - workstation (excludes from action labels)
 *   - admin order create (skips ProductionJob)
 */

/** Returns true if the order item is a service fee (e.g. design help), not a producible product. */
export function isServiceFeeItem(item: { meta?: unknown }): boolean {
  const meta = item.meta && typeof item.meta === "object" ? item.meta : {};
  return (meta as Record<string, unknown>).isServiceFee === "true";
}

/** Returns true if the order item is a real producible product (not a service fee). */
export function isProductionItem(item: { meta?: unknown }): boolean {
  return !isServiceFeeItem(item);
}
