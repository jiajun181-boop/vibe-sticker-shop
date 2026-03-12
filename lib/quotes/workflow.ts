/**
 * lib/quotes/workflow.ts
 *
 * Canonical quote workflow contract.
 * Single source of truth for quote state semantics.
 *
 * Used by:
 * - Quote list API (queue-level workflow hints per row)
 * - Quote detail API (allowed transitions + action context)
 * - Quote mutations (refresh hints)
 * - Home-summary (quote queue signals)
 */

// ── Quote state machine ─────────────────────────────────────────

export type QuoteStatus =
  | "new"
  | "reviewing"
  | "quoted"
  | "accepted"
  | "rejected"
  | "expired"
  | "converted";

/** Allowed status transitions. "converted" only via dedicated endpoint. */
export const ALLOWED_TRANSITIONS: Record<QuoteStatus, QuoteStatus[]> = {
  new:       ["reviewing", "rejected", "expired"],
  reviewing: ["quoted", "rejected", "expired"],
  quoted:    ["accepted", "rejected", "expired"],
  accepted:  ["reviewing"],
  rejected:  ["reviewing"],
  expired:   ["reviewing"],
  converted: [],
};

/** Terminal statuses — no further workflow action possible. */
const TERMINAL: Set<QuoteStatus> = new Set(["converted", "rejected", "expired"]);

/** Statuses where the operator needs to do something. */
const ACTIONABLE: Set<QuoteStatus> = new Set(["new", "reviewing", "accepted"]);

// ── Per-quote workflow hints ────────────────────────────────────

export interface QuoteAction {
  /** Machine-readable action key */
  action: string;
  /** Human-readable summary */
  label: string;
  /** HTTP method + relative path hint (for UI button wiring) */
  method?: "PATCH" | "POST";
}

export interface QuoteWorkflowHint {
  /** Is this quote in a terminal state? */
  isTerminal: boolean;
  /** Does the operator need to act on this quote? */
  isActionable: boolean;
  /** Compact queue state for badge rendering */
  queueState: "needs_action" | "waiting" | "done";
  /** Primary action the operator should take (null if terminal) */
  primaryAction: QuoteAction | null;
  /** Optional secondary action */
  secondaryAction: QuoteAction | null;
}

/**
 * Derive workflow hints from a quote's current status.
 * Cheap, pure function — safe to call per-row in list responses.
 */
export function deriveWorkflowHint(status: QuoteStatus): QuoteWorkflowHint {
  const isTerminal = TERMINAL.has(status);
  const isActionable = ACTIONABLE.has(status);

  const queueState: QuoteWorkflowHint["queueState"] = isTerminal
    ? "done"
    : isActionable
      ? "needs_action"
      : "waiting"; // "quoted" — waiting for customer response

  let primaryAction: QuoteAction | null = null;
  let secondaryAction: QuoteAction | null = null;

  switch (status) {
    case "new":
      primaryAction = { action: "start_review", label: "Start reviewing", method: "PATCH" };
      secondaryAction = { action: "reject", label: "Reject", method: "PATCH" };
      break;
    case "reviewing":
      primaryAction = { action: "send_quote", label: "Send quote", method: "PATCH" };
      secondaryAction = { action: "reject", label: "Reject", method: "PATCH" };
      break;
    case "accepted":
      primaryAction = { action: "convert", label: "Convert to order", method: "POST" };
      break;
    case "quoted":
      // Waiting on customer — no operator action, but allow re-open
      primaryAction = null;
      secondaryAction = { action: "expire", label: "Mark expired", method: "PATCH" };
      break;
    case "rejected":
    case "expired":
      secondaryAction = { action: "reopen", label: "Re-open for review", method: "PATCH" };
      break;
    case "converted":
      // Terminal — no actions
      break;
  }

  return { isTerminal, isActionable, queueState, primaryAction, secondaryAction };
}

// ── Queue summary (for home-summary integration) ────────────────

export interface QuoteQueueSummary {
  /** Total actionable quotes (new + reviewing + accepted) */
  actionableCount: number;
  /** Breakdown by status */
  statusCounts: Record<string, number>;
  /** Severity for dashboard rendering */
  severity: "ok" | "warning" | "critical";
  /** Top actionable quote (for exact-target landing) */
  topActionable: {
    id: string;
    reference: string;
    status: string;
    customerName: string;
    label: string;
  } | null;
}

/**
 * Compute quote queue summary from status counts + optional top record.
 */
export function computeQueueSummary(
  statusCounts: Record<string, number>,
  topActionable: QuoteQueueSummary["topActionable"] | null
): QuoteQueueSummary {
  const actionableCount =
    (statusCounts["new"] || 0) +
    (statusCounts["reviewing"] || 0) +
    (statusCounts["accepted"] || 0);

  const severity: QuoteQueueSummary["severity"] =
    (statusCounts["new"] || 0) > 5
      ? "critical"
      : actionableCount > 0
        ? "warning"
        : "ok";

  return { actionableCount, statusCounts, severity, topActionable };
}

// ── Refresh hint keys for quote mutations ───────────────────────

/** Standard invalidation targets for quote mutations */
export const QUOTE_INVALIDATES = ["quoteQueue"] as const;

export type QuoteInvalidationKey = (typeof QUOTE_INVALIDATES)[number];

// ── Mutation refresh contract ───────────────────────────────────

export interface MutationRefreshHint {
  /** Which home-summary / queue sections to re-fetch */
  invalidates: string[];
  /** Optional: the exact record that was mutated (for optimistic update) */
  updatedRecord?: unknown;
}

/**
 * Build a standard refresh hint for quote mutations.
 * Includes quoteQueue + any extra pricing sections affected.
 */
export function buildQuoteRefreshHint(
  updatedRecord?: unknown,
  extraInvalidates?: string[]
): MutationRefreshHint {
  const invalidates = ["quoteQueue", ...(extraInvalidates || [])];
  return { invalidates, ...(updatedRecord !== undefined && { updatedRecord }) };
}
