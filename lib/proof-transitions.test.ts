/**
 * Regression tests for proof status transition guardrails.
 *
 * Validates the transition map and helpers in lib/proof-transitions.ts
 * used by the admin proof PATCH route.
 */

import {
  PROOF_TRANSITIONS,
  ACTIONABLE_PROOF_STATUSES,
  isValidProofTransition,
  isActionableProofStatus,
  transitionError,
} from "@/lib/proof-transitions";

describe("PROOF_TRANSITIONS map", () => {
  it("pending can go to approved, rejected, revised", () => {
    expect(PROOF_TRANSITIONS.pending).toEqual(
      expect.arrayContaining(["approved", "rejected", "revised"])
    );
  });

  it("revised is terminal — no outgoing transitions", () => {
    expect(PROOF_TRANSITIONS.revised).toBeUndefined();
  });

  it("approved can only reopen to pending", () => {
    expect(PROOF_TRANSITIONS.approved).toEqual(["pending"]);
  });

  it("rejected can reopen to pending or be superseded (revised)", () => {
    expect(PROOF_TRANSITIONS.rejected).toEqual(
      expect.arrayContaining(["pending", "revised"])
    );
  });
});

describe("isValidProofTransition", () => {
  const validCases: [string, string][] = [
    ["pending", "approved"],
    ["pending", "rejected"],
    ["pending", "revised"],
    ["approved", "pending"],
    ["rejected", "pending"],
    ["rejected", "revised"],
  ];

  it.each(validCases)("%s → %s is valid", (from, to) => {
    expect(isValidProofTransition(from, to)).toBe(true);
  });

  const invalidCases: [string, string][] = [
    // revised is terminal — cannot transition out
    ["revised", "approved"],
    ["revised", "rejected"],
    ["revised", "pending"],
    // direct cross-transitions require reopen
    ["approved", "rejected"],
    ["rejected", "approved"],
    ["approved", "revised"],
    // self-transitions are invalid
    ["pending", "pending"],
    ["approved", "approved"],
    ["rejected", "rejected"],
    ["revised", "revised"],
  ];

  it.each(invalidCases)("%s → %s is invalid", (from, to) => {
    expect(isValidProofTransition(from, to)).toBe(false);
  });

  it("unknown status → anything is invalid", () => {
    expect(isValidProofTransition("unknown", "approved")).toBe(false);
  });
});

describe("isActionableProofStatus", () => {
  it("pending is actionable (needs decision)", () => {
    expect(isActionableProofStatus("pending")).toBe(true);
  });

  it("revised is NOT actionable (historical)", () => {
    expect(isActionableProofStatus("revised")).toBe(false);
  });

  it("approved is NOT actionable (decided)", () => {
    expect(isActionableProofStatus("approved")).toBe(false);
  });

  it("rejected is NOT actionable (decided)", () => {
    expect(isActionableProofStatus("rejected")).toBe(false);
  });

  it("ACTIONABLE_PROOF_STATUSES contains only pending", () => {
    expect(ACTIONABLE_PROOF_STATUSES).toEqual(["pending"]);
  });
});

describe("transitionError", () => {
  it("same-status gives 'already' message", () => {
    expect(transitionError("approved", "approved")).toMatch(/already approved/);
  });

  it("approved→rejected suggests reopening first", () => {
    expect(transitionError("approved", "rejected")).toMatch(/Reopen to pending first/);
  });

  it("rejected→approved suggests reopening first", () => {
    expect(transitionError("rejected", "approved")).toMatch(/Reopen to pending first/);
  });

  it("revised→anything gives generic cannot-transition message", () => {
    expect(transitionError("revised", "pending")).toMatch(/Cannot transition/);
    expect(transitionError("revised", "approved")).toMatch(/Cannot transition/);
  });
});
