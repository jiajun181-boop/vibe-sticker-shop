/**
 * Resolution-state consistency loop tests — Wave C.
 *
 * Validates that pricing issue resolution propagates correctly:
 * 1. Cost signal detects an issue → generates actionable nextAction
 * 2. Resolution endpoint exists and accepts the right params
 * 3. After resolution, recomputed signal reflects the fix
 * 4. Focus contract round-trips correctly through the loop
 */

import * as fs from "fs";
import * as path from "path";
import { computeCostSignal, computeOrderCostSignals } from "./production-cost-signal";
import { alertTypeToAction } from "./ops-action";
import { buildPricingUrl, parsePricingFocus, buildOrderUrl, hasExactTarget } from "./focus";

// ── Resolution loop: missing-cost → enter actual → signal clears ──

describe("Resolution loop: missing-cost signal", () => {
  const missingCostItem = {
    id: "item-mc",
    productName: "Test Product",
    totalPrice: 3000,
    materialCostCents: 500,
    estimatedCostCents: 1000,
    actualCostCents: 0, // missing
    vendorCostCents: 0,
  };

  test("detects missing-cost when production finished but no actual cost", () => {
    const signal = computeCostSignal(
      missingCostItem,
      "ord-mc",
      "processing",
      "shipped"  // must be shipped/completed/ready_to_ship to trigger missing-cost
    );
    expect(signal.level).toBe("missing-cost");
    expect(signal.nextAction).not.toBeNull();
  });

  test("missing-cost nextAction routes to costs tab with exact order+item", () => {
    const signal = computeCostSignal(
      missingCostItem,
      "ord-mc",
      "processing",
      "shipped",
      { returnTo: "/admin/production/job-1", source: "production" }
    );
    if (signal.level === "missing-cost" && signal.nextAction) {
      expect(signal.nextAction.url).toContain("tab=costs");
      expect(signal.nextAction.orderId).toBe("ord-mc");
      expect(signal.nextAction.orderItemId).toBe("item-mc");
      // URL should contain the exact targeting params
      expect(signal.nextAction.url).toContain("orderId=ord-mc");
      expect(signal.nextAction.url).toContain("itemId=item-mc");
    }
  });

  test("after entering actual cost, signal changes from missing-cost", () => {
    const resolvedItem = {
      ...missingCostItem,
      actualCostCents: 900, // actual cost entered
    };
    const signal = computeCostSignal(
      resolvedItem,
      "ord-mc",
      "processing",
      "shipped"
    );
    // Signal should no longer be missing-cost
    expect(signal.level).not.toBe("missing-cost");
  });

  test("after entering reasonable actual cost, signal becomes normal", () => {
    const resolvedItem = {
      ...missingCostItem,
      actualCostCents: 900, // within margin
    };
    const signal = computeCostSignal(
      resolvedItem,
      "ord-mc",
      "processing",
      "shipped"
    );
    expect(signal.level).toBe("normal");
    expect(signal.nextAction).toBeNull();
  });
});

// ── Resolution loop: needs-review → review pricing → signal clears ──

describe("Resolution loop: needs-review signal", () => {
  const negativeProfitItem = {
    id: "item-neg",
    productName: "Loss Leader",
    totalPrice: 500,           // revenue: $5
    materialCostCents: 0,
    estimatedCostCents: 80000, // cost: $800
    actualCostCents: 80000,
    vendorCostCents: 0,
  };

  test("detects needs-review for negative margin", () => {
    const signal = computeCostSignal(
      negativeProfitItem,
      "ord-neg",
      "processing",
      "printing"
    );
    expect(signal.level).toBe("needs-review");
    expect(signal.isNegativeMargin).toBe(true);
  });

  test("needs-review nextAction targets the right entity", () => {
    const signal = computeCostSignal(
      negativeProfitItem,
      "ord-neg",
      "processing",
      "printing",
      { returnTo: "/admin/workstation", source: "workstation" }
    );
    expect(signal.nextAction).not.toBeNull();
    expect(signal.nextAction!.orderId).toBe("ord-neg");
    expect(signal.nextAction!.orderItemId).toBe("item-neg");
    expect(signal.nextAction!.url).toBeDefined();
  });
});

// ── Aggregate signal resolution ──────────────────────────────────

