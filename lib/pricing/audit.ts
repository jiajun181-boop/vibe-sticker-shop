// lib/pricing/audit.ts
// ═══════════════════════════════════════════════════════════════════
// Live pricing audit engine — read-only analysis of pricing data.
// Does NOT modify any prices. Does NOT import template-resolver or
// checkout code. Safe to run in parallel with Claude1's Pricing Center.
//
// Usage:
//   const report = buildAuditReport({ products, materials, hardware, presets });
// ═══════════════════════════════════════════════════════════════════

import {
  PricingSourceKind,
  CandidateCostTemplate,
  CompletenessStatus,
  MissingFieldCode,
  type ProductAuditRow,
  type MaterialGap,
  type HardwareGap,
  type AuditSummary,
  type PricingSourceBreakdown,
  type TemplateCandidateGroup,
  type PricingAuditReport,
} from "./audit-types";

// ── Input types (minimal DB shapes — no Prisma import) ───────────

export interface ProductInput {
  id: string;
  slug: string;
  name: string;
  category: string;
  isActive: boolean;
  basePrice: number;
  pricingUnit: string;
  pricingPresetId: string | null;
  pricingConfig: unknown;
  optionsConfig: unknown;
  displayFromPrice: number | null;
  minPrice: number | null;
}

export interface MaterialInput {
  id: string;
  name: string;
  type: string;
  costPerSqft: number;
  rollCost: number;
  isActive: boolean;
}

export interface HardwareInput {
  id: string;
  slug: string;
  name: string;
  category: string;
  priceCents: number;
  unit: string;
  isActive: boolean;
}

export interface PresetInput {
  id: string;
  key: string;
  name: string;
  model: string;
  isActive: boolean;
}

export interface AuditInput {
  products: ProductInput[];
  materials: MaterialInput[];
  hardware: HardwareInput[];
  presets: PresetInput[];
  /** Slugs of products that have at least one active VendorCost entry */
  vendorCostSlugs?: string[];
}

// ── Category → template mapping (mirrors template-resolver.js) ───
// Read-only copy — we don't import template-resolver to avoid coupling.
const CATEGORY_TEMPLATE_MAP: Record<string, string> = {
  "stickers-labels-decals": "vinyl_print",
  "signs-rigid-boards": "board_sign",
  "banners-displays": "banner",
  "marketing-business-print": "paper_print",
  "marketing-prints": "paper_print",
  "canvas-prints": "canvas",
  "vehicle-graphics-fleet": "vinyl_cut",
  "vehicle-branding-advertising": "vinyl_cut",
  "windows-walls-floors": "vinyl_print",
  "display-stands": "banner",
  "fleet-compliance-id": "vinyl_print",
  "safety-warning-decals": "vinyl_print",
  "facility-asset-labels": "vinyl_print",
  "packaging": "paper_print",
  "retail-promo": "paper_print",
  "large-format-graphics": "vinyl_print",
};

// ── Category → candidate cost template ───────────────────────────
const CATEGORY_TO_CANDIDATE: Record<string, CandidateCostTemplate> = {
  "stickers-labels-decals": CandidateCostTemplate.EPSON_WIDE_FORMAT,
  "signs-rigid-boards": CandidateCostTemplate.BOARD_SIGN,
  "banners-displays": CandidateCostTemplate.BANNER_DISPLAY,
  "marketing-business-print": CandidateCostTemplate.KONICA_C6085_PAPER,
  "marketing-prints": CandidateCostTemplate.KONICA_C6085_PAPER,
  "canvas-prints": CandidateCostTemplate.CANVAS_STRETCH,
  "vehicle-graphics-fleet": CandidateCostTemplate.VEHICLE_VINYL,
  "vehicle-branding-advertising": CandidateCostTemplate.VEHICLE_VINYL,
  "windows-walls-floors": CandidateCostTemplate.EPSON_WIDE_FORMAT,
  "display-stands": CandidateCostTemplate.BANNER_DISPLAY,
  "fleet-compliance-id": CandidateCostTemplate.EPSON_WIDE_FORMAT,
  "safety-warning-decals": CandidateCostTemplate.EPSON_WIDE_FORMAT,
  "facility-asset-labels": CandidateCostTemplate.EPSON_WIDE_FORMAT,
  "packaging": CandidateCostTemplate.KONICA_C6085_PAPER,
  "retail-promo": CandidateCostTemplate.KONICA_C6085_PAPER,
  "large-format-graphics": CandidateCostTemplate.EPSON_WIDE_FORMAT,
};

