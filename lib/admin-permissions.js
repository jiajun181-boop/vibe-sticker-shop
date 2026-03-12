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
    finance: "admin",
    reports: "admin",
    media: "admin",
    content: "admin",
    settings: "admin",
    logs: "admin",
    apiKeys: "admin",
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
    orders: "view",
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
    finance: "view",
    reports: "view",
  },

  finance: {
    dashboard: "view",
    orders: "view",
    customers: "view",
    analytics: "view",
    finance: "edit",
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
  dashboard: ["/admin", "/admin/workstation"],
  orders: ["/admin/orders", "/admin/orders/missing-artwork", "/admin/orders/shipping", "/admin/quotes", "/admin/shipping"],
  customers: ["/admin/customers", "/admin/customers/messages", "/admin/customers/support", "/admin/customers/b2b"],
  b2b: ["/admin/customers/b2b", "/admin/b2b"],
  products: ["/admin/products", "/admin/catalog-ops", "/admin/image-dashboard", "/admin/inventory"],
  catalog: ["/admin/catalog", "/admin/catalog-ops"],
  pricing: ["/admin/pricing", "/admin/catalog-ops", "/admin/materials", "/admin/materials-handbook"],
  coupons: ["/admin/coupons"],
  production: ["/admin/production", "/admin/production/board", "/admin/production/schedule", "/admin/production/rules", "/admin/qc", "/admin/orders/shipping", "/admin/shipping", "/admin/inventory"],
  factories: ["/admin/factories"],
  analytics: ["/admin/analytics", "/admin/funnel"],
  finance: ["/admin/finance"],
  reports: ["/admin/reports/sales", "/admin/reports/production"],
  media: ["/admin/media", "/admin/image-dashboard"],
  content: ["/admin/content", "/admin/reviews", "/admin/marketing-calendar"],
  settings: ["/admin/settings"],
  logs: ["/admin/logs"],
  apiKeys: ["/admin/api-keys"],
  users: ["/admin/users"],
  tools: ["/admin/tools", "/admin/tools/contour", "/admin/tools/proof", "/admin/tools/stamp-studio"],
  support: ["/admin/customers/support", "/admin/customers/messages", "/admin/support", "/admin/messages"],
  shipping: ["/admin/orders/shipping", "/admin/shipping"],
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

function normalizeAdminPath(pathname = "/") {
  const normalized = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return normalized.replace(/^\/zh(?=\/|$)/, "") || "/";
}

const PAGE_ACCESS_RULES = [
  { prefix: "/admin/workstation", module: "dashboard", action: "view" },
  { prefix: "/admin/orders/create", module: "orders", action: "edit" },
  { prefix: "/admin/orders/shipping", module: "orders", action: "view" },
  { prefix: "/admin/orders", module: "orders", action: "view" },
  { prefix: "/admin/shipping", module: "orders", action: "view" },
  { prefix: "/admin/production", module: "production", action: "view" },
  { prefix: "/admin/qc", module: "production", action: "view" },
  { prefix: "/admin/factories", module: "factories", action: "view" },
  { prefix: "/admin/customers/b2b", module: "b2b", action: "view" },
  { prefix: "/admin/customers/messages", module: "support", action: "view" },
  { prefix: "/admin/customers/support", module: "support", action: "view" },
  { prefix: "/admin/customers", module: "customers", action: "view" },
  { prefix: "/admin/b2b", module: "b2b", action: "view" },
  { prefix: "/admin/messages", module: "support", action: "view" },
  { prefix: "/admin/support", module: "support", action: "view" },
  { prefix: "/admin/reviews", module: "content", action: "view" },
  { prefix: "/admin/products", module: "products", action: "view" },
  { prefix: "/admin/catalog-ops", module: "products", action: "view" },
  { prefix: "/admin/catalog", module: "catalog", action: "view" },
  { prefix: "/admin/pricing-dashboard", module: "pricing", action: "view" },
  { prefix: "/admin/pricing", module: "pricing", action: "view" },
  { prefix: "/admin/materials-handbook", module: "pricing", action: "view" },
  { prefix: "/admin/materials", module: "pricing", action: "view" },
  { prefix: "/admin/media", module: "media", action: "view" },
  { prefix: "/admin/image-dashboard", module: "media", action: "view" },
  { prefix: "/admin/coupons", module: "coupons", action: "view" },
  { prefix: "/admin/inventory", module: "inventory", action: "view" },
  { prefix: "/admin/content", module: "content", action: "view" },
  { prefix: "/admin/marketing-calendar", module: "content", action: "view" },
  { prefix: "/admin/tools", module: "tools", action: "view" },
  { prefix: "/admin/analytics", module: "analytics", action: "view" },
  { prefix: "/admin/funnel", module: "analytics", action: "view" },
  { prefix: "/admin/reports", module: "reports", action: "view" },
  { prefix: "/admin/finance", module: "finance", action: "view" },
  { prefix: "/admin/users", module: "users", action: "view" },
  { prefix: "/admin/api-keys", module: "apiKeys", action: "view" },
  { prefix: "/admin/logs", module: "logs", action: "view" },
  { prefix: "/admin/settings", module: "settings", action: "view" },
];

export function canAccessAdminPage(role, pathname) {
  if (!role) return false;
  if (role === "admin") return true;

  const normalized = normalizeAdminPath(pathname);
  if (normalized === "/admin/login") return true;
  if (normalized === "/admin") return false;

  const rule = PAGE_ACCESS_RULES.find((entry) => normalized.startsWith(entry.prefix));
  if (!rule) return false;

  return hasPermission(role, rule.module, rule.action || "view");
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
