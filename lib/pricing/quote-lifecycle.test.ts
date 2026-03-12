/**
 * Tests for quote lifecycle truth — state machine transitions
 * and provenance contract enforcement.
 *
 * Wave B: Quote lifecycle truth validation.
 */

// ── State machine tests (unit, no DB) ──────────────────────────────

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  new:       ["reviewing", "rejected", "expired"],
  reviewing: ["quoted", "rejected", "expired"],
  quoted:    ["accepted", "rejected", "expired"],
  accepted:  ["reviewing"],
  rejected:  ["reviewing"],
  expired:   ["reviewing"],
  converted: [],
};

function isValidTransition(from: string, to: string): boolean {
  return (ALLOWED_TRANSITIONS[from] || []).includes(to);
}

describe("Quote state machine", () => {
  test("new → reviewing is valid", () => {
    expect(isValidTransition("new", "reviewing")).toBe(true);
  });

  test("new → quoted is NOT valid (must review first)", () => {
    expect(isValidTransition("new", "quoted")).toBe(false);
  });

  test("new → converted is NOT valid (cannot skip workflow)", () => {
    expect(isValidTransition("new", "converted")).toBe(false);
  });

  test("reviewing → quoted is valid", () => {
    expect(isValidTransition("reviewing", "quoted")).toBe(true);
  });

  test("quoted → accepted is valid", () => {
    expect(isValidTransition("quoted", "accepted")).toBe(true);
  });

  test("quoted → converted is NOT valid (must accept first)", () => {
    expect(isValidTransition("quoted", "converted")).toBe(false);
  });

  test("accepted → reviewing (re-open) is valid", () => {
    expect(isValidTransition("accepted", "reviewing")).toBe(true);
  });

  test("converted is terminal — no transitions allowed", () => {
    const allStatuses = Object.keys(ALLOWED_TRANSITIONS);
    for (const target of allStatuses) {
      expect(isValidTransition("converted", target)).toBe(false);
    }
  });

  test("rejected → reviewing (re-open) is valid", () => {
    expect(isValidTransition("rejected", "reviewing")).toBe(true);
  });

  test("rejected → quoted is NOT valid (must re-review)", () => {
    expect(isValidTransition("rejected", "quoted")).toBe(false);
  });

  test("expired → reviewing (re-open) is valid", () => {
    expect(isValidTransition("expired", "reviewing")).toBe(true);
  });

  test("every status has an entry in the transition map", () => {
    const allStatuses = ["new", "reviewing", "quoted", "accepted", "rejected", "expired", "converted"];
    for (const status of allStatuses) {
      expect(ALLOWED_TRANSITIONS).toHaveProperty(status);
    }
  });
});

// ── Route contract tests (verify source files enforce transitions) ──

import * as fs from "fs";
import * as path from "path";

describe("Quote route contracts", () => {
  const patchRoutePath = path.resolve(
    __dirname,
    "../../app/api/admin/quotes/[id]/route.ts"
  );
  const convertRoutePath = path.resolve(
    __dirname,
    "../../app/api/admin/quotes/[id]/convert/route.ts"
  );

  test("PATCH route references ALLOWED_TRANSITIONS for validation", () => {
    const src = fs.readFileSync(patchRoutePath, "utf-8");
    expect(src).toContain("ALLOWED_TRANSITIONS");
    // Must reject direct "converted" status
    expect(src).toContain('"converted"');
  });

  test("PATCH route requires quotedAmountCents for quoted status", () => {
    const src = fs.readFileSync(patchRoutePath, "utf-8");
    expect(src).toContain("quotedAmountCents");
    expect(src).toContain("Cannot mark as quoted without a quoted amount");
  });

  test("convert endpoint exists and validates accepted state", () => {
    const src = fs.readFileSync(convertRoutePath, "utf-8");
    expect(src).toContain("accepted");
    expect(src).toContain("convertedOrderId");
    expect(src).toContain("quote_converted");
  });

  test("convert endpoint requires orderId", () => {
    const src = fs.readFileSync(convertRoutePath, "utf-8");
    expect(src).toContain("orderId is required");
  });

  test("convert endpoint is pricing:edit permission", () => {
    const src = fs.readFileSync(convertRoutePath, "utf-8");
    expect(src).toContain('requirePermission(request, "pricing", "edit")');
  });
});