// ── Slug-level overrides for candidate template ──────────────────
const SLUG_CANDIDATE_OVERRIDE: Record<string, CandidateCostTemplate> = {
  "roll-labels": CandidateCostTemplate.ROLL_LABEL,
  "bopp-labels": CandidateCostTemplate.ROLL_LABEL,
  "freezer-labels": CandidateCostTemplate.ROLL_LABEL,
  "posters": CandidateCostTemplate.POSTER,
  "posters-standard": CandidateCostTemplate.POSTER,
  "posters-adhesive": CandidateCostTemplate.POSTER,
  "posters-backlit": CandidateCostTemplate.POSTER,
  "posters-outdoor": CandidateCostTemplate.POSTER,
  "self-inking-stamps": CandidateCostTemplate.STAMP,
  "pre-inked-stamps": CandidateCostTemplate.STAMP,
  "rubber-stamps": CandidateCostTemplate.STAMP,
};

// ── Classify pricing source ──────────────────────────────────────

export function classifyPricingSource(product: ProductInput): PricingSourceKind {
  // Quote-only products (vehicle wraps, custom requests)
  if (product.pricingUnit === "quote") {
    return PricingSourceKind.QUOTE_ONLY;
  }

  // Has a PricingPreset linked
  if (product.pricingPresetId) {
    return PricingSourceKind.PRESET;
  }

  // Has fixedPrices in pricingConfig (outsourced / fixed-table products)
  if (hasFixedPrices(product.pricingConfig)) {
    return PricingSourceKind.FIXED;
  }

  // Category maps to a template in template-resolver
  if (CATEGORY_TEMPLATE_MAP[product.category]) {
    return PricingSourceKind.TEMPLATE;
  }

  // Has a positive basePrice but no template route
  if (product.basePrice > 0) {
    return PricingSourceKind.LEGACY;
  }

  return PricingSourceKind.MISSING;
}

// ── Infer candidate cost template ────────────────────────────────

export function inferCandidateTemplate(product: ProductInput): CandidateCostTemplate {
  // Slug-level overrides first
  if (SLUG_CANDIDATE_OVERRIDE[product.slug]) {
    return SLUG_CANDIDATE_OVERRIDE[product.slug];
  }

  // Category-level mapping
  if (CATEGORY_TO_CANDIDATE[product.category]) {
    return CATEGORY_TO_CANDIDATE[product.category];
  }

  return CandidateCostTemplate.UNKNOWN;
}

// ── Derive completeness + missing fields ─────────────────────────

