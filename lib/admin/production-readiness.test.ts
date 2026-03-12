/**
 * Regression tests for contour outcome mapping in production readiness.
 *
 * Validates:
 *   R1: Confidence string comparison works (not numeric)
 *   R2: Contour ready vs needs-review distinction
 *   R3: registrationMarkReady accepts both field names
 *   R4: Non-sticker items ignore contour flags
 *   R5: Task queue routes manual-review items to contourReview bucket
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const { assessItem, categorizeForTaskQueue, READINESS } = require("@/lib/admin/production-readiness") as {
  assessItem: (item: any, orderId: string) => any;
  categorizeForTaskQueue: (orders: any[]) => any;
  READINESS: Record<string, string>;
};

// Minimal sticker item for testing
function stickerItem(metaOverrides: Record<string, unknown> = {}) {
  return {
    id: "item-sticker-1",
    productName: "Die-Cut Stickers",
    productType: "sticker",
    quantity: 100,
    widthIn: 3,
    heightIn: 3,
    material: "white-vinyl",
    finishing: null,
    fileUrl: "https://cdn.example.com/art.png",
    meta: {
      contourSvg: "https://cdn.example.com/contour.svg",
      contourAppliedAt: "2026-03-10T12:00:00Z",
      contourConfidence: "good",
      contourShapeType: "organic",
      ...metaOverrides,
    },
    specsJson: null,
    productionJob: null,
  };
}

// ── R1: Confidence string comparison ──────────────────────────────────────────

describe("readiness — contour confidence", () => {
  it("good confidence → no manual review", () => {
    const result = assessItem(stickerItem({ contourConfidence: "good" }), "order-1");
    expect(result.manualReviewRequired).toBe(false);
  });

  it("low confidence → manual review required", () => {
    const result = assessItem(stickerItem({ contourConfidence: "low" }), "order-1");
    expect(result.manualReviewRequired).toBe(true);
    expect(result.reasons.some((r: any) => r.code === "manual_review_needed")).toBe(true);
  });

  it("rectangular confidence → manual review required", () => {
    const result = assessItem(stickerItem({ contourConfidence: "rectangular" }), "order-1");
    expect(result.manualReviewRequired).toBe(true);
  });

  it("null confidence → no manual review", () => {
    const result = assessItem(stickerItem({ contourConfidence: null }), "order-1");
    expect(result.manualReviewRequired).toBe(false);
  });
});

// ── R2: Contour ready vs needs-review ─────────────────────────────────────────

describe("readiness — contour outcome states", () => {
  it("sticker with good contour → ready", () => {
    const result = assessItem(stickerItem(), "order-1");
    expect(result.contourReady).toBe(true);
    expect(result.manualReviewRequired).toBe(false);
    expect(result.level).toBe(READINESS.READY);
  });

  it("sticker with no contour → needs-info with needs_contour reason", () => {
    const result = assessItem(stickerItem({
      contourSvg: null,
      bleedMm: null,
      contourAppliedAt: null,
    }), "order-1");
    expect(result.contourReady).toBe(false);
    expect(result.reasons.some((r: any) => r.code === "needs_contour")).toBe(true);
    expect(result.level).toBe(READINESS.NEEDS_INFO);
  });

  it("sticker with rectangular shape → manual review", () => {
    const result = assessItem(stickerItem({
      contourShapeType: "rectangular",
      contourConfidence: "rectangular",
    }), "order-1");
    expect(result.manualReviewRequired).toBe(true);
    expect(result.level).toBe(READINESS.NEEDS_INFO);
  });

  it("near-rectangular shape also triggers manual review", () => {
    const result = assessItem(stickerItem({
      contourShapeType: "near-rectangular",
      contourConfidence: "good",
    }), "order-1");
    expect(result.manualReviewRequired).toBe(true);
  });

  it("contour without contourSvg but with bleedMm → contourReady", () => {
    const result = assessItem(stickerItem({
      contourSvg: null,
      bleedMm: 3,
    }), "order-1");
    expect(result.contourReady).toBe(true);
  });
});

// ── R3: registrationMarkReady accepts both field names ────────────────────────

describe("readiness — registration marks", () => {
  it("contourAppliedAt → registration marks ready", () => {
    const result = assessItem(stickerItem({
      contourAppliedAt: "2026-03-10T12:00:00Z",
      contourToolJobAt: null,
    }), "order-1");
    expect(result.registrationMarkReady).toBe(true);
  });

  it("contourToolJobAt (legacy) → registration marks ready", () => {
    const result = assessItem(stickerItem({
      contourAppliedAt: null,
      contourToolJobAt: "2026-03-10T12:00:00Z",
    }), "order-1");
    expect(result.registrationMarkReady).toBe(true);
  });

  it("neither field → registration marks not ready", () => {
    const result = assessItem(stickerItem({
      contourAppliedAt: null,
      contourToolJobAt: null,
    }), "order-1");
    expect(result.registrationMarkReady).toBe(false);
  });
});

// ── R4: Non-sticker items ignore contour ──────────────────────────────────────

describe("readiness — non-sticker items", () => {
  it("banner with low confidence → no manual review", () => {
    const bannerItem = {
      ...stickerItem({ contourConfidence: "low" }),
      productName: "Vinyl Banner",
      productType: "banner",
    };
    const result = assessItem(bannerItem, "order-1");
    expect(result.isPrintAndCut).toBe(false);
    expect(result.manualReviewRequired).toBe(false);
  });
});

// ── R5: Task queue routes manual-review items ─────────────────────────────────

describe("readiness — task queue categorization", () => {
  it("manual-review sticker goes to contourReview bucket", () => {
    const order = {
      id: "order-review-1",
      priority: 2,
      tags: [],
      items: [stickerItem({ contourConfidence: "low" })],
    };
    const buckets = categorizeForTaskQueue([order]);
    expect(buckets.contourReview.length).toBe(1);
    expect(buckets.readyForProduction.length).toBe(0);
  });

  it("good-contour sticker goes to readyForProduction", () => {
    const order = {
      id: "order-ready-1",
      priority: 2,
      tags: [],
      items: [stickerItem()],
    };
    const buckets = categorizeForTaskQueue([order]);
    expect(buckets.contourReview.length).toBe(0);
    expect(buckets.readyForProduction.length).toBe(1);
  });

  it("no-contour sticker goes to contourReview bucket", () => {
    const order = {
      id: "order-no-contour-1",
      priority: 2,
      tags: [],
      items: [stickerItem({ contourSvg: null, bleedMm: null, contourAppliedAt: null })],
    };
    const buckets = categorizeForTaskQueue([order]);
    expect(buckets.contourReview.length).toBe(1);
  });
});