describe("Aggregate signal resolution", () => {
  test("order with all items resolved shows normal aggregate", () => {
    const items = [
      {
        id: "i1",
        productName: "A",
        totalPrice: 5000,
        materialCostCents: 500,
        estimatedCostCents: 1000,
        actualCostCents: 900,
        vendorCostCents: 0,
      },
      {
        id: "i2",
        productName: "B",
        totalPrice: 3000,
        materialCostCents: 300,
        estimatedCostCents: 800,
        actualCostCents: 750,
        vendorCostCents: 0,
      },
    ];

    const { aggregate, perItem } = computeOrderCostSignals(
      items, "ord-ok", "processing", "shipped"
    );

    expect(aggregate.level).toBe("normal");
    expect(aggregate.nextAction).toBeNull();
    expect(perItem.every((s) => s.level === "normal")).toBe(true);
  });

  test("order with one unresolved item shows worst-case aggregate", () => {
    const items = [
      {
        id: "i1",
        productName: "OK Item",
        totalPrice: 5000,
        materialCostCents: 500,
        estimatedCostCents: 1000,
        actualCostCents: 900,
        vendorCostCents: 0,
      },
      {
        id: "i2",
        productName: "Missing Item",
        totalPrice: 3000,
        materialCostCents: 0,
        estimatedCostCents: 800,
        actualCostCents: 0, // missing
        vendorCostCents: 0,
      },
    ];

    const { aggregate } = computeOrderCostSignals(
      items, "ord-partial", "processing", "shipped"
    );

    // Aggregate should escalate to the worst per-item signal
    expect(aggregate.level).not.toBe("normal");
  });

  test("resolving the last missing item clears the aggregate", () => {
    const items = [
      {
        id: "i1",
        productName: "OK Item",
        totalPrice: 5000,
        materialCostCents: 500,
        estimatedCostCents: 1000,
        actualCostCents: 900,
        vendorCostCents: 0,
      },
      {
        id: "i2",
        productName: "Now Resolved",
        totalPrice: 3000,
        materialCostCents: 300,
        estimatedCostCents: 800,
        actualCostCents: 750, // resolved
        vendorCostCents: 0,
      },
    ];

    const { aggregate, perItem } = computeOrderCostSignals(
      items, "ord-resolved", "processing", "shipped"
    );

    expect(aggregate.level).toBe("normal");
    expect(perItem.every((s) => s.level === "normal")).toBe(true);
  });
});

// ── Focus contract round-trip through resolution ─────────────────

describe("Focus contract round-trip in resolution loop", () => {
  test("nextAction URL can be parsed back to a focus with exact target", () => {
    const signal = computeCostSignal(
      {
        id: "item-rt",
        productName: "Round Trip",
        totalPrice: 3000,
        materialCostCents: 0,
        estimatedCostCents: 1000,
        actualCostCents: 0,
        vendorCostCents: 0,
      },
      "ord-rt",
      "processing",
      "shipped",
      { returnTo: "/admin/production/job-rt", source: "production" }
    );

    if (signal.nextAction) {
      // Extract query string from URL
      const url = signal.nextAction.url;
      const qsIndex = url.indexOf("?");
      if (qsIndex > -1) {
        const qs = url.substring(qsIndex + 1);
        const focus = parsePricingFocus(qs);

        // Should have exact target fields
        expect(hasExactTarget(focus)).toBe(true);
        expect(focus.orderId).toBe("ord-rt");
        expect(focus.itemId).toBe("item-rt");

        // Should preserve resolve-and-return context
        expect(focus.returnTo).toBe("/admin/production/job-rt");
        expect(focus.source).toBe("production");
      }
    }
  });

  test("buildPricingUrl → parsePricingFocus preserves all resolution fields", () => {
    const url = buildPricingUrl({
      tab: "costs",
      orderId: "ord-123",
      itemId: "item-456",
      returnTo: "/admin/workstation",
      source: "workstation",
    });

    const focus = parsePricingFocus(url.split("?")[1]);
    expect(focus.tab).toBe("costs");
    expect(focus.orderId).toBe("ord-123");
    expect(focus.itemId).toBe("item-456");
    expect(focus.returnTo).toBe("/admin/workstation");
    expect(focus.source).toBe("workstation");
  });

  test("buildOrderUrl preserves source for resolve-and-return", () => {
    const url = buildOrderUrl("ord-src", "/admin/pricing?tab=costs", "production");
    expect(url).toContain("returnTo=");
    expect(url).toContain("source=production");
  });
});

