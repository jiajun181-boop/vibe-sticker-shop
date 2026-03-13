/**
 * Canonical order lifecycle views.
 *
 * Each view defines:
 *   id         — URL query value (?view=X) and programmatic identifier
 *   labelKey   — i18n key for display label
 *   params     — query parameters applied when the view is active
 *   badgeColor — Tailwind badge classes for count badges in the view strip
 *
 * Role visibility: all views are visible to any role that can access /admin/orders.
 * Fine-grained filtering is handled by the RBAC layer in admin-permissions.js.
 */
export const ORDER_CENTER_VIEWS = {
  all: {
    id: "all",
    labelKey: "admin.orders.viewAll",
    params: {},
    badgeColor: "",
  },
  pending: {
    id: "pending",
    labelKey: "admin.orders.viewPending",
    params: { status: "pending" },
    badgeColor: "bg-amber-100 text-amber-700",
  },
  missing_artwork: {
    id: "missing_artwork",
    labelKey: "admin.orders.viewMissingArt",
    params: { artwork: "missing", sort: "priority" },
    badgeColor: "bg-red-100 text-red-700",
  },
  in_production: {
    id: "in_production",
    labelKey: "admin.orders.viewInProd",
    params: { production: "in_production" },
    badgeColor: "bg-blue-100 text-blue-700",
  },
  ready_to_ship: {
    id: "ready_to_ship",
    labelKey: "admin.orders.viewReadyShip",
    params: { production: "ready_to_ship" },
    badgeColor: "bg-emerald-100 text-emerald-700",
  },
  shipped: {
    id: "shipped",
    labelKey: "admin.orders.viewShipped",
    params: { production: "shipped" },
    badgeColor: "bg-teal-100 text-teal-700",
  },
  exceptions: {
    id: "exceptions",
    labelKey: "admin.orders.viewExceptions",
    params: { production: "on_hold" },
    badgeColor: "bg-red-100 text-red-700",
  },
};

export const CUSTOMER_CENTER_VIEWS = {
  customers: {
    id: "customers",
    labelKey: "admin.customers.viewCustomers",
  },
  messages: {
    id: "messages",
    labelKey: "admin.customers.viewMessages",
  },
  support: {
    id: "support",
    labelKey: "admin.customers.viewSupport",
  },
  b2b: {
    id: "b2b",
    labelKey: "admin.customers.viewB2B",
  },
};

/**
 * Product Center workspace links.
 *
 * Unlike orders/customers, product workspaces live at independent routes
 * rather than query-parameter views. The view strip renders as navigation
 * links to these routes.
 */
export const PRODUCT_CENTER_VIEWS = [
  { id: "products", labelKey: "admin.productCenter.viewProducts", href: "/admin/products" },
  { id: "pricing", labelKey: "admin.productCenter.viewPricing", href: "/admin/pricing" },
  { id: "materials", labelKey: "admin.productCenter.viewMaterials", href: "/admin/materials" },
  { id: "media", labelKey: "admin.productCenter.viewMedia", href: "/admin/media" },
  { id: "coupons", labelKey: "admin.productCenter.viewCoupons", href: "/admin/coupons" },
];

/**
 * Look up a Product Center view by ID.
 */
export function getProductCenterView(viewId) {
  return PRODUCT_CENTER_VIEWS.find((v) => v.id === viewId) || PRODUCT_CENTER_VIEWS[0];
}

/**
 * Build the canonical URL for a Product Center view.
 *
 * @param {string} [viewId="products"] - View ID from PRODUCT_CENTER_VIEWS
 * @returns {string} Route path for that view
 */
export function buildProductCenterHref(viewId) {
  if (!viewId || viewId === "products") return "/admin/products";
  return getProductCenterView(viewId).href;
}

/**
 * Deep workspaces that sit under a Product Center peer view.
 * Each entry maps a deepId to its parent view in the center.
 */
const PRODUCT_CENTER_DEEP_WORKSPACES = {
  "image-dashboard": {
    id: "image-dashboard",
    parentView: "media",
    href: "/admin/image-dashboard",
  },
};

/**
 * Look up a deep workspace by ID.
 * Returns the workspace definition including its parentView,
 * or null if the deepId is not registered.
 */
export function getProductCenterDeep(deepId) {
  return PRODUCT_CENTER_DEEP_WORKSPACES[deepId] || null;
}

/**
 * Canonical Settings Center views.
 *
 * Unlike Orders/Customers (filtered views on one page), Settings views are
 * independent pages. Each view specifies a `route` field — the canonical URL
 * of that settings workspace. `buildSettingsCenterHref()` returns the route.
 */
