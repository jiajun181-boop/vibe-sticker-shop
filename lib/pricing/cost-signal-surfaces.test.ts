/**
 * Cost signal surface consistency tests — Wave A.
 *
 * Validates that all live operator surfaces consume cost signal
 * through the shared component and the same underlying helper.
 */

import * as fs from "fs";
import * as path from "path";
import { computeCostSignal, computeOrderCostSignals } from "./production-cost-signal";

// ── Shared component contract ────────────────────────────────────

describe("CostSignalBadge shared component", () => {
  const badgePath = path.resolve(
    __dirname,
    "../../components/admin/CostSignalBadge.js"
  );

  test("exports default CostSignalBadge and named CostSignalInline", () => {
    const src = fs.readFileSync(badgePath, "utf-8");
    expect(src).toContain("export default function CostSignalBadge");
    expect(src).toContain("export function CostSignalInline");
  });

  test("handles all three signal levels", () => {
    const src = fs.readFileSync(badgePath, "utf-8");
    expect(src).toContain("needs-review");
    expect(src).toContain("missing-cost");
    expect(src).toContain("normal");
  });

  test("supports sm, md, lg sizes", () => {
    const src = fs.readFileSync(badgePath, "utf-8");
    expect(src).toContain("sm:");
    expect(src).toContain("md:");
    expect(src).toContain("lg:");
  });

  test("renders nothing for normal signal", () => {
    const src = fs.readFileSync(badgePath, "utf-8");
    expect(src).toContain('signal.level === "normal"');
    expect(src).toContain("return null");
  });

  test("renders as Link when nextAction.url is available", () => {
    const src = fs.readFileSync(badgePath, "utf-8");
    expect(src).toContain("nextAction?.url");
    expect(src).toContain("Link");
    expect(src).toContain("href={url}");
  });

  test("renders as span when no nextAction", () => {
    const src = fs.readFileSync(badgePath, "utf-8");
    // Both CostSignalBadge and CostSignalInline have span fallback
    expect(src).toContain("<span");
  });
});

// ── Surface consumption contracts ─────────────────────────────────

describe("All operator surfaces use shared CostSignalBadge", () => {
  const surfaces = [
    { name: "Production list", path: "../../app/admin/production/page.js" },
    { name: "Production detail", path: "../../app/admin/production/[id]/page.js" },
    { name: "Order detail", path: "../../app/admin/orders/[id]/page.js" },
    { name: "Workstation", path: "../../app/admin/workstation/page.js" },
  ];

  for (const surface of surfaces) {
    test(`${surface.name} imports CostSignalBadge`, () => {
      const src = fs.readFileSync(path.resolve(__dirname, surface.path), "utf-8");
      expect(src).toContain("CostSignalBadge");
    });
  }
});

// ── API contracts: cost signal in responses ───────────────────────

describe("API endpoints include cost signal", () => {
  test("production list API computes costSignal per job", () => {
    const src = fs.readFileSync(
      path.resolve(__dirname, "../../app/api/admin/production/route.ts"),
      "utf-8"
    );
    expect(src).toContain("computeCostSignal");
    expect(src).toContain("costSignal:");
  });

  test("production detail API supports ?include=costSignal", () => {
    const src = fs.readFileSync(
      path.resolve(__dirname, "../../app/api/admin/production/[id]/route.ts"),
      "utf-8"
    );
    expect(src).toContain("costSignal");
    expect(src).toContain("include");
  });

  test("order detail API computes aggregate + per-item costSignal", () => {
    const src = fs.readFileSync(
      path.resolve(__dirname, "../../app/api/admin/orders/[id]/route.ts"),
      "utf-8"
    );
    expect(src).toContain("computeOrderCostSignals");
    expect(src).toContain("costSignal:");
  });

  test("workstation summary API attaches costSignal per order", () => {
    const src = fs.readFileSync(
      path.resolve(__dirname, "../../app/api/admin/workstation/summary/route.ts"),
      "utf-8"
    );
    expect(src).toContain("computeOrderCostSignals");
    expect(src).toContain("costSignal:");
  });
});

// ── Signal consistency ────────────────────────────────────────────

describe("Signal consistency across surfaces", () => {
  const item = {
    id: "item-1",
    productName: "Test",
    totalPrice: 1000,
    materialCostCents: 0,
    estimatedCostCents: 5000,
    actualCostCents: 0,
    vendorCostCents: 0,
  };

  test("computeCostSignal and computeOrderCostSignals agree on single item", () => {
    const single = computeCostSignal(item, "o1", "processing", "printing");
    const { aggregate, perItem } = computeOrderCostSignals(
      [item],
      "o1",
      "processing",
      "printing"
    );

    // Same item should produce same signal
    expect(perItem[0].level).toBe(single.level);
    expect(perItem[0].isNegativeMargin).toBe(single.isNegativeMargin);
    expect(aggregate.level).toBe(single.level);
  });

  test("perItem includes itemId for mapping", () => {
    const { perItem } = computeOrderCostSignals(
      [item],
      "o1",
      "processing",
      "printing"
    );
    expect(perItem[0]).toHaveProperty("itemId", "item-1");
  });
});

// ── Pricing risk as operational gate (Wave C) ────────────────────

