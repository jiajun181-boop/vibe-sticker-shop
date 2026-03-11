/**
 * Unified status mapping for all admin pages.
 * Maps raw DB status strings to i18n keys and consistent color classes.
 */

// ── Color classes by semantic group ─────────────────────────────────────────

const GREEN   = "bg-green-100 text-green-700";
const EMERALD = "bg-emerald-100 text-emerald-700";
const YELLOW  = "bg-yellow-100 text-yellow-800";
const AMBER   = "bg-amber-100 text-amber-800";
const BLUE    = "bg-blue-100 text-blue-800";
const INDIGO  = "bg-indigo-100 text-indigo-700";
const CYAN    = "bg-cyan-100 text-cyan-800";
const RED     = "bg-red-100 text-red-700";
const GRAY    = "bg-gray-100 text-gray-600";
const SLATE   = "bg-slate-100 text-slate-700";
const PURPLE  = "bg-purple-100 text-purple-700";
const ORANGE  = "bg-orange-100 text-orange-800";

const STATUS_MAP = {
  // ── Pending / Waiting ──
  pending:          { color: YELLOW, key: "admin.status.pending" },
  pending_review:   { color: YELLOW, key: "admin.status.pending_review" },
  pending_payment:  { color: YELLOW, key: "admin.status.pending_payment" },
  awaiting_files:   { color: ORANGE, key: "admin.status.awaiting_files" },
  awaiting_proof:   { color: ORANGE, key: "admin.status.awaiting_proof" },
  unpaid:           { color: YELLOW, key: "admin.status.unpaid" },

  // ── In-progress ──
  processing:       { color: BLUE,   key: "admin.status.processing" },
  in_progress:      { color: BLUE,   key: "admin.status.in_progress" },
  in_production:    { color: BLUE,   key: "admin.status.in_production" },
  preflight:        { color: ORANGE, key: "admin.status.preflight" },
  not_started:      { color: SLATE,  key: "admin.status.not_started" },

  // ── Production stages ──
  queued:           { color: SLATE,    key: "admin.status.queued" },
  assigned:         { color: BLUE,     key: "admin.status.assigned" },
  printing:         { color: YELLOW,   key: "admin.status.printing" },
  cutting:          { color: CYAN,     key: "admin.status.cutting" },
  quality_check:    { color: PURPLE,   key: "admin.status.quality_check" },
  ready_for_print:  { color: BLUE,     key: "admin.status.ready_for_print" },
  ready_to_ship:    { color: CYAN,     key: "admin.status.ready_to_ship" },
  packaged:         { color: GREEN,    key: "admin.status.packaged" },

  // ── Approval flow ──
  approved:         { color: GREEN,  key: "admin.status.approved" },
  rejected:         { color: RED,    key: "admin.status.rejected" },
  revised:          { color: AMBER,  key: "admin.status.revised" },
  needs_review:     { color: AMBER,  key: "admin.status.needs_review" },
  needs_revision:   { color: AMBER,  key: "admin.status.needs_revision" },

  // ── Support ticket ──
  open:             { color: BLUE,     key: "admin.status.open" },
  waiting_customer: { color: PURPLE,   key: "admin.status.waiting_customer" },
  resolved:         { color: EMERALD,  key: "admin.status.resolved" },
  closed:           { color: GRAY,     key: "admin.status.closed" },

  // ── Completion ──
  completed:        { color: GREEN,    key: "admin.status.completed" },
  finished:         { color: GREEN,    key: "admin.status.finished" },
  paid:             { color: GREEN,    key: "admin.status.paid" },
  shipped:          { color: EMERALD,  key: "admin.status.shipped" },
  delivered:        { color: GREEN,    key: "admin.status.delivered" },
  picked_up:        { color: GREEN,    key: "admin.status.picked_up" },

  // ── Hold / Cancel ──
  on_hold:          { color: RED,    key: "admin.status.on_hold" },
  draft:            { color: GRAY,   key: "admin.status.draft" },
  cancelled:        { color: GRAY,   key: "admin.status.cancelled" },
  canceled:         { color: GRAY,   key: "admin.status.cancelled" },
  failed:           { color: RED,    key: "admin.status.failed" },

  // ── Quote statuses ──
  new:              { color: BLUE,    key: "admin.status.new" },
  reviewing:        { color: AMBER,   key: "admin.status.reviewing" },
  quoted:           { color: INDIGO,  key: "admin.status.quoted" },
  accepted:         { color: GREEN,   key: "admin.status.accepted" },
  converted:        { color: EMERALD, key: "admin.status.converted" },
  expired:          { color: GRAY,    key: "admin.status.expired" },

  // ── Special ──
  standalone:       { color: PURPLE, key: "admin.status.standalone" },
};

/**
 * Returns a human-readable, i18n label for a status string.
 * Falls back to title-cased raw string if status is unknown.
 */
export function statusLabel(status, t) {
  if (!status) return t ? t("admin.status.unknown") : "Unknown";
  const entry = STATUS_MAP[status];
  if (entry && t) return t(entry.key);
  // Fallback: title-case the raw string
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Returns TailwindCSS color classes for a status string.
 */
export function statusColor(status) {
  if (!status) return GRAY;
  return STATUS_MAP[status]?.color || GRAY;
}

// ── Priority colors ──────────────────────────────────────────────────────────

const PRIORITY_MAP = {
  normal: GRAY,
  rush:   ORANGE,
  urgent: RED,
};

export function priorityColor(priority) {
  return PRIORITY_MAP[priority] || GRAY;
}

// ── Payment status colors ────────────────────────────────────────────────────

const PAYMENT_MAP = {
  paid:                GREEN,
  unpaid:              RED,
  partially_paid:      AMBER,
  partially_refunded:  ORANGE,
  refunded:            PURPLE,
  failed:              RED,
};

export function paymentColor(status) {
  return PAYMENT_MAP[status] || GRAY;
}

// ── Production status colors (order-level) ───────────────────────────────────

const PRODUCTION_MAP = {
  not_started:   SLATE,
  preflight:     ORANGE,
  in_production: INDIGO,
  ready_to_ship: CYAN,
  quality_check: AMBER,
  completed:     GREEN,
  shipped:       EMERALD,
  on_hold:       YELLOW,
  canceled:      RED,
};

export function productionColor(status) {
  return PRODUCTION_MAP[status] || GRAY;
}
