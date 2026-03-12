/**
 * Order-centered shipping contract.
 *
 * This is the single source of truth for:
 *   - Mapping shipment status → order fulfillment state
 *   - Carrier display labels and tracking URL builders
 *   - Shipment status display labels and badge colors
 *
 * Shared by: order detail, shipping workspace, workstation, dashboard.
 * Pure functions — no DB or API dependencies.
 */

// ── Carrier constants ───────────────────────────────────────────────────────

export const CARRIERS = {
  canada_post: { label: "Canada Post", color: "bg-red-100 text-red-700" },
  purolator:   { label: "Purolator",   color: "bg-purple-100 text-purple-700" },
  ups:         { label: "UPS",         color: "bg-amber-100 text-amber-800" },
  fedex:       { label: "FedEx",       color: "bg-blue-100 text-blue-700" },
  pickup:      { label: "Pickup",      color: "bg-gray-100 text-gray-600" },
  other:       { label: "Other",       color: "bg-gray-100 text-gray-600" },
};

const CARRIER_ALIASES = {
  "canada post": "canada_post",
  "canada-post": "canada_post",
  canada_post: "canada_post",
  purolator: "purolator",
  ups: "ups",
  fedex: "fedex",
  pickup: "pickup",
  other: "other",
};

export function normalizeCarrierCode(carrier) {
  if (!carrier) return "canada_post";
  const normalized = String(carrier).trim().toLowerCase();
  return CARRIER_ALIASES[normalized] || "other";
}

export function getCarrierLabel(carrier) {
  return CARRIERS[carrier]?.label || carrier || "—";
}

export function getCarrierColor(carrier) {
  return CARRIERS[carrier]?.color || "bg-gray-100 text-gray-600";
}

// ── Tracking URL builders ───────────────────────────────────────────────────

const TRACKING_URL_BUILDERS = {
  canada_post: (t) => `https://www.canadapost-postescanada.ca/track-reperage/en#/search?searchFor=${t}`,
  purolator:   (t) => `https://www.purolator.com/en/shipping/tracker?pin=${t}`,
  ups:         (t) => `https://www.ups.com/track?tracknum=${t}`,
  fedex:       (t) => `https://www.fedex.com/fedextrack/?trknbr=${t}`,
};

/**
 * Returns a carrier tracking URL or null if carrier/number is unavailable.
 */
export function getTrackingUrl(carrier, trackingNumber) {
  if (!carrier || !trackingNumber) return null;
  const builder = TRACKING_URL_BUILDERS[carrier];
  return builder ? builder(trackingNumber) : null;
}

// ── Shipment status constants ───────────────────────────────────────────────

export const SHIPMENT_STATUS = {
  pending:       { label: "Pending",       color: "bg-gray-100 text-gray-700" },
  label_created: { label: "Label Created", color: "bg-blue-100 text-blue-700" },
  picked_up:     { label: "Picked Up",     color: "bg-indigo-100 text-indigo-700" },
  in_transit:    { label: "In Transit",    color: "bg-amber-100 text-amber-700" },
  delivered:     { label: "Delivered",     color: "bg-green-100 text-green-700" },
  returned:      { label: "Returned",      color: "bg-red-100 text-red-700" },
  exception:     { label: "Exception",     color: "bg-red-100 text-red-700" },
};

export function getShipmentStatusLabel(status) {
  return SHIPMENT_STATUS[status]?.label || status || "—";
}

export function getShipmentStatusColor(status) {
  return SHIPMENT_STATUS[status]?.color || "bg-gray-100 text-gray-700";
}

export const POST_DISPATCH_SHIPMENT_STATUSES = new Set([
  "picked_up",
  "in_transit",
  "delivered",
  "returned",
  "exception",
]);

export function shipmentStatusMarksOrderShipped(status) {
  return POST_DISPATCH_SHIPMENT_STATUSES.has(status);
}

export function getOrderProductionStatusForShipmentStatus(status) {
  return shipmentStatusMarksOrderShipped(status) ? "shipped" : null;
}

// ── Order fulfillment state ─────────────────────────────────────────────────

/**
 * Fulfillment state — how shipping looks from the order's perspective.
 *
 * Derives a single fulfillment snapshot from all shipments associated
 * with an order. The "highest" (most advanced) shipment determines
 * the order-level state.
 */

const FULFILLMENT_PRIORITY = [
  "exception",     // 0 — surfaces immediately
  "returned",      // 1
  "delivered",     // 2
  "in_transit",    // 3
  "picked_up",     // 4
  "label_created", // 5
  "pending",       // 6
];

/**
 * Derive order-level fulfillment from its shipments.
 *
 * @param {Array} shipments — Shipment records for one order
 * @returns {{ state, label, color, shipmentCount, latestShipment, trackingNumbers }}
 */
export function getOrderFulfillment(shipments) {
  if (!shipments || shipments.length === 0) {
    return {
      state: "unfulfilled",
      label: "Unfulfilled",
      color: "bg-gray-100 text-gray-500",
      shipmentCount: 0,
      latestShipment: null,
      trackingNumbers: [],
    };
  }

  // Find the shipment with the "highest priority" status
  // Exception/returned surface first; then delivered > in_transit > ... > pending
  let best = shipments[0];
  let bestPriority = FULFILLMENT_PRIORITY.indexOf(best.status);
  if (bestPriority === -1) bestPriority = FULFILLMENT_PRIORITY.length;

  for (let i = 1; i < shipments.length; i++) {
    let p = FULFILLMENT_PRIORITY.indexOf(shipments[i].status);
    if (p === -1) p = FULFILLMENT_PRIORITY.length;
    if (p < bestPriority) {
      best = shipments[i];
      bestPriority = p;
    }
  }

  const status = SHIPMENT_STATUS[best.status] || SHIPMENT_STATUS.pending;

  return {
    state: best.status,
    label: status.label,
    color: status.color,
    shipmentCount: shipments.length,
    latestShipment: best,
    trackingNumbers: shipments
      .filter((s) => s.trackingNumber)
      .map((s) => ({
        number: s.trackingNumber,
        carrier: s.carrier,
        url: getTrackingUrl(s.carrier, s.trackingNumber),
      })),
  };
}
