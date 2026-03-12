/**
 * Quote workflow contract tests.
 *
 * Validates:
 * 1. State machine transitions
 * 2. Workflow hint derivation (isTerminal, isActionable, queueState, actions)
 * 3. Queue summary computation
 * 4. Refresh hint construction
 * 5. Quote API contract alignment
 */

import * as fs from "fs";
import * as path from "path";
import {
  ALLOWED_TRANSITIONS,
  deriveWorkflowHint,
  computeQueueSummary,
  buildQuoteRefreshHint,
  type QuoteStatus,
} from "./workflow";

// ── State machine ───────────────────────────────────────────────

describe("Quote state machine", () => {
  test("new can transition to reviewing, rejected, expired", () => {
    expect(ALLOWED_TRANSITIONS.new).toEqual(["reviewing", "rejected", "expired"]);
  });

  test("reviewing can transition to quoted, rejected, expired", () => {
    expect(ALLOWED_TRANSITIONS.reviewing).toEqual(["quoted", "rejected", "expired"]);
  });

  test("quoted can transition to accepted, rejected, expired", () => {
    expect(ALLOWED_TRANSITIONS.quoted).toEqual(["accepted", "rejected", "expired"]);
  });

  test("accepted can re-open to reviewing", () => {
    expect(ALLOWED_TRANSITIONS.accepted).toEqual(["reviewing"]);
  });

  test("converted is terminal — no transitions", () => {
    expect(ALLOWED_TRANSITIONS.converted).toEqual([]);
  });

  test("rejected and expired can re-open to reviewing", () => {
    expect(ALLOWED_TRANSITIONS.rejected).toEqual(["reviewing"]);
    expect(ALLOWED_TRANSITIONS.expired).toEqual(["reviewing"]);
  });
});

// ── Workflow hints ──────────────────────────────────────────────

describe("deriveWorkflowHint", () => {
  test("new → needs_action, start_review primary", () => {
    const h = deriveWorkflowHint("new");
    expect(h.isTerminal).toBe(false);
    expect(h.isActionable).toBe(true);
    expect(h.queueState).toBe("needs_action");
    expect(h.primaryAction?.action).toBe("start_review");
    expect(h.secondaryAction?.action).toBe("reject");
  });

  test("reviewing → needs_action, send_quote primary", () => {
    const h = deriveWorkflowHint("reviewing");
    expect(h.queueState).toBe("needs_action");
    expect(h.primaryAction?.action).toBe("send_quote");
  });

  test("quoted → waiting, no primary action", () => {
    const h = deriveWorkflowHint("quoted");
    expect(h.isActionable).toBe(false);
    expect(h.queueState).toBe("waiting");
    expect(h.primaryAction).toBeNull();
    expect(h.secondaryAction?.action).toBe("expire");
  });

  test("accepted → needs_action, convert primary", () => {
    const h = deriveWorkflowHint("accepted");
    expect(h.isActionable).toBe(true);
    expect(h.queueState).toBe("needs_action");
    expect(h.primaryAction?.action).toBe("convert");
  });

  test("converted → terminal, no actions", () => {
    const h = deriveWorkflowHint("converted");
    expect(h.isTerminal).toBe(true);
    expect(h.queueState).toBe("done");
    expect(h.primaryAction).toBeNull();
    expect(h.secondaryAction).toBeNull();
  });

  test("rejected → terminal, reopen secondary", () => {
    const h = deriveWorkflowHint("rejected");
    expect(h.isTerminal).toBe(true);
    expect(h.queueState).toBe("done");
    expect(h.secondaryAction?.action).toBe("reopen");
  });

  test("expired → terminal, reopen secondary", () => {
    const h = deriveWorkflowHint("expired");
    expect(h.isTerminal).toBe(true);
    expect(h.queueState).toBe("done");
    expect(h.secondaryAction?.action).toBe("reopen");
  });
});