export function deriveCompleteness(
  product: ProductInput,
  sourceKind: PricingSourceKind
): { status: CompletenessStatus; missingFields: MissingFieldCode[] } {
  const missing: MissingFieldCode[] = [];

  // Everyone needs a price source
  if (sourceKind === PricingSourceKind.MISSING) {
    missing.push(MissingFieldCode.MISSING_PRICE_SOURCE);
  }

  // Zero basePrice on non-quote products is suspicious
  if (product.basePrice <= 0 && sourceKind !== PricingSourceKind.QUOTE_ONLY) {
    // Only flag if also no preset and no fixedPrices — truly zero
    if (!product.pricingPresetId && !hasFixedPrices(product.pricingConfig)) {
      missing.push(MissingFieldCode.ZERO_BASE_PRICE);
    }
  }

  // Template-based products need a category mapping
  if (sourceKind === PricingSourceKind.TEMPLATE || sourceKind === PricingSourceKind.MISSING) {
    if (!CATEGORY_TEMPLATE_MAP[product.category]) {
      missing.push(MissingFieldCode.MISSING_TEMPLATE_ASSIGNMENT);
    }
  }

  // displayFromPrice — needed for category page "From $X"
  if (product.displayFromPrice == null || product.displayFromPrice <= 0) {
    missing.push(MissingFieldCode.MISSING_DISPLAY_FROM_PRICE);
  }

  // Floor price policy — minPrice field
  if (product.minPrice == null || product.minPrice <= 0) {
    missing.push(MissingFieldCode.MISSING_FLOOR_PRICE_POLICY);
  }

  // Readable ledger — we check if the product CAN generate a ledger
  // (template-based or preset-based products should have ledger support)
  const canLedger =
    sourceKind === PricingSourceKind.TEMPLATE ||
    sourceKind === PricingSourceKind.PRESET ||
    sourceKind === PricingSourceKind.FIXED;
  if (!canLedger && sourceKind !== PricingSourceKind.QUOTE_ONLY) {
    missing.push(MissingFieldCode.MISSING_READABLE_LEDGER);
  }

  // Determine overall status
  let status: CompletenessStatus;
  if (missing.length === 0) {
    status = CompletenessStatus.COMPLETE;
  } else if (sourceKind === PricingSourceKind.MISSING) {
    status = CompletenessStatus.MISSING;
  } else {
    status = CompletenessStatus.PARTIAL;
  }

  return { status, missingFields: missing };
}

// ── Option impact coverage ───────────────────────────────────────

export function assessOptionCoverage(product: ProductInput): ProductAuditRow["optionImpactCoverage"] {
  const opts = parseJson(product.optionsConfig);
  if (!opts || typeof opts !== "object") return "n/a";

  const hasOptions =
    Array.isArray((opts as Record<string, unknown>).sizes) ||
    Array.isArray((opts as Record<string, unknown>).materials) ||
    Array.isArray((opts as Record<string, unknown>).finishings) ||
    Array.isArray((opts as Record<string, unknown>).quantities);

  if (!hasOptions) return "n/a";

  // If preset-based with QTY_OPTIONS, options are fully covered
  if (product.pricingPresetId) return "full";

  // If fixedPrices, check if all size keys have entries
  if (hasFixedPrices(product.pricingConfig)) {
    const cfg = parseJson(product.pricingConfig) as Record<string, unknown>;
    const fp = cfg?.fixedPrices as Record<string, unknown> | undefined;
    const sizes = (opts as Record<string, unknown>).sizes;
    if (fp && Array.isArray(sizes)) {
      const coveredKeys = Object.keys(fp);
      return sizes.length <= coveredKeys.length ? "full" : "partial";
    }
    return "partial";
  }

  // Template-based — options drive the formula inputs, so coverage is implicit
  if (CATEGORY_TEMPLATE_MAP[product.category]) return "full";

  return "none";
}

// ── Audit a single product ───────────────────────────────────────

export function auditProduct(
  product: ProductInput,
  vendorCostSlugsSet?: Set<string>
): ProductAuditRow {
  const sourceKind = classifyPricingSource(product);
  const candidateTemplate = inferCandidateTemplate(product);
  const { status, missingFields } = deriveCompleteness(product, sourceKind);
  const optionCoverage = assessOptionCoverage(product);

  // Determine vendor cost coverage status
  let vendorCostStatus: "covered" | "missing" | "n/a";
  if (sourceKind !== PricingSourceKind.FIXED) {
    vendorCostStatus = "n/a";
  } else if (vendorCostSlugsSet && vendorCostSlugsSet.has(product.slug)) {
    vendorCostStatus = "covered";
  } else if (vendorCostSlugsSet) {
    // We have vendor cost data but this slug isn't in it
    vendorCostStatus = "missing";
    missingFields.push(MissingFieldCode.MISSING_VENDOR_COST);
  } else {
    // No vendor cost data was provided — can't determine
    vendorCostStatus = "n/a";
  }

  const canLedger =
    sourceKind === PricingSourceKind.TEMPLATE ||
    sourceKind === PricingSourceKind.PRESET ||
    sourceKind === PricingSourceKind.FIXED;

  // Re-derive completeness status if we added MISSING_VENDOR_COST
  let finalStatus = status;
  if (
    vendorCostStatus === "missing" &&
    finalStatus === CompletenessStatus.COMPLETE
  ) {
    finalStatus = CompletenessStatus.PARTIAL;
  }

  return {
    productId: product.id,
    slug: product.slug,
    name: product.name,
    category: product.category,
    isActive: product.isActive,
    pricingSourceKind: sourceKind,
    candidateCostTemplate: candidateTemplate,
    completenessStatus: finalStatus,
    missingFields,
    hasReadableLedger: canLedger,
    hasFloorPolicy: product.minPrice != null && product.minPrice > 0,
    optionImpactCoverage: optionCoverage,
    vendorCostStatus,
  };
}

