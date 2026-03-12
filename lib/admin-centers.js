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