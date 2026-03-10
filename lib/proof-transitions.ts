/**
 * Proof status transition rules.
 *
 * Valid transitions:
 *   pending  → approved, rejected, revised (superseded by new version)
 *   approved → pending (reopen)
 *   rejected → pending (reopen), revised (superseded by new version)
 *
 * Terminal statuses (no outgoing transitions):
 *   revised  — historical / superseded; not actionable
 *
 * Order lifecycle side effects (order-linked proofs only):
 *   → approved:  order.productionStatus = "in_production"
 *   → rejected:  order.productionStatus = "preflight"
 *   → pending:   order.productionStatus = "preflight" (reopened)
 *   → revised:   no change (already preflight from rejection, or pending was never in production)
 */

export const PROOF_TRANSITIONS: Record<string, string[]> = {
  pending:  ["approved", "rejected", "revised"],
  approved: ["pending"],
  rejected: ["pending", "revised"],
};

/** Statuses that represent proofs actively waiting for a decision. */
export const ACTIONABLE_PROOF_STATUSES = ["pending"] as const;

/** Check whether a proof status means "waiting for a decision". */
export function isActionableProofStatus(status: string): boolean {
  return (ACTIONABLE_PROOF_STATUSES as readonly string[]).includes(status);
}

/** Check if a proof status transition is valid. */
export function isValidProofTransition(from: string, to: string): boolean {
  return PROOF_TRANSITIONS[from]?.includes(to) ?? false;
}

/** Human-readable explanation of why a transition is invalid. */
export function transitionError(from: string, to: string): string {
  if (from === to) {
    return `Proof is already ${from}.`;
  }
  if ((from === "approved" || from === "rejected") && (to === "approved" || to === "rejected")) {
    return `Cannot move from ${from} to ${to} directly. Reopen to pending first.`;
  }
  return `Cannot transition proof from ${from} to ${to}.`;
}
