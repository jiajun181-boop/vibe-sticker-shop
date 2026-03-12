// lib/pricing/pricing-permissions.ts
// ═══════════════════════════════════════════════════════════════════
// Pricing-specific permission layer — builds on existing RBAC.
// Does NOT replace admin-permissions.js; adds granular pricing tiers.
//
// Sub-task 3: Approval Mechanism + Permission Tiers
//
// Pricing tiers:
//   viewer   — can see prices and audit data
//   simulator — can run quote simulations (but not save changes)
//   operator — can edit prices (within drift guardrails)
//   manager  — can approve sensitive changes (>20% drift, bulk)
//   owner    — can override any pricing, bypass approval
// ═══════════════════════════════════════════════════════════════════

export const PricingTier = {
  VIEWER: "viewer",
  SIMULATOR: "simulator",
  OPERATOR: "operator",
  MANAGER: "manager",
  OWNER: "owner",
} as const;
export type PricingTier = (typeof PricingTier)[keyof typeof PricingTier];

const TIER_LEVEL: Record<PricingTier, number> = {
  viewer: 1,
  simulator: 2,
  operator: 3,
  manager: 4,
  owner: 5,
};

/**
 * Map AdminRole → PricingTier.
 * This is the RBAC-to-pricing bridge.
 */
const ROLE_PRICING_TIER: Record<string, PricingTier> = {
  admin: PricingTier.OWNER,
  merch_ops: PricingTier.OPERATOR,
  sales: PricingTier.SIMULATOR,
  finance: PricingTier.VIEWER,
  cs: PricingTier.VIEWER,
  design: PricingTier.VIEWER,
  production: PricingTier.VIEWER,
  qa: PricingTier.VIEWER,
};

/**
 * Get the pricing tier for an admin role.
 */
export function getPricingTier(role: string): PricingTier {
  return ROLE_PRICING_TIER[role] || PricingTier.VIEWER;
}

/**
 * Check if a role has at least the given pricing tier.
 */
export function hasPricingTier(role: string, requiredTier: PricingTier): boolean {
  const userTier = getPricingTier(role);
  return TIER_LEVEL[userTier] >= TIER_LEVEL[requiredTier];
}

// ── Action-level permission checks ──────────────────────────────

/**
 * Can this role view pricing data, audit reports, and change history?
 */
export function canViewPricing(role: string): boolean {
  return hasPricingTier(role, PricingTier.VIEWER);
}

/**
 * Can this role run quote simulations and save snapshots?
 */
export function canSimulateQuotes(role: string): boolean {
  return hasPricingTier(role, PricingTier.SIMULATOR);
}

/**
 * Can this role directly edit prices (materials, presets, configs)?
 */
export function canEditPricing(role: string): boolean {
  return hasPricingTier(role, PricingTier.OPERATOR);
}

/**
 * Can this role approve pricing changes that exceed drift thresholds?
 */
export function canApprovePricing(role: string): boolean {
  return hasPricingTier(role, PricingTier.MANAGER);
}

/**
 * Can this role bypass approval for any pricing change?
 */
export function canOverridePricing(role: string): boolean {
  return hasPricingTier(role, PricingTier.OWNER);
}

// ── Approval requirement logic ──────────────────────────────────

export interface ApprovalRequirement {
  requiresApproval: boolean;
  reason?: string;
  requiredTier: PricingTier;
}

/**
 * Determine if a pricing change requires approval.
 */
export function checkApprovalRequired(params: {
  operatorRole: string;
  changeType: string;
  driftPct?: number | null;
  affectedCount?: number;
  isBulk?: boolean;
}): ApprovalRequirement {
  const tier = getPricingTier(params.operatorRole);

  // Owner bypasses all approval
  if (tier === PricingTier.OWNER) {
    return { requiresApproval: false, requiredTier: PricingTier.OWNER };
  }

  // Bulk updates always require manager approval
  if (params.isBulk || (params.affectedCount && params.affectedCount > 10)) {
    return {
      requiresApproval: true,
      reason: `Bulk change affecting ${params.affectedCount || "many"} items`,
      requiredTier: PricingTier.MANAGER,
    };
  }

  // High drift (>20%) requires manager approval
  if (params.driftPct != null && Math.abs(params.driftPct) > 20) {
    return {
      requiresApproval: true,
      reason: `Price drift ${params.driftPct.toFixed(1)}% exceeds 20% threshold`,
      requiredTier: PricingTier.MANAGER,
    };
  }

  // B2B discount / delete and vendor cost changes require at least manager
  const MANAGER_CHANGE_TYPES = [
    "b2b_discount",
    "b2b_delete",
    "margin_override",
    "vendor_cost_create",
    "vendor_cost_update",
    "vendor_cost_delete",
    "preset_config_edit",
    "preset_delete",
    "preset_assign",
    "bulk_adjust",
    "bulk_rollback",
    "formula_edit",
    "ink_settings_edit",
    "material_cost_edit",
    "hardware_price_edit",
    "remediation_backfill",
  ];
  if (MANAGER_CHANGE_TYPES.includes(params.changeType)) {
    return {
      requiresApproval: true,
      reason: `${params.changeType} requires manager approval`,
      requiredTier: PricingTier.MANAGER,
    };
  }

  // Operator-level changes within guardrails don't need approval
  if (TIER_LEVEL[tier] >= TIER_LEVEL[PricingTier.OPERATOR]) {
    return { requiresApproval: false, requiredTier: PricingTier.OPERATOR };
  }

  // Below operator level — always requires approval
  return {
    requiresApproval: true,
    reason: "Insufficient pricing tier",
    requiredTier: PricingTier.OPERATOR,
  };
}

// ── Labels for UI ──────────────────────────────────────────────

export const PRICING_TIER_LABELS: Record<PricingTier, { en: string; zh: string }> = {
  viewer: { en: "Viewer", zh: "查看" },
  simulator: { en: "Simulator", zh: "模拟" },
  operator: { en: "Operator", zh: "操作" },
  manager: { en: "Manager", zh: "审批" },
  owner: { en: "Owner", zh: "所有者" },
};
