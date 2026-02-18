/**
 * Role-Based Access Control (RBAC) permission matrix.
 *
 * Modules map to admin UI sections. Actions: view | edit | approve | admin
 *
 * Roles:
 *   admin       – Full cross-module access + system config
 *   cs          – Customer Service: orders (view/notes), customers, after-sales
 *   merch_ops   – E-commerce Ops: products, pricing (bounded), coupons, CMS
 *   design      – Design/Media: assets, templates, alt text
 *   production  – Production: factory assignment, status, SLA
 *   sales       – Sales/B2B: quotes, B2B accounts, enterprise discounts
 *   finance     – Finance: revenue, refunds, exports, tax reports
 *   qa          – QA/After-sales: defect tracking, reprint approval
 */

// Permission levels (higher includes lower)
const LEVELS = { view: 1, edit: 2, approve: 3, admin: 4 };

/**
 * Permission matrix: role → module → max action level
 * If a module is absent for a role, access is denied entirely.
 */
export const PERMISSION_MATRIX = {
  admin: {
    dashboard: "admin",
    orders: "admin",
    customers: "admin",
    products: "admin",
    catalog: "admin",
    pricing: "admin",
    coupons: "admin",
    production: "admin",
    factories: "admin",
    analytics: "admin",
    reports: "admin",
    media: "admin",
    content: "admin",
    settings: "admin",
    logs: "admin",
    b2b: "admin",
    users: "admin",   // Admin user management
  },

  cs: {
    dashboard: "view",
    orders: "edit",       // View orders, add notes, edit shipping info
    customers: "view",    // View customer history
    b2b: "view",
    logs: "view",
  },

  merch_ops: {
    dashboard: "view",
    products: "edit",     // On/off, tags, categories, sort order
    catalog: "edit",      // Homepage/category config
    pricing: "edit",      // Adjust prices within range
    coupons: "edit",      // Create/manage coupons
    content: "edit",      // Promo bar, FAQ, homepage text
    analytics: "view",
    media: "edit",        // Upload images for products
    reports: "view",
  },

  design: {
    dashboard: "view",
    media: "edit",        // Upload, replace, crop, alt text, asset library
    products: "view",     // View products (to see which images they need)
  },

  production: {
    dashboard: "view",
    orders: "view",       // View orders for context
    production: "edit",   // Assign factory, set status, priority, ETA
    factories: "edit",    // Manage factories
    reports: "view",      // Production reports
  },

  sales: {
    dashboard: "view",
    orders: "view",       // View orders for follow-up
    customers: "view",
    b2b: "edit",          // Manage B2B accounts, quotes, enterprise discounts
    pricing: "view",      // View pricing (no edit)
    analytics: "view",
    reports: "view",
  },

  finance: {
    dashboard: "view",
    orders: "view",       // View orders for revenue tracking
    customers: "view",
    analytics: "view",
    reports: "view",      // Sales + production reports
    coupons: "view",      // View discount usage
    settings: "view",     // View tax/shipping config
    logs: "view",
  },

  qa: {
    dashboard: "view",
    orders: "edit",       // Add QA notes, flag defects
    production: "edit",   // Mark defects, approve reprints
    reports: "view",
  },
};

/**
 * Check if a role has sufficient permission for a module + action.
 * @param {string} role - AdminRole value (e.g., "admin", "cs")
 * @param {string} module - Module name (e.g., "orders", "products")
 * @param {string} action - Required action level ("view" | "edit" | "approve" | "admin")
 * @returns {boolean}
 */
export function hasPermission(role, module, action = "view") {
  const rolePerms = PERMISSION_MATRIX[role];
  if (!rolePerms) return false;

  const maxAction = rolePerms[module];
  if (!maxAction) return false;

  return LEVELS[maxAction] >= LEVELS[action];
}

/**
 * Get all modules a role can access (at any level).
 * @param {string} role
 * @returns {string[]}
 */
export function getAccessibleModules(role) {
  const rolePerms = PERMISSION_MATRIX[role];
  if (!rolePerms) return [];
  return Object.keys(rolePerms);
}

/**
 * Get the permission level for a specific module.
 * @param {string} role
 * @param {string} module
 * @returns {string|null} - "view" | "edit" | "approve" | "admin" | null
 */
export function getPermissionLevel(role, module) {
  return PERMISSION_MATRIX[role]?.[module] || null;
}

/**
 * Map of module → admin nav href for filtering sidebar.
 */
export const MODULE_NAV_MAP = {
  dashboard: ["/admin"],
  orders: ["/admin/orders"],
  customers: ["/admin/customers"],
  b2b: ["/admin/b2b"],
  products: ["/admin/products", "/admin/catalog-ops"],
  catalog: ["/admin/catalog", "/admin/catalog-ops"],
  pricing: ["/admin/pricing", "/admin/catalog-ops", "/admin/materials"],
  coupons: ["/admin/coupons"],
  production: ["/admin/production", "/admin/qc"],
  factories: ["/admin/factories"],
  analytics: ["/admin/analytics"],
  reports: ["/admin/reports/sales", "/admin/reports/production"],
  media: ["/admin/media"],
  content: ["/admin/content"],
  settings: ["/admin/settings"],
  logs: ["/admin/logs"],
  users: ["/admin/users"],
};

/**
 * Get all allowed nav hrefs for a role.
 * @param {string} role
 * @returns {Set<string>}
 */
export function getAllowedNavHrefs(role) {
  const modules = getAccessibleModules(role);
  const hrefs = new Set();
  for (const mod of modules) {
    const paths = MODULE_NAV_MAP[mod];
    if (paths) paths.forEach((p) => hrefs.add(p));
  }
  return hrefs;
}

/** Human-readable role labels */
export const ROLE_LABELS = {
  admin: { en: "Administrator", zh: "管理员" },
  cs: { en: "Customer Service", zh: "客服" },
  merch_ops: { en: "E-commerce Ops", zh: "电商运营" },
  design: { en: "Design & Media", zh: "设计与素材" },
  production: { en: "Production", zh: "生产调度" },
  sales: { en: "Sales / B2B", zh: "销售/B2B" },
  finance: { en: "Finance", zh: "财务" },
  qa: { en: "QA / After-sales", zh: "质检/售后" },
};

export const ALL_ROLES = Object.keys(ROLE_LABELS);
