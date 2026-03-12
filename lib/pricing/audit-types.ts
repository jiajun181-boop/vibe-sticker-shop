// lib/pricing/audit-types.ts
// ═══════════════════════════════════════════════════════════════════
// Stable audit contract for the Pricing Center / audit UI.
// Claude1 can import these enums/types directly.
// This file has ZERO runtime dependencies — pure types + string enums.
// ═══════════════════════════════════════════════════════════════════

// ── Pricing source classification ────────────────────────────────
// How a product gets its sell price today.
export const PricingSourceKind = {
  /** PricingPreset linked (QTY_TIERED, QTY_OPTIONS, AREA_TIERED, COST_PLUS) */
  PRESET: "PRESET",
  /** pricingConfig.fixedPrices table (outsourced products) */
  FIXED: "FIXED",
  /** Category → template-resolver (vinyl_print, board_sign, banner, etc.) */
  TEMPLATE: "TEMPLATE",
  /** Falls back to product.basePrice only (no preset, no template match) */
  LEGACY: "LEGACY",
  /** pricingUnit = "quote" — contact-us flow, no instant price */
  QUOTE_ONLY: "QUOTE_ONLY",
  /** No pricing source found — cannot generate a price */
  MISSING: "MISSING",
} as const;
export type PricingSourceKind = (typeof PricingSourceKind)[keyof typeof PricingSourceKind];

// ── Candidate cost template ──────────────────────────────────────
// Which factory equipment / workflow should price this product.
export const CandidateCostTemplate = {
  /** Epson wide-format: stickers, WWF, large-format vinyl */
  EPSON_WIDE_FORMAT: "EPSON_WIDE_FORMAT",
  /** Konica C6085 digital press: business cards, flyers, booklets */
  KONICA_C6085_PAPER: "KONICA_C6085_PAPER",
  /** Roll label press (future): BOPP, kraft, freezer labels */
  ROLL_LABEL: "ROLL_LABEL",
  /** Graphtec cutter: vinyl lettering, vehicle graphics */
  VEHICLE_VINYL: "VEHICLE_VINYL",
  /** Canvas stretcher workflow */
  CANVAS_STRETCH: "CANVAS_STRETCH",
  /** Board sign: Coroplast/PVC/Foam/Aluminum + vinyl face */
  BOARD_SIGN: "BOARD_SIGN",
  /** Banner/display: frontlit, mesh, retractable */
  BANNER_DISPLAY: "BANNER_DISPLAY",
  /** Poster: fixed-price table or paper print */
  POSTER: "POSTER",
  /** Stamps (self-inking, pre-inked, etc.) */
  STAMP: "STAMP",
  /** Cannot infer — needs manual assignment */
  UNKNOWN: "UNKNOWN",
} as const;
export type CandidateCostTemplate = (typeof CandidateCostTemplate)[keyof typeof CandidateCostTemplate];

// ── Completeness status ──────────────────────────────────────────
export const CompletenessStatus = {
  /** All required pricing fields present */
  COMPLETE: "COMPLETE",
  /** Has a price source but missing some cost data */
  PARTIAL: "PARTIAL",
  /** Cannot price at all */
  MISSING: "MISSING",
} as const;
export type CompletenessStatus = (typeof CompletenessStatus)[keyof typeof CompletenessStatus];

// ── Missing field codes ──────────────────────────────────────────
// Stable strings for machine consumption.
export const MissingFieldCode = {
  MISSING_PRICE_SOURCE: "missing_price_source",
  MISSING_MATERIAL_COST: "missing_material_cost",
  MISSING_BOARD_COST: "missing_board_cost",
  MISSING_OPTION_COST_MAPPING: "missing_option_cost_mapping",
  MISSING_READABLE_LEDGER: "missing_readable_ledger",
  MISSING_FLOOR_PRICE_POLICY: "missing_floor_price_policy",
  MISSING_TEMPLATE_ASSIGNMENT: "missing_template_assignment",
  MISSING_DISPLAY_FROM_PRICE: "missing_display_from_price",
  ZERO_BASE_PRICE: "zero_base_price",
  MISSING_VENDOR_COST: "missing_vendor_cost",
} as const;
export type MissingFieldCode = (typeof MissingFieldCode)[keyof typeof MissingFieldCode];

// ── Row-level audit output ───────────────────────────────────────
export interface ProductAuditRow {
  productId: string;
  slug: string;
  name: string;
  category: string;
  isActive: boolean;
  pricingSourceKind: PricingSourceKind;
  candidateCostTemplate: CandidateCostTemplate;
  completenessStatus: CompletenessStatus;
  missingFields: MissingFieldCode[];
  hasReadableLedger: boolean;
  hasFloorPolicy: boolean;
  optionImpactCoverage: "full" | "partial" | "none" | "n/a";
  vendorCostStatus: "covered" | "missing" | "n/a";
}

// ── Material gap ─────────────────────────────────────────────────
export interface MaterialGap {
  materialId: string;
  name: string;
  type: string;
  costPerSqft: number;
  rollCost: number;
  issue: "zero_cost" | "suspiciously_low" | "placeholder";
}

// ── Hardware gap ─────────────────────────────────────────────────
export interface HardwareGap {
  hardwareId: string;
  slug: string;
  name: string;
  category: string;
  priceCents: number;
  issue: "zero_price" | "suspiciously_low";
}

// ── Summary ──────────────────────────────────────────────────────
export interface PricingSourceBreakdown {
  preset: number;
  fixed: number;
  template: number;
  legacy: number;
  quoteOnly: number;
  missing: number;
}

export interface AuditSummary {
  activeProductCount: number;
  pricingSourceBreakdown: PricingSourceBreakdown;
  materialsWithZeroCost: number;
  suspiciousHardwarePrices: number;
  productsMissingPrice: number;
  productsMissingReadableCostModel: number;
  productsMissingDisplayFromPrice: number;
  productsMissingVendorCost: number;
}

// ── Template candidate grouping ──────────────────────────────────
export interface TemplateCandidateGroup {
  template: CandidateCostTemplate;
  label: string;
  productCount: number;
  slugs: string[];
}

// ── Full audit report ────────────────────────────────────────────
export interface PricingAuditReport {
  generatedAt: string;
  summary: AuditSummary;
  productRows: ProductAuditRow[];
  materialGaps: MaterialGap[];
  hardwareGaps: HardwareGap[];
  templateGroups: TemplateCandidateGroup[];
}