// ── Queue summary ───────────────────────────────────────────────

describe("computeQueueSummary", () => {
  test("counts actionable statuses (new + reviewing + accepted)", () => {
    const qs = computeQueueSummary({ new: 3, reviewing: 2, quoted: 5, accepted: 1 }, null);
    expect(qs.actionableCount).toBe(6);
  });

  test("severity is ok when no actionable", () => {
    const qs = computeQueueSummary({ converted: 10, rejected: 5 }, null);
    expect(qs.severity).toBe("ok");
  });

  test("severity is warning when actionable but few new", () => {
    const qs = computeQueueSummary({ new: 3, reviewing: 1 }, null);
    expect(qs.severity).toBe("warning");
  });

  test("severity is critical when > 5 new quotes", () => {
    const qs = computeQueueSummary({ new: 8, reviewing: 1 }, null);
    expect(qs.severity).toBe("critical");
  });

  test("includes topActionable when provided", () => {
    const top = { id: "q1", reference: "Q-TEST", status: "new", customerName: "Jay", label: "Q-TEST — Jay" };
    const qs = computeQueueSummary({ new: 1 }, top);
    expect(qs.topActionable).toEqual(top);
  });
});

// ── Refresh hints ───────────────────────────────────────────────

describe("buildQuoteRefreshHint", () => {
  test("always includes quoteQueue", () => {
    const hint = buildQuoteRefreshHint();
    expect(hint.invalidates).toContain("quoteQueue");
  });

  test("includes updatedRecord when provided", () => {
    const hint = buildQuoteRefreshHint({ id: "q1", status: "quoted" });
    expect(hint.updatedRecord).toEqual({ id: "q1", status: "quoted" });
  });

  test("merges extra invalidation targets", () => {
    const hint = buildQuoteRefreshHint(undefined, ["pendingApprovals"]);
    expect(hint.invalidates).toContain("quoteQueue");
    expect(hint.invalidates).toContain("pendingApprovals");
  });
});

// ── Quote API contract alignment ────────────────────────────────

describe("Quote list API contract", () => {
  let src: string;
  beforeAll(() => {
    src = fs.readFileSync(
      path.resolve(__dirname, "../../app/api/admin/quotes/route.ts"),
      "utf-8"
    );
  });

  test("imports deriveWorkflowHint from workflow contract", () => {
    expect(src).toContain("deriveWorkflowHint");
    expect(src).toContain("@/lib/quotes/workflow");
  });

  test("enriches each quote with workflow hints", () => {
    expect(src).toContain("workflow: deriveWorkflowHint");
  });

  test("returns queueSummary for dashboard integration", () => {
    expect(src).toContain("queueSummary");
    expect(src).toContain("computeQueueSummary");
  });

  test("fetches top actionable quote for exact-target landing", () => {
    expect(src).toContain("topActionableRow");
    expect(src).toContain('status: { in: ["new", "reviewing", "accepted"] }');
  });
});

describe("Quote detail API contract", () => {
  let src: string;
  beforeAll(() => {
    src = fs.readFileSync(
      path.resolve(__dirname, "../../app/api/admin/quotes/[id]/route.ts"),
      "utf-8"
    );
  });

  test("imports workflow contract", () => {
    expect(src).toContain("deriveWorkflowHint");
    expect(src).toContain("ALLOWED_TRANSITIONS");
    expect(src).toContain("@/lib/quotes/workflow");
  });

  test("GET returns workflow hints alongside allowedTransitions", () => {
    expect(src).toContain("workflow,");
    expect(src).toContain("allowedTransitions,");
  });

  test("GET returns canConvert and needsQuoteAmount flags", () => {
    expect(src).toContain("canConvert");
    expect(src).toContain("needsQuoteAmount");
  });

  test("PATCH returns refreshHint with quoteQueue invalidation", () => {
    expect(src).toContain("refreshHint:");
    expect(src).toContain("buildQuoteRefreshHint");
  });

  test("PATCH returns updated workflow hints", () => {
    expect(src).toContain("workflow,");
    expect(src).toContain("allowedTransitions,");
  });
});

