// lib/order-config.js — Single source of truth for order/pricing constants
// All monetary values in CAD cents unless noted.

/** Ontario HST rate (13%) */
export const HST_RATE = 0.13;

/** Subtotal threshold (cents) above which shipping is free */
export const FREE_SHIPPING_THRESHOLD = 9900; // $99.00

/** Standard flat-rate delivery cost (cents) */
export const SHIPPING_COST = 1500; // $15.00

/** Design-help flat fee (cents) */
export const DESIGN_HELP_CENTS = 4500; // $45.00

/** Rush production multiplier (30% surcharge) */
export const RUSH_MULTIPLIER = 1.3;

/** Minimum unit price in cents (prevents $0 items) */
export const MIN_UNIT_AMOUNT = 50; // $0.50

/** Maximum quantity per line item */
export const MAX_ITEM_QUANTITY = 50_000;

/** Client-side checkout cooldown (ms) between consecutive submissions */
export const CHECKOUT_COOLDOWN_MS = 8_000;

/** B2B free shipping threshold (cents) — higher than consumer */
export const B2B_FREE_SHIPPING_THRESHOLD = 15_000; // $150.00

/** Shipping options exposed to storefront */
export const SHIPPING_OPTIONS = [
  { id: "pickup", label: "Pickup", sublabel: "123 Main St, Toronto", price: 0 },
  { id: "delivery", label: "Delivery", sublabel: "Standard shipping", price: SHIPPING_COST },
];

// ─── Order status transitions ────────────────────────────────────
/** Which order statuses a given status can transition to */
export const VALID_STATUS_TRANSITIONS = {
  draft: ["pending", "paid", "canceled"],
  pending: ["paid", "canceled"],
  paid: ["canceled", "refunded"],
  canceled: [],
  refunded: [],
};

// ─── Production status values ────────────────────────────────────
/** All valid order-level production statuses (mirrors Prisma enum) */
export const VALID_PRODUCTION_STATUSES = [
  "not_started", "preflight", "in_production",
  "ready_to_ship", "shipped", "completed",
  "on_hold", "canceled",
];

// ─── Production job transitions ──────────────────────────────────
/** Which job statuses a given job status can transition to */
export const VALID_JOB_TRANSITIONS = {
  queued:        ["assigned", "on_hold"],
  assigned:      ["printing", "queued", "on_hold"],
  printing:      ["quality_check", "finished", "on_hold"],
  quality_check: ["finished", "printing", "on_hold"],   // printing = rework
  finished:      ["shipped", "on_hold"],
  shipped:       [],                                     // terminal
  on_hold:       ["queued", "assigned", "printing", "quality_check", "finished"],
};

// ─── Invoice statuses ────────────────────────────────────────────
export const VALID_INVOICE_STATUSES = ["draft", "sent", "paid", "overdue", "void"];