// ── Resolution endpoints return costSignal ───────────────────────

describe("Resolution endpoints include costSignal in response", () => {
  test("actual-cost PATCH imports computeOrderCostSignals", () => {
    const src = fs.readFileSync(
      path.resolve(__dirname, "../../app/api/admin/orders/[id]/actual-cost/route.ts"),
      "utf-8"
    );
    expect(src).toContain("computeOrderCostSignals");
    expect(src).toContain("costSignal");
  });

  test("actual-cost PATCH recomputes signal after update", () => {
    const src = fs.readFileSync(
      path.resolve(__dirname, "../../app/api/admin/orders/[id]/actual-cost/route.ts"),
      "utf-8"
    );
    // Should recompute after update, not before
    expect(src).toContain("freshOrder");
    expect(src).toContain("aggregate:");
    expect(src).toContain("perItem:");
  });

  test("item-costs PATCH imports computeOrderCostSignals", () => {
    const src = fs.readFileSync(
      path.resolve(__dirname, "../../app/api/admin/orders/[id]/item-costs/route.ts"),
      "utf-8"
    );
    expect(src).toContain("computeOrderCostSignals");
    expect(src).toContain("costSignal");
  });

  test("item-costs PATCH recomputes signal after update", () => {
    const src = fs.readFileSync(
      path.resolve(__dirname, "../../app/api/admin/orders/[id]/item-costs/route.ts"),
      "utf-8"
    );
    expect(src).toContain("freshOrder");
    expect(src).toContain("aggregate:");
    expect(src).toContain("perItem:");
  });
});

// ── Resolution endpoint state propagation ────────────────────────

describe("Resolution endpoints propagate updated state", () => {
  test("approvals PATCH returns approval + remainingPending", () => {
    const src = fs.readFileSync(
      path.resolve(__dirname, "../../app/api/admin/pricing/approvals/route.ts"),
      "utf-8"
    );
    expect(src).toContain("updatedApproval");
    expect(src).toContain("remainingPending");
    expect(src).toContain("approval: updatedApproval");
  });

  test("approvals/apply returns updated approval state", () => {
    const src = fs.readFileSync(
      path.resolve(__dirname, "../../app/api/admin/pricing/approvals/apply/route.ts"),
      "utf-8"
    );
    expect(src).toContain("updatedApproval");
    expect(src).toContain("approval: updatedApproval");
  });

  test("actual-cost PATCH returns costSignal for immediate UI update", () => {
    const src = fs.readFileSync(
      path.resolve(__dirname, "../../app/api/admin/orders/[id]/actual-cost/route.ts"),
      "utf-8"
    );
    // Should recompute and return cost signal in PATCH response
    expect(src).toContain("computeOrderCostSignals");
    expect(src).toContain("costSignal,");
    // Should use source: "actual-cost" for attribution
    expect(src).toContain('source: "actual-cost"');
  });

  test("item-costs PATCH returns costSignal for immediate UI update", () => {
    const src = fs.readFileSync(
      path.resolve(__dirname, "../../app/api/admin/orders/[id]/item-costs/route.ts"),
      "utf-8"
    );
    expect(src).toContain("computeOrderCostSignals");
    expect(src).toContain("costSignal,");
    expect(src).toContain('source: "item-costs"');
  });
});

// ── Consistent resolution across surfaces ────────────────────────