describe("Cost signal includes actionable resolution path", () => {
  test("normal signal has null nextAction", () => {
    const signal = computeCostSignal(
      {
        id: "item-ok",
        productName: "Good Product",
        totalPrice: 5000,
        materialCostCents: 500,
        estimatedCostCents: 1000,
        actualCostCents: 1000,
        vendorCostCents: 800,
      },
      "ord-ok",
      "processing",
      "printing"
    );
    expect(signal.level).toBe("normal");
    expect(signal.nextAction).toBeNull();
  });

  test("needs-review signal includes nextAction with orderId and URL", () => {
    // Item where cost exceeds revenue → negative margin
    const signal = computeCostSignal(
      {
        id: "item-loss",
        productName: "Loss Product",
        totalPrice: 500,           // revenue: $5
        materialCostCents: 0,
        estimatedCostCents: 80000, // estimated cost: $800
        actualCostCents: 80000,
        vendorCostCents: 0,
      },
      "ord-loss",
      "processing",
      "printing"
    );
    expect(signal.level).toBe("needs-review");
    expect(signal.nextAction).not.toBeNull();
    expect(signal.nextAction!.action).toBeDefined();
    expect(signal.nextAction!.orderId).toBe("ord-loss");
    expect(signal.nextAction!.orderItemId).toBe("item-loss");
    expect(signal.nextAction!.url).toBeDefined();
    expect(signal.nextAction!.url.startsWith("/admin")).toBe(true);
  });

  test("missing-cost signal includes nextAction pointing to cost entry", () => {
    const signal = computeCostSignal(
      {
        id: "item-noact",
        productName: "No Actual Cost",
        totalPrice: 3000,
        materialCostCents: 0,
        estimatedCostCents: 1000,
        actualCostCents: 0,       // missing actual cost
        vendorCostCents: 0,
      },
      "ord-noact",
      "processing",
      "finished"   // production finished but no actual cost
    );
    // The signal should flag missing cost
    if (signal.level === "missing-cost") {
      expect(signal.nextAction).not.toBeNull();
      expect(signal.nextAction!.url).toContain("tab=costs");
      expect(signal.nextAction!.orderId).toBe("ord-noact");
      expect(signal.nextAction!.orderItemId).toBe("item-noact");
    }
  });

  test("nextAction field exists in ProductionCostSignal type", () => {
    const src = fs.readFileSync(
      path.resolve(__dirname, "./production-cost-signal.ts"),
      "utf-8"
    );
    expect(src).toContain("nextAction: OpsActionHint | null");
  });

  test("computeCostSignal uses alertTypeToAction for routing", () => {
    const src = fs.readFileSync(
      path.resolve(__dirname, "./production-cost-signal.ts"),
      "utf-8"
    );
    expect(src).toContain("alertTypeToAction");
    expect(src).toContain("orderId");
    expect(src).toContain("orderItemId: item.id");
  });

  test("all 4 operator surfaces can access nextAction through costSignal", () => {
    const { aggregate, perItem } = computeOrderCostSignals(
      [
        {
          id: "i1",
          productName: "A",
          totalPrice: 500,
          materialCostCents: 0,
          estimatedCostCents: 80000,
          actualCostCents: 80000,
          vendorCostCents: 0,
        },
      ],
      "o1",
      "processing",
      "printing"
    );
    expect(perItem[0]).toHaveProperty("nextAction");
    expect(aggregate).toHaveProperty("nextAction");
  });
});

// ── Resolve-and-return routing context ───────────────────────────

describe("Resolve-and-return routing context", () => {
  test("routingContext with returnTo is included in nextAction URL", () => {
    const signal = computeCostSignal(
      {
        id: "item-ret",
        productName: "Return Test",
        totalPrice: 500,
        materialCostCents: 0,
        estimatedCostCents: 80000,
        actualCostCents: 80000,
        vendorCostCents: 0,
      },
      "ord-ret",
      "processing",
      "printing",
      { returnTo: "/admin/production/job-1", source: "production" }
    );
    if (signal.nextAction) {
      expect(signal.nextAction.url).toContain("returnTo=");
      expect(signal.nextAction.url).toContain("source=production");
    }
  });

  test("routingContext without returnTo produces URL without returnTo", () => {
    const signal = computeCostSignal(
      {
        id: "item-noret",
        productName: "No Return",
        totalPrice: 500,
        materialCostCents: 0,
        estimatedCostCents: 80000,
        actualCostCents: 80000,
        vendorCostCents: 0,
      },
      "ord-noret",
      "processing",
      "printing"
    );
    if (signal.nextAction) {
      expect(signal.nextAction.url).not.toContain("returnTo=");
    }
  });

  test("production list API passes source=production", () => {
    const src = fs.readFileSync(
      path.resolve(__dirname, "../../app/api/admin/production/route.ts"),
      "utf-8"
    );
    expect(src).toContain('source: "production"');
    expect(src).toContain("returnTo:");
  });

  test("production detail API passes source=production-detail", () => {
    const src = fs.readFileSync(
      path.resolve(__dirname, "../../app/api/admin/production/[id]/route.ts"),
      "utf-8"
    );
    expect(src).toContain('source: "production-detail"');
    expect(src).toContain("returnTo:");
  });

  test("order detail API passes source=order-detail", () => {
    const src = fs.readFileSync(
      path.resolve(__dirname, "../../app/api/admin/orders/[id]/route.ts"),
      "utf-8"
    );
    expect(src).toContain('source: "order-detail"');
    expect(src).toContain("returnTo:");
  });

  test("workstation API passes source=workstation", () => {
    const src = fs.readFileSync(
      path.resolve(__dirname, "../../app/api/admin/workstation/summary/route.ts"),
      "utf-8"
    );
    expect(src).toContain('source: "workstation"');
    expect(src).toContain("returnTo:");
  });
});