// ── Detect material gaps ─────────────────────────────────────────

export function detectMaterialGaps(materials: MaterialInput[]): MaterialGap[] {
  const gaps: MaterialGap[] = [];

  for (const m of materials) {
    if (!m.isActive) continue;

    // Placeholder names
    if (m.name === "New Material" || m.name.trim() === "") {
      gaps.push({
        materialId: m.id,
        name: m.name || "(empty)",
        type: m.type,
        costPerSqft: m.costPerSqft,
        rollCost: m.rollCost,
        issue: "placeholder",
      });
      continue;
    }

    // Zero cost
    if (m.costPerSqft <= 0 && m.rollCost <= 0) {
      gaps.push({
        materialId: m.id,
        name: m.name,
        type: m.type,
        costPerSqft: m.costPerSqft,
        rollCost: m.rollCost,
        issue: "zero_cost",
      });
      continue;
    }

    // Suspiciously low (< $0.05/sqft for real material)
    if (m.costPerSqft > 0 && m.costPerSqft < 0.05) {
      gaps.push({
        materialId: m.id,
        name: m.name,
        type: m.type,
        costPerSqft: m.costPerSqft,
        rollCost: m.rollCost,
        issue: "suspiciously_low",
      });
    }
  }

  return gaps;
}

// ── Detect hardware gaps ─────────────────────────────────────────

export function detectHardwareGaps(hardware: HardwareInput[]): HardwareGap[] {
  const gaps: HardwareGap[] = [];

  for (const h of hardware) {
    if (!h.isActive) continue;
    // Skip items with unit "included" — $0 is expected
    if (h.unit === "included") continue;

    if (h.priceCents <= 0) {
      gaps.push({
        hardwareId: h.id,
        slug: h.slug,
        name: h.name,
        category: h.category,
        priceCents: h.priceCents,
        issue: "zero_price",
      });
      continue;
    }

    // Suspiciously low (< $0.50 for non-included items)
    if (h.priceCents > 0 && h.priceCents < 50 && h.unit === "per_unit") {
      gaps.push({
        hardwareId: h.id,
        slug: h.slug,
        name: h.name,
        category: h.category,
        priceCents: h.priceCents,
        issue: "suspiciously_low",
      });
    }
  }

  return gaps;
}

// ── Build template candidate groups ──────────────────────────────