export const SETTINGS_CENTER_VIEWS = {
  system: {
    id: "system",
    labelKey: "admin.settings.viewSystem",
    route: "/admin/settings",
    permModule: "settings",
  },
  analytics_reports: {
    id: "analytics_reports",
    labelKey: "admin.settings.viewAnalytics",
    route: "/admin/analytics",
    permModule: "analytics",
  },
  finance: {
    id: "finance",
    labelKey: "admin.settings.viewFinance",
    route: "/admin/finance",
    permModule: "finance",
  },
  users_permissions: {
    id: "users_permissions",
    labelKey: "admin.settings.viewUsers",
    route: "/admin/users",
    permModule: "users",
  },
  api_keys: {
    id: "api_keys",
    labelKey: "admin.settings.viewApiKeys",
    route: "/admin/api-keys",
    permModule: "apiKeys",
  },
  logs: {
    id: "logs",
    labelKey: "admin.settings.viewLogs",
    route: "/admin/logs",
    permModule: "logs",
  },
  factories: {
    id: "factories",
    labelKey: "admin.settings.viewFactories",
    route: "/admin/factories",
    permModule: "factories",
  },
};

export function getSettingsCenterView(value) {
  return SETTINGS_CENTER_VIEWS[value] || SETTINGS_CENTER_VIEWS.system;
}

/**
 * Build the canonical URL for a Settings Center view.
 *
 * Returns the `route` field directly — Settings views are independent pages,
 * not filtered views on one page.
 */
export function buildSettingsCenterHref(viewId = "system") {
  const view = getSettingsCenterView(viewId);
  return view.route;
}

// ── Tools Center ────────────────────────────────────────────────────────────

/**
 * Canonical Tools Center views.
 *
 * Like Products/Settings, each tool lives at its own route.
 * The hub page (/admin/tools) acts as the center's landing.
 * `permModule` ties into the existing "tools" RBAC module.
 */
export const TOOLS_CENTER_VIEWS = [
  { id: "hub", labelKey: "admin.tools.hubTitle", href: "/admin/tools" },
  { id: "contour", labelKey: "admin.tools.contourTitle", href: "/admin/tools/contour" },
  { id: "proof", labelKey: "admin.tools.proofTitle", href: "/admin/tools/proof" },
  { id: "stamp-studio", labelKey: "admin.tools.stampTitle", href: "/admin/tools/stamp-studio" },
  { id: "unit-converter", labelKey: "admin.tools.unitConverterTitle", href: "/admin/tools/unit-converter" },
];

/**
 * Look up a Tools Center view by ID.
 */
export function getToolsCenterView(viewId) {
  return TOOLS_CENTER_VIEWS.find((v) => v.id === viewId) || TOOLS_CENTER_VIEWS[0];
}

/**
 * Build the canonical URL for a Tools Center view.
 *
 * @param {string} [viewId="hub"] - View ID from TOOLS_CENTER_VIEWS
 * @returns {string} Route path for that view
 */
export function buildToolsCenterHref(viewId) {
  if (!viewId || viewId === "hub") return "/admin/tools";
  return getToolsCenterView(viewId).href;
}

// ── Order / Customer helpers ────────────────────────────────────────────────

export function getOrderCenterView(value) {
  return ORDER_CENTER_VIEWS[value] || ORDER_CENTER_VIEWS.all;
}

export function getCustomerCenterView(value) {
  return CUSTOMER_CENTER_VIEWS[value] || CUSTOMER_CENTER_VIEWS.customers;
}

export function buildOrderCenterHref(viewId = "all", overrides = {}) {
  const view = getOrderCenterView(viewId);
  const params = new URLSearchParams();

  if (view.id !== "all") params.set("view", view.id);

  for (const [key, value] of Object.entries(view.params || {})) {
    if (value != null && value !== "") params.set(key, String(value));
  }

  for (const [key, value] of Object.entries(overrides)) {
    if (value == null || value === "") params.delete(key);
    else params.set(key, String(value));
  }

  const query = params.toString();
  return query ? `/admin/orders?${query}` : "/admin/orders";
}

export function buildCustomerCenterHref(viewId = "customers", overrides = {}) {
  const view = getCustomerCenterView(viewId);
  const params = new URLSearchParams();

  if (view.id !== "customers") params.set("view", view.id);

  for (const [key, value] of Object.entries(overrides)) {
    if (value == null || value === "") params.delete(key);
    else params.set(key, String(value));
  }

  const query = params.toString();
  return query ? `/admin/customers?${query}` : "/admin/customers";
}

/**
 * Build the canonical URL for a customer detail (control) page.
 *
 * @param {string} email — Customer email address
 * @returns {string} URL path like `/admin/customers/user%40example.com`
 */
export function buildCustomerDetailHref(email) {
  if (!email) return "/admin/customers";
  return `/admin/customers/${encodeURIComponent(email)}`;
}

/**
 * Workspace route map for customer-scoped deep links.
 */
const CUSTOMER_WORKSPACE_ROUTES = {
  messages: "/admin/customers/messages",
  support: "/admin/customers/support",
  b2b: "/admin/customers/b2b",
};

/**
 * Build a customer-scoped workspace URL.
 *
 * When `email` is provided, the workspace page will filter to that customer's
 * records. Without `email`, returns the global workspace URL.
 *
 * @param {"messages"|"support"|"b2b"} workspace
 * @param {string} [email]
 * @returns {string}
 */
export function buildCustomerWorkspaceHref(workspace, email) {
  const base = CUSTOMER_WORKSPACE_ROUTES[workspace];
  if (!base) return "/admin/customers";
  if (!email) return base;
  return `${base}?email=${encodeURIComponent(email)}`;
}