/**
 * Role-Based Access Control (RBAC) permission matrix.
 *
 * Modules map to admin UI sections. Actions: view | edit | approve | admin
 *
 * Roles:
 *   admin       - Full cross-module access + system config
 *   cs          - Customer Service: orders (view/notes), customers, after-sales
 *   merch_ops   - E-commerce Ops: products, pricing (bounded), coupons, CMS
 *   design      - Design/Media: assets, templates, alt text
 *   production  - Production: factory assignment, status, SLA
 *   sales       - Sales/B2B: quotes, B2B accounts, enterprise discounts
 *   finance     - Finance: revenue, refunds, exports, tax reports
 *   qa          - QA/After-sales: defect tracking, reprint approval
 */

const LEVELS = { view: 1, edit: 2, approve: 3, admin: 4 };

/**
 * Permission matrix: role -> module -> max action level
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
    users: "admin",
    tools: "admin",
    support: "admin",
    shipping: "admin",
    inventory: "admin",
  },

  cs: {
    dashboard: "view",
    orders: "edit",
    customers: "view",
    b2b: "view",
    support: "edit",
    shipping: "view",
    logs: "view",
  },

  merch_ops: {
    dashboard: "view",
    products: "edit",
    catalog: "edit",
    pricing: "edit",
    coupons: "edit",
    content: "edit",
    analytics: "view",
    media: "edit",
    reports: "view",
    tools: "edit",
  },

  design: {
    dashboard: "view",
    media: "edit",
    products: "view",
    tools: "edit",
  },

  production: {
    dashboard: "view",
    orders: "view",
    production: "edit",
    factories: "edit",
    shipping: "edit",
    inventory: "view",
    reports: "view",
    tools: "view",
  },

  sales: {
    dashboard: "view",
    orders: "view",
    customers: "view",
    b2b: "edit",
    pricing: "view",
    analytics: "view",
    reports: "view",
  },

  finance: {
    dashboard: "view",
    orders: "view",
    customers: "view",
    analytics: "view",
    reports: "view",
    coupons: "view",
    settings: "view",
    logs: "view",
  },

  qa: {
    dashboard: "view",
    orders: "edit",
    production: "edit",
    reports: "view",
  },
};

export function hasPermission(role, module, action = "view") {
  const rolePerms = PERMISSION_MATRIX[role];
  if (!rolePerms) return false;

  const maxAction = rolePerms[module];
  if (!maxAction) return false;

  return LEVELS[maxAction] >= LEVELS[action];
}

export function getAccessibleModules(role) {
  const rolePerms = PERMISSION_MATRIX[role];
  if (!rolePerms) return [];
  return Object.keys(rolePerms);
}

export function getPermissionLevel(role, module) {
  return PERMISSION_MATRIX[role]?.[module] || null;
}

/**
 * Map of module -> admin nav href for filtering sidebar.
 */
export const MODULE_NAV_MAP = {
  dashboard: ["/admin"],
  orders: ["/admin/orders", "/admin/orders/missing-artwork", "/admin/quotes", "/admin/shipping", "/admin/messages", "/admin/support"],
  customers: ["/admin/customers"],
  b2b: ["/admin/b2b", "/admin/api-keys"],
  products: ["/admin/products", "/admin/catalog-ops", "/admin/image-dashboard", "/admin/inventory"],
  catalog: ["/admin/catalog", "/admin/catalog-ops"],
  pricing: ["/admin/pricing", "/admin/catalog-ops", "/admin/materials", "/admin/materials-handbook", "/admin/pricing-dashboard"],
  coupons: ["/admin/coupons"],
  production: ["/admin/production", "/admin/qc", "/admin/shipping", "/admin/inventory"],
  factories: ["/admin/factories"],
  analytics: ["/admin/analytics", "/admin/finance", "/admin/funnel"],
  reports: ["/admin/reports/sales", "/admin/reports/production"],
  media: ["/admin/media", "/admin/image-dashboard"],
  content: ["/admin/content", "/admin/reviews", "/admin/marketing-calendar"],
  settings: ["/admin/settings"],
  logs: ["/admin/logs"],
  users: ["/admin/users"],
  tools: ["/admin/tools", "/admin/tools/contour", "/admin/tools/proof", "/admin/tools/stamp-studio", "/admin/workstation"],
  support: ["/admin/support", "/admin/messages"],
  shipping: ["/admin/shipping"],
  inventory: ["/admin/inventory"],
};

export function getAllowedNavHrefs(role) {
  const modules = getAccessibleModules(role);
  const hrefs = new Set();
  for (const mod of modules) {
    const paths = MODULE_NAV_MAP[mod];
    if (paths) paths.forEach((p) => hrefs.add(p));
  }
  return hrefs;
}

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