describe("Cross-surface resolution consistency", () => {
  test("home-summary and ops-reminders both use focus contract for URLs", () => {
    const homeSrc = fs.readFileSync(
      path.resolve(__dirname, "../../app/api/admin/pricing/home-summary/route.ts"),
      "utf-8"
    );
    const opsSrc = fs.readFileSync(
      path.resolve(__dirname, "../../app/api/admin/pricing/ops-reminders/route.ts"),
      "utf-8"
    );
    expect(homeSrc).toContain("buildPricingUrl");
    expect(opsSrc).toContain("buildPricingUrl");
  });

  test("home-summary actionUrl and ops-reminders drilldownUrl use same contract", () => {
    const homeSrc = fs.readFileSync(
      path.resolve(__dirname, "../../app/api/admin/pricing/home-summary/route.ts"),
      "utf-8"
    );
    const opsSrc = fs.readFileSync(
      path.resolve(__dirname, "../../app/api/admin/pricing/ops-reminders/route.ts"),
      "utf-8"
    );
    // Both should route governance/approvals through the focus contract
    expect(homeSrc).toContain('tab: "governance", section: "approvals"');
    expect(opsSrc).toContain('tab: "governance", section: "approvals"');
    // Both should route costs through focus contract
    expect(homeSrc).toContain('tab: "costs"');
    // Both should route ops/alerts through focus contract
    expect(homeSrc).toContain('tab: "ops", section: "alerts"');
  });

  test("cost-completeness and profit-alerts both use alertTypeToAction", () => {
    const costSrc = fs.readFileSync(
      path.resolve(__dirname, "../../app/api/admin/pricing/cost-completeness/route.ts"),
      "utf-8"
    );
    const profitSrc = fs.readFileSync(
      path.resolve(__dirname, "../../app/api/admin/pricing/profit-alerts/route.ts"),
      "utf-8"
    );
    expect(costSrc).toContain("alertTypeToAction");
    expect(profitSrc).toContain("alertTypeToAction");
  });

  test("all pricing API endpoints producing URLs delegate to focus or ops-action", () => {
    // None should hand-build /admin/pricing?... strings
    const endpoints = [
      "../../app/api/admin/pricing/home-summary/route.ts",
      "../../app/api/admin/pricing/ops-reminders/route.ts",
      "../../app/api/admin/pricing/cost-completeness/route.ts",
      "../../app/api/admin/pricing/profit-alerts/route.ts",
    ];
    for (const ep of endpoints) {
      const src = fs.readFileSync(path.resolve(__dirname, ep), "utf-8");
      // Should use the shared contracts, not raw string URLs
      const usesContract = src.includes("buildPricingUrl") || src.includes("alertTypeToAction") || src.includes("reminderToAction");
      expect(usesContract).toBe(true);
    }
  });
});

// ── Mutation refreshHint contract ─────────────────────────────────

describe("Mutation responses include refreshHint", () => {
  test("actual-cost PATCH invalidates missingActualCost + profitAlerts", () => {
    const src = fs.readFileSync(
      path.resolve(__dirname, "../../app/api/admin/orders/[id]/actual-cost/route.ts"),
      "utf-8"
    );
    expect(src).toContain("refreshHint:");
    expect(src).toContain('"missingActualCost"');
    expect(src).toContain('"profitAlerts"');
  });

  test("item-costs PATCH invalidates missingActualCost + profitAlerts", () => {
    const src = fs.readFileSync(
      path.resolve(__dirname, "../../app/api/admin/orders/[id]/item-costs/route.ts"),
      "utf-8"
    );
    expect(src).toContain("refreshHint:");
    expect(src).toContain('"missingActualCost"');
    expect(src).toContain('"profitAlerts"');
  });

  test("approvals PATCH invalidates pendingApprovals", () => {
    const src = fs.readFileSync(
      path.resolve(__dirname, "../../app/api/admin/pricing/approvals/route.ts"),
      "utf-8"
    );
    expect(src).toContain("refreshHint:");
    expect(src).toContain('"pendingApprovals"');
  });

  test("approvals/apply invalidates pendingApprovals + context-specific sections", () => {
    const src = fs.readFileSync(
      path.resolve(__dirname, "../../app/api/admin/pricing/approvals/apply/route.ts"),
      "utf-8"
    );
    expect(src).toContain("refreshHint:");
    expect(src).toContain('"pendingApprovals"');
    // Vendor cost changes invalidate missingVendorCost
    expect(src).toContain('"missingVendorCost"');
    // Maps changeType to invalidation targets
    expect(src).toContain("vendor_cost");
  });

  test("vendor-costs POST invalidates missingVendorCost", () => {
    const src = fs.readFileSync(
      path.resolve(__dirname, "../../app/api/admin/pricing/vendor-costs/route.ts"),
      "utf-8"
    );
    expect(src).toContain("refreshHint:");
    expect(src).toContain('"missingVendorCost"');
  });

  test("vendor-costs PATCH invalidates missingVendorCost", () => {
    const src = fs.readFileSync(
      path.resolve(__dirname, "../../app/api/admin/pricing/vendor-costs/[id]/route.ts"),
      "utf-8"
    );
    expect(src).toContain("refreshHint:");
    expect(src).toContain('"missingVendorCost"');
  });

  test("vendor-costs DELETE invalidates missingVendorCost", () => {
    const src = fs.readFileSync(
      path.resolve(__dirname, "../../app/api/admin/pricing/vendor-costs/[id]/route.ts"),
      "utf-8"
    );
    // DELETE response should also have refreshHint
    const deleteSection = src.substring(src.indexOf("async function DELETE"));
    expect(deleteSection).toContain("refreshHint");
  });

  test("bulk-adjust apply invalidates profitAlerts + highDrift", () => {
    const src = fs.readFileSync(
      path.resolve(__dirname, "../../app/api/admin/pricing/bulk-adjust/route.ts"),
      "utf-8"
    );
    expect(src).toContain("refreshHint:");
    expect(src).toContain('"profitAlerts"');
    expect(src).toContain('"highDrift"');
  });

  test("bulk-adjust rollback invalidates profitAlerts + highDrift", () => {
    const src = fs.readFileSync(
      path.resolve(__dirname, "../../app/api/admin/pricing/bulk-adjust/rollback/route.ts"),
      "utf-8"
    );
    expect(src).toContain("refreshHint:");
    expect(src).toContain('"profitAlerts"');
    expect(src).toContain('"highDrift"');
  });

  test("order costs PATCH invalidates missingActualCost + profitAlerts", () => {
    const src = fs.readFileSync(
      path.resolve(__dirname, "../../app/api/admin/orders/[id]/costs/route.ts"),
      "utf-8"
    );
    expect(src).toContain("refreshHint:");
    expect(src).toContain('"missingActualCost"');
    expect(src).toContain('"profitAlerts"');
  });
});

