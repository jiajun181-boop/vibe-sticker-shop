// lib/pricing/pricing-contract.d.ts
// Type declarations for pricing-contract.js
// Allows TypeScript callers to import any exported function.

export function emptyCost(): Record<string, number>;

export function sumCostBuckets(c: Record<string, number>): number;

export function detectSourceKind(
  result: Record<string, unknown> | null,
  product: Record<string, unknown> | null
): string;

export function extractCostBuckets(
  sourceKind: string,
  templateResult: Record<string, unknown> | null,
  quoteResult: Record<string, unknown> | null
): Record<string, number>;

export function computeProfit(
  sellTotalCents: number,
  totalCostCents: number
): { amountCents: number; rate: number };

export function buildExplanation(
  sourceKind: string,
  result: Record<string, unknown>,
  product: Record<string, unknown>,
  contractCtx?: Record<string, unknown>
): string;

export function buildSalesExplanation(
  contract: Record<string, unknown>
): string;

export function computeCompleteness(
  sourceKind: string,
  costBuckets: Record<string, number>,
  product: Record<string, unknown>
): { score: number; missing: string[]; warnings: string[] };

export function getDefaultInput(product: {
  slug?: string;
  category?: string;
  pricingUnit?: string;
  pricingConfig?: unknown;
  optionsConfig?: unknown;
}): Record<string, unknown>;

export function buildPricingContract(
  product: Record<string, unknown>,
  input: Record<string, unknown>,
  options?: {
    floorSettings?: unknown;
    b2b?: {
      userId?: string;
      companyName?: string;
      partnerTier?: string;
    };
  }
): Promise<{
  product: {
    id: string | null;
    slug: string | null;
    name: string | null;
    category: string | null;
    pricingUnit: string | null;
    isActive: boolean;
  };
  source: {
    kind: string;
    template: string | null;
    presetKey: string | null;
    presetModel: string | null;
    explanation: string;
  };
  sellPrice: {
    totalCents: number;
    unitCents: number;
    currency: string;
  };
  cost: Record<string, number>;
  totalCost: number;
  profit: {
    amountCents: number;
    rate: number;
  };
  floor: Record<string, unknown>;
  vendorCost: {
    vendorName: string;
    unitCostCents: number;
    setupFeeCents: number;
    shippingCents: number;
    totalForQty: number;
  } | null;
  b2bAdjustment: {
    retailPriceCents: number;
    adjustedPriceCents: number;
    discountCents: number;
    appliedRule: { ruleType: string; value: number; id: string; note?: string | null };
    adjustedProfit: { amountCents: number; rate: number };
  } | null;
  completeness: {
    score: number;
    missing: string[];
    warnings: string[];
  };
  quoteLedger: unknown;
  [key: string]: unknown;
}>;