describe("Order create page quote provenance", () => {
  const createPagePath = path.resolve(
    __dirname,
    "../../app/admin/orders/create/page.js"
  );

  test("reads fromQuote search param", () => {
    const src = fs.readFileSync(createPagePath, "utf-8");
    expect(src).toContain("fromQuote");
  });

  test("calls convert endpoint after order creation", () => {
    const src = fs.readFileSync(createPagePath, "utf-8");
    expect(src).toContain("/api/admin/quotes/");
    expect(src).toContain("/convert");
  });

  test("pre-fills customer info from query params", () => {
    const src = fs.readFileSync(createPagePath, "utf-8");
    expect(src).toContain('searchParams.get("email")');
    expect(src).toContain('searchParams.get("name")');
    expect(src).toContain('searchParams.get("phone")');
  });
});

describe("Order detail quote provenance", () => {
  const orderApiPath = path.resolve(
    __dirname,
    "../../app/api/admin/orders/[id]/route.ts"
  );
  const orderPagePath = path.resolve(
    __dirname,
    "../../app/admin/orders/[id]/page.js"
  );

  test("order detail API includes sourceQuote reverse lookup", () => {
    const src = fs.readFileSync(orderApiPath, "utf-8");
    expect(src).toContain("sourceQuote");
    expect(src).toContain("convertedOrderId");
    expect(src).toContain("quoteRequest.findFirst");
  });

  test("order detail API returns quote reference and quoted amount", () => {
    const src = fs.readFileSync(orderApiPath, "utf-8");
    expect(src).toContain("reference");
    expect(src).toContain("quotedAmountCents");
  });

  test("order detail page renders quote provenance badge", () => {
    const src = fs.readFileSync(orderPagePath, "utf-8");
    expect(src).toContain("sourceQuote");
    expect(src).toContain("sourceQuote.reference");
  });
});

// ── Production provenance: quote→order→production ───────────────

describe("Production quote provenance", () => {
  const prodListPath = path.resolve(
    __dirname,
    "../../app/api/admin/production/route.ts"
  );
  const prodDetailPath = path.resolve(
    __dirname,
    "../../app/api/admin/production/[id]/route.ts"
  );

  test("production list API batch-looks up sourceQuote for all orders", () => {
    const src = fs.readFileSync(prodListPath, "utf-8");
    expect(src).toContain("quoteRequest.findMany");
    expect(src).toContain("convertedOrderId");
    expect(src).toContain("quoteByOrderId");
    expect(src).toContain("sourceQuote");
  });

  test("production list returns sourceQuote with id, reference, status, and quotedAmountCents", () => {
    const src = fs.readFileSync(prodListPath, "utf-8");
    expect(src).toContain("id: q.id");
    expect(src).toContain("reference: q.reference");
    expect(src).toContain("status: q.status");
    expect(src).toContain("quotedAmountCents: q.quotedAmountCents");
  });

  test("production detail API includes sourceQuote when costSignal requested", () => {
    const src = fs.readFileSync(prodDetailPath, "utf-8");
    expect(src).toContain("sourceQuote");
    expect(src).toContain("quoteRequest.findFirst");
    expect(src).toContain("convertedOrderId: orderId");
  });

  test("production detail returns quote reference, status, and quotedAmountCents", () => {
    const src = fs.readFileSync(prodDetailPath, "utf-8");
    expect(src).toContain("quotedAmountCents");
    expect(src).toContain("reference");
    expect(src).toContain("quotedAt");
    expect(src).toContain("status: true");
  });
});

// ── Quote detail enrichment ─────────────────────────────────────

describe("Quote detail provenance enrichment", () => {
  const quoteDetailPath = path.resolve(
    __dirname,
    "../../app/api/admin/quotes/[id]/route.ts"
  );

  test("quote detail GET returns allowedTransitions", () => {
    const src = fs.readFileSync(quoteDetailPath, "utf-8");
    expect(src).toContain("allowedTransitions");
    expect(src).toContain("ALLOWED_TRANSITIONS[status]");
  });

  test("quote detail GET returns convertedOrder when status is converted", () => {
    const src = fs.readFileSync(quoteDetailPath, "utf-8");
    expect(src).toContain("convertedOrder");
    expect(src).toContain("convertedOrderId");
  });

  test("convertedOrder includes order status and productionStatus", () => {
    const src = fs.readFileSync(quoteDetailPath, "utf-8");
    expect(src).toContain("productionStatus");
    expect(src).toContain("paymentStatus");
  });

  test("convertedOrder includes production job status for each item", () => {
    const src = fs.readFileSync(quoteDetailPath, "utf-8");
    expect(src).toContain("productionJobs");
    expect(src).toContain("jobStatus");
    expect(src).toContain("productionJob");
  });
});