describe("Quote convert API contract", () => {
  let src: string;
  beforeAll(() => {
    src = fs.readFileSync(
      path.resolve(__dirname, "../../app/api/admin/quotes/[id]/convert/route.ts"),
      "utf-8"
    );
  });

  test("imports workflow contract", () => {
    expect(src).toContain("deriveWorkflowHint");
    expect(src).toContain("@/lib/quotes/workflow");
  });

  test("returns workflow hints for converted state", () => {
    expect(src).toContain('deriveWorkflowHint("converted")');
    expect(src).toContain("workflow,");
  });

  test("returns refreshHint", () => {
    expect(src).toContain("refreshHint:");
    expect(src).toContain("buildQuoteRefreshHint");
  });
});

// ── Mutation refresh contract alignment ─────────────────────────

describe("Mutation refresh contract", () => {
  const mutationFiles = {
    quotePatch: path.resolve(__dirname, "../../app/api/admin/quotes/[id]/route.ts"),
    quoteConvert: path.resolve(__dirname, "../../app/api/admin/quotes/[id]/convert/route.ts"),
    actualCost: path.resolve(__dirname, "../../app/api/admin/orders/[id]/actual-cost/route.ts"),
    itemCosts: path.resolve(__dirname, "../../app/api/admin/orders/[id]/item-costs/route.ts"),
    vendorCostsCreate: path.resolve(__dirname, "../../app/api/admin/pricing/vendor-costs/route.ts"),
    vendorCostsMutate: path.resolve(__dirname, "../../app/api/admin/pricing/vendor-costs/[id]/route.ts"),
    approvalReview: path.resolve(__dirname, "../../app/api/admin/pricing/approvals/route.ts"),
    bulkAdjust: path.resolve(__dirname, "../../app/api/admin/pricing/bulk-adjust/route.ts"),
  };

  test("all mutation endpoints return refreshHint", () => {
    for (const [, filePath] of Object.entries(mutationFiles)) {
      const src = fs.readFileSync(filePath, "utf-8");
      expect(src).toContain("refreshHint");
    }
  });

  test("all refreshHint objects use invalidates (inline or via helper)", () => {
    for (const [, filePath] of Object.entries(mutationFiles)) {
      const src = fs.readFileSync(filePath, "utf-8");
      // Either uses inline invalidates or delegates to a refresh helper
      const hasInvalidates = src.includes("invalidates") ||
        src.includes("buildQuoteRefreshHint") ||
        src.includes("buildApprovalApplyRefresh");
      expect(hasInvalidates).toBe(true);
    }
  });
});

// ── Home-summary ↔ Quote queue alignment ────────────────────────

describe("Home-summary and quote queue alignment", () => {
  let homeSrc: string;
  beforeAll(() => {
    homeSrc = fs.readFileSync(
      path.resolve(__dirname, "../../app/api/admin/pricing/home-summary/route.ts"),
      "utf-8"
    );
  });

  test("home-summary imports computeQueueSummary from workflow contract", () => {
    expect(homeSrc).toContain("computeQueueSummary");
    expect(homeSrc).toContain("@/lib/quotes/workflow");
  });

  test("home-summary includes quoteQueue section", () => {
    expect(homeSrc).toContain("sections.quoteQueue");
    expect(homeSrc).toContain("quoteQueueResult");
  });

  test("quoteQueue section has degradation handling", () => {
    expect(homeSrc).toContain('errors.push("quoteQueue")');
  });

  test("quote_queue action item has consistent structure with pricing action items", () => {
    expect(homeSrc).toContain('"quote_queue"');
    expect(homeSrc).toContain("awaiting action");
    expect(homeSrc).toContain('tab: "quotes"');
  });
});