// ── refreshHint section keys align with home-summary ─────────────

describe("refreshHint keys align with home-summary sections", () => {
  test("all invalidation keys exist in home-summary sections", () => {
    const homeSrc = fs.readFileSync(
      path.resolve(__dirname, "../../app/api/admin/pricing/home-summary/route.ts"),
      "utf-8"
    );
    // These are the section keys that mutations can invalidate
    const sectionKeys = ["pendingApprovals", "missingActualCost", "profitAlerts", "missingVendorCost", "highDrift", "quoteQueue"];
    for (const key of sectionKeys) {
      expect(homeSrc).toContain(`sections.${key}`);
    }
  });
});

// ── alertTypeToAction consistency with cost signal ───────────────

describe("alertTypeToAction aligns with cost signal resolution", () => {
  test("missing_actual_cost action targets costs tab", () => {
    const hint = alertTypeToAction("missing_actual_cost", {
      orderId: "o1",
      orderItemId: "i1",
    });
    expect(hint.target).toBe("costs");
    expect(hint.action).toBe("enter_actual_cost");
    expect(hint.url).toContain("tab=costs");
    expect(hint.url).toContain("orderId=o1");
    expect(hint.url).toContain("itemId=i1");
  });

  test("missing_vendor_cost action targets governance vendor section", () => {
    const hint = alertTypeToAction("missing_vendor_cost", {
      productSlug: "die-cut-stickers",
    });
    expect(hint.target).toBe("governance");
    expect(hint.action).toBe("enter_vendor_cost");
    expect(hint.url).toContain("section=vendor");
    expect(hint.url).toContain("slug=die-cut-stickers");
  });

  test("negative_margin action with orderId targets order detail", () => {
    const hint = alertTypeToAction("negative_margin", {
      orderId: "o-loss",
      orderItemId: "i-loss",
    });
    expect(hint.target).toBe("order");
    expect(hint.url).toContain("/admin/orders/o-loss");
  });

  test("negative_margin action with productSlug targets products tab", () => {
    const hint = alertTypeToAction("negative_margin", {
      productSlug: "kiss-cut-stickers",
    });
    expect(hint.target).toBe("products");
    expect(hint.url).toContain("tab=products");
    expect(hint.url).toContain("slug=kiss-cut-stickers");
  });

  test("resolve-and-return context flows through alertTypeToAction", () => {
    const hint = alertTypeToAction("missing_actual_cost", {
      orderId: "o1",
      orderItemId: "i1",
      returnTo: "/admin/production/job-1",
      source: "production",
    });
    expect(hint.url).toContain("returnTo=");
    expect(hint.url).toContain("source=production");
  });

  test("order-target actions include source in URL", () => {
    const hint = alertTypeToAction("negative_margin", {
      orderId: "o-src",
      returnTo: "/admin/workstation",
      source: "workstation",
    });
    expect(hint.url).toContain("source=workstation");
  });
});
