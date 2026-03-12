// lib/pricing/floor-price.js
// ═══════════════════════════════════════════════════════════════════
// Floor Price Policy Resolver
//
// Default formula:
//   floorPrice = max(totalCost + minFixedProfit, totalCost / (1 - minMarginRate))
//
// Priority (highest → lowest):
//   1. product.pricingConfig.floorPolicy   (product override)
//   2. Setting: floor_policy_template_{t}   (template override)
//   3. Setting: floor_policy_global         (global setting)
//   4. FLOOR_DEFAULTS                       (hardcoded fallback)
// ═══════════════════════════════════════════════════════════════════

import { prisma } from "@/lib/prisma";

export const FLOOR_DEFAULTS = Object.freeze({
  minFixedProfitCents: 500, // $5.00
  minMarginRate: 0.15,      // 15%
});

/**
 * Pure computation: floor price from cost + policy params.
 * @param {number} totalCostCents
 * @param {{ minFixedProfitCents?: number, minMarginRate?: number }} policy
 * @returns {number} floor price in cents
 */
export function computeFloorPrice(totalCostCents, policy) {
  if (!Number.isFinite(totalCostCents) || totalCostCents <= 0) return 0;

  const fixedProfit = Number(policy?.minFixedProfitCents ?? FLOOR_DEFAULTS.minFixedProfitCents);
  const marginRate = Number(policy?.minMarginRate ?? FLOOR_DEFAULTS.minMarginRate);

  const floorFromFixed = totalCostCents + fixedProfit;
  const floorFromMargin =
    marginRate > 0 && marginRate < 1
      ? Math.ceil(totalCostCents / (1 - marginRate))
      : totalCostCents;

  return Math.max(floorFromFixed, floorFromMargin);
}

/**
 * Load all floor_policy_* settings in one query.
 * @returns {Promise<Record<string, object>>}
 */
export async function loadFloorSettings() {
  try {
    const rows = await prisma.setting.findMany({
      where: { key: { startsWith: "floor_policy_" } },
    });
    const map = {};
    for (const row of rows) {
      map[row.key] = typeof row.value === "string" ? JSON.parse(row.value) : row.value;
    }
    return map;
  } catch {
    return {};
  }
}

function parseJsonSafe(val) {
  if (!val) return null;
  if (typeof val === "object") return val;
  try { return JSON.parse(val); } catch { return null; }
}

function parsePricingConfig(product) {
  return parseJsonSafe(product?.pricingConfig);
}

function formatPolicyDetail(source, label, policy) {
  const fp = (policy?.minFixedProfitCents ?? FLOOR_DEFAULTS.minFixedProfitCents) / 100;
  const mr = ((policy?.minMarginRate ?? FLOOR_DEFAULTS.minMarginRate) * 100).toFixed(0);
  return `${label}: min profit $${fp.toFixed(2)}, min margin ${mr}%`;
}

/**
 * Resolve floor price for a product using priority chain.
 *
 * @param {number} totalCostCents
 * @param {object} product
 * @param {string|null} templateName
 * @param {Record<string, object>|null} preloadedSettings — pass to skip DB query
 * @returns {Promise<{ priceCents: number, policySource: string, policyDetail: string }>}
 */
export async function resolveFloorPrice(totalCostCents, product, templateName, preloadedSettings) {
  if (!Number.isFinite(totalCostCents) || totalCostCents <= 0) {
    return {
      priceCents: 0,
      policySource: "none",
      policyDetail: "No cost data — cannot compute floor price",
    };
  }

  // 1. Product-level override
  const cfg = parsePricingConfig(product);
  if (cfg?.floorPolicy) {
    return {
      priceCents: computeFloorPrice(totalCostCents, cfg.floorPolicy),
      policySource: "product",
      policyDetail: formatPolicyDetail("product", "Product override", cfg.floorPolicy),
    };
  }

  // Load settings (once) if not provided
  const settings = preloadedSettings ?? await loadFloorSettings();

  // 2. Template-level override
  if (templateName) {
    const tpl = settings[`floor_policy_template_${templateName}`];
    if (tpl) {
      const policy = parseJsonSafe(tpl) || tpl;
      return {
        priceCents: computeFloorPrice(totalCostCents, policy),
        policySource: "template",
        policyDetail: formatPolicyDetail("template", `Template "${templateName}"`, policy),
      };
    }
  }

  // 3. Global setting
  const global = settings["floor_policy_global"];
  if (global) {
    const policy = parseJsonSafe(global) || global;
    return {
      priceCents: computeFloorPrice(totalCostCents, policy),
      policySource: "global",
      policyDetail: formatPolicyDetail("global", "Global setting", policy),
    };
  }

  // 4. Hardcoded defaults
  return {
    priceCents: computeFloorPrice(totalCostCents, FLOOR_DEFAULTS),
    policySource: "global",
    policyDetail: formatPolicyDetail("global", "Default", FLOOR_DEFAULTS),
  };
}