export function buildTemplateGroups(rows: ProductAuditRow[]): TemplateCandidateGroup[] {
  const TEMPLATE_LABELS: Record<string, string> = {
    EPSON_WIDE_FORMAT: "Epson Wide-Format (Stickers, WWF, Large Format)",
    KONICA_C6085_PAPER: "Konica C6085 Paper Print",
    ROLL_LABEL: "Roll Label Press",
    VEHICLE_VINYL: "Vehicle / Vinyl Cut (Graphtec)",
    CANVAS_STRETCH: "Canvas Stretcher",
    BOARD_SIGN: "Board Sign (Coroplast/PVC/Aluminum)",
    BANNER_DISPLAY: "Banner & Display",
    POSTER: "Poster (Fixed Table / Paper Print)",
    STAMP: "Stamps (Self-Inking / Pre-Inked)",
    UNKNOWN: "Unknown / Needs Assignment",
  };

  const map = new Map<CandidateCostTemplate, string[]>();

  for (const row of rows) {
    if (!row.isActive) continue;
    const slugs = map.get(row.candidateCostTemplate) || [];
    slugs.push(row.slug);
    map.set(row.candidateCostTemplate, slugs);
  }

  const groups: TemplateCandidateGroup[] = [];
  for (const [template, slugs] of map) {
    groups.push({
      template,
      label: TEMPLATE_LABELS[template] || template,
      productCount: slugs.length,
      slugs: slugs.sort(),
    });
  }

  // Sort: UNKNOWN last, then by product count descending
  groups.sort((a, b) => {
    if (a.template === CandidateCostTemplate.UNKNOWN) return 1;
    if (b.template === CandidateCostTemplate.UNKNOWN) return -1;
    return b.productCount - a.productCount;
  });

  return groups;
}

// ── Build full audit report ──────────────────────────────────────

export function buildAuditReport(input: AuditInput): PricingAuditReport {
  // Only audit active products
  const activeProducts = input.products.filter((p) => p.isActive);

  // Build vendor cost slugs set if provided
  const vendorCostSlugsSet = input.vendorCostSlugs
    ? new Set(input.vendorCostSlugs)
    : undefined;

  // Audit each product
  const productRows = activeProducts.map((p) => auditProduct(p, vendorCostSlugsSet));

  // Build summary
  const breakdown: PricingSourceBreakdown = {
    preset: 0,
    fixed: 0,
    template: 0,
    legacy: 0,
    quoteOnly: 0,
    missing: 0,
  };

  for (const row of productRows) {
    switch (row.pricingSourceKind) {
      case PricingSourceKind.PRESET:
        breakdown.preset++;
        break;
      case PricingSourceKind.FIXED:
        breakdown.fixed++;
        break;
      case PricingSourceKind.TEMPLATE:
        breakdown.template++;
        break;
      case PricingSourceKind.LEGACY:
        breakdown.legacy++;
        break;
      case PricingSourceKind.QUOTE_ONLY:
        breakdown.quoteOnly++;
        break;
      case PricingSourceKind.MISSING:
        breakdown.missing++;
        break;
    }
  }

  const materialGaps = detectMaterialGaps(input.materials);
  const hardwareGaps = detectHardwareGaps(input.hardware);

  const summary: AuditSummary = {
    activeProductCount: activeProducts.length,
    pricingSourceBreakdown: breakdown,
    materialsWithZeroCost: materialGaps.filter(
      (g) => g.issue === "zero_cost" || g.issue === "placeholder"
    ).length,
    suspiciousHardwarePrices: hardwareGaps.length,
    productsMissingPrice: breakdown.missing,
    productsMissingReadableCostModel: productRows.filter((r) => !r.hasReadableLedger).length,
    productsMissingDisplayFromPrice: productRows.filter((r) =>
      r.missingFields.includes(MissingFieldCode.MISSING_DISPLAY_FROM_PRICE)
    ).length,
    productsMissingVendorCost: productRows.filter(
      (r) => r.vendorCostStatus === "missing"
    ).length,
  };

  const templateGroups = buildTemplateGroups(productRows);

  return {
    generatedAt: new Date().toISOString(),
    summary,
    productRows,
    materialGaps,
    hardwareGaps,
    templateGroups,
  };
}

// ── Helpers ──────────────────────────────────────────────────────

function hasFixedPrices(pricingConfig: unknown): boolean {
  const cfg = parseJson(pricingConfig);
  if (!cfg || typeof cfg !== "object") return false;
  const fp = (cfg as Record<string, unknown>).fixedPrices;
  return !!fp && typeof fp === "object" && Object.keys(fp as object).length > 0;
}

function parseJson(val: unknown): unknown {
  if (val == null) return null;
  if (typeof val === "object") return val;
  if (typeof val === "string") {
    try {
      return JSON.parse(val);
    } catch {
      return null;
    }
  }
  return null;
}
