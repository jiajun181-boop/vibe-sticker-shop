export const ADMIN_NAV_ITEMS = {
  dashboard: {
    id: "dashboard",
    key: "admin.nav.dashboard",
    href: "/admin",
    icon: "grid",
    matches: ["/admin"],
  },
  workstation: {
    id: "workstation",
    key: "admin.nav.workstation",
    href: "/admin/workstation",
    icon: "grid",
    matches: ["/admin/workstation"],
  },
  orders: {
    id: "orders",
    key: "admin.nav.orders",
    href: "/admin/orders",
    icon: "package",
    matches: ["/admin/orders"],
  },
  missingArtwork: {
    id: "missingArtwork",
    key: "admin.nav.missingArtwork",
    href: "/admin/orders?view=missing_artwork&artwork=missing&sort=priority",
    icon: "image",
    matches: ["/admin/orders/missing-artwork"],
  },
  production: {
    id: "production",
    key: "admin.nav.production",
    href: "/admin/production/board",
    icon: "printer",
    matches: ["/admin/production", "/admin/production/board", "/admin/production/mobile", "/admin/production/schedule", "/admin/production/rules"],
  },
  shipping: {
    id: "shipping",
    key: "admin.nav.shipping",
    href: "/admin/orders/shipping",
    icon: "package",
    matches: ["/admin/orders/shipping", "/admin/shipping"],
  },
  qc: {
    id: "qc",
    key: "admin.nav.qc",
    href: "/admin/qc",
    icon: "shield",
    matches: ["/admin/qc"],
  },
  customers: {
    id: "customers",
    key: "admin.nav.customers",
    href: "/admin/customers",
    icon: "users",
    matches: ["/admin/customers"],
  },
  b2b: {
    id: "b2b",
    key: "admin.nav.b2b",
    href: "/admin/customers/b2b",
    icon: "briefcase",
    matches: ["/admin/customers/b2b", "/admin/b2b"],
  },
  messages: {
    id: "messages",
    key: "admin.nav.messages",
    href: "/admin/customers/messages",
    icon: "chat",
    matches: ["/admin/customers/messages", "/admin/messages"],
  },
  support: {
    id: "support",
    key: "admin.nav.support",
    href: "/admin/customers/support",
    icon: "ticket",
    matches: ["/admin/customers/support", "/admin/support"],
  },
  warranty: {
    id: "warranty",
    key: "admin.nav.warranty",
    href: "/admin/orders/warranty",
    icon: "shield",
    matches: ["/admin/orders/warranty"],
  },
  reviews: {
    id: "reviews",
    key: "admin.nav.reviews",
    href: "/admin/reviews",
    icon: "chat",
    matches: ["/admin/reviews"],
  },
  productOps: {
    id: "productOps",
    key: "admin.nav.catalogOps",
    href: "/admin/catalog-ops",
    icon: "catalog",
    matches: ["/admin/catalog-ops", "/admin/products", "/admin/catalog"],
  },
  pricingRules: {
    id: "pricingRules",
    key: "admin.nav.pricingDashboard",
    href: "/admin/pricing",
    icon: "pricing",
    matches: ["/admin/pricing"],
  },
  materials: {
    id: "materials",
    key: "admin.nav.materials",
    href: "/admin/materials",
    icon: "package",
    matches: ["/admin/materials", "/admin/materials-handbook"],
  },
  media: {
    id: "media",
    key: "admin.nav.media",
    href: "/admin/media",
    icon: "image",
    matches: ["/admin/media", "/admin/image-dashboard"],
  },
  coupons: {
    id: "coupons",
    key: "admin.nav.coupons",
    href: "/admin/coupons",
    icon: "ticket",
    matches: ["/admin/coupons"],
  },
  inventory: {
    id: "inventory",
    key: "admin.nav.inventory",
    href: "/admin/inventory",
    icon: "package",
    matches: ["/admin/inventory"],
  },
  loyalty: {
    id: "loyalty",
    key: "admin.nav.loyalty",
    href: "/admin/marketing/loyalty",
    icon: "star",
    matches: ["/admin/marketing/loyalty"],
  },
  content: {
    id: "content",
    key: "admin.nav.content",
    href: "/admin/content",
    icon: "document",
    matches: ["/admin/content", "/admin/marketing-calendar"],
  },
  toolsHub: {
    id: "toolsHub",
    key: "admin.nav.toolsHub",
    href: "/admin/tools",
    icon: "grid",
    matches: ["/admin/tools"],
  },
  contour: {
    id: "contour",
    key: "admin.nav.contour",
    href: "/admin/tools/contour",
    icon: "image",
    matches: ["/admin/tools/contour"],
  },
  proof: {
    id: "proof",
    key: "admin.nav.proof",
    href: "/admin/tools/proof",
    icon: "shield",
    matches: ["/admin/tools/proof"],
  },
  stampStudio: {
    id: "stampStudio",
    key: "admin.nav.stampStudio",
    href: "/admin/tools/stamp-studio",
    icon: "printer",
    matches: ["/admin/tools/stamp-studio"],
  },
  analyticsReports: {
    id: "analyticsReports",
    key: "admin.nav.analyticsReports",
    href: "/admin/analytics",
    icon: "chart",
    matches: ["/admin/analytics", "/admin/analytics/customers", "/admin/analytics/production", "/admin/analytics/marketing", "/admin/analytics/shipping", "/admin/funnel", "/admin/reports/sales", "/admin/reports/production"],
  },
  finance: {
    id: "finance",
    key: "admin.nav.finance",
    href: "/admin/finance",
    icon: "pricing",
    matches: ["/admin/finance"],
  },
  users: {
    id: "users",
    key: "admin.nav.users",
    href: "/admin/users",
    icon: "users",
    matches: ["/admin/users"],
  },
  apiKeys: {
    id: "apiKeys",
    key: "admin.nav.apiKeys",
    href: "/admin/api-keys",
    icon: "cog",
    matches: ["/admin/api-keys"],
  },
  activityLog: {
    id: "activityLog",
    key: "admin.nav.activityLog",
    href: "/admin/logs",
    icon: "clock",
    matches: ["/admin/logs"],
  },
  settings: {
    id: "settings",
    key: "admin.nav.settings",
    href: "/admin/settings",
    icon: "cog",
    matches: ["/admin/settings"],
  },
  factories: {
    id: "factories",
    key: "admin.nav.factories",
    href: "/admin/factories",
    icon: "factory",
    matches: ["/admin/factories"],
  },
  systemHealth: {
    id: "systemHealth",
    key: "admin.nav.systemHealth",
    href: "/admin/system-health",
    icon: "heartPulse",
    matches: ["/admin/system-health"],
  },
};

const NAV_SECTIONS = {
  workbench: {
    id: "workbench",
    labelKey: "admin.navGroup.workbench",
    adminItems: ["dashboard", "workstation"],
    employeeItems: ["workstation"],
  },
  orders: {
    id: "orders",
    labelKey: "admin.navGroup.ordersHub",
    items: ["orders"],
  },
  customers: {
    id: "customers",
    labelKey: "admin.navGroup.customersHub",
    items: ["customers"],
  },
  products: {
    id: "products",
    labelKey: "admin.navGroup.productsHub",
    items: ["productOps", "pricingRules", "materials", "media", "coupons", "inventory", "loyalty", "content"],
  },
  tools: {
    id: "tools",
    labelKey: "admin.navGroup.toolsPrimary",
    items: ["toolsHub", "contour", "proof", "stampStudio"],
  },
  settings: {
    id: "settings",
    labelKey: "admin.navGroup.settingsHub",
    items: ["analyticsReports", "finance", "users", "apiKeys", "activityLog", "settings", "factories", "systemHealth"],
  },
};

const ROLE_EXPERIENCE = {
  admin: "admin",
  cs: "service",
  sales: "service",
  design: "ops",
  production: "ops",
  qa: "ops",
  merch_ops: "product",
  finance: "finance",
};

const EXPERIENCE_SECTIONS = {
  admin: ["workbench", "orders", "customers", "products", "tools", "settings"],
  service: ["workbench", "orders", "customers"],
  ops: ["workbench", "orders", "tools"],
  product: ["workbench", "orders", "products"],
  finance: ["workbench", "orders", "settings"],
};

export function getAdminExperience(role) {
  return ROLE_EXPERIENCE[role] || "ops";
}

export function getAdminNavigation(role, allowedHrefs) {
  const experience = getAdminExperience(role);
  const sectionIds = EXPERIENCE_SECTIONS[experience] || EXPERIENCE_SECTIONS.ops;

  return sectionIds
    .map((sectionId) => {
      const section = NAV_SECTIONS[sectionId];
      const itemIds =
        sectionId === "workbench" && experience !== "admin"
          ? section.employeeItems
          : section.adminItems || section.items;

      const items = itemIds
        .map((itemId) => ADMIN_NAV_ITEMS[itemId])
        .filter(Boolean)
        .filter((item) => !allowedHrefs || allowedHrefs.has(item.href));

      return { id: section.id, labelKey: section.labelKey, items };
    })
    .filter((section) => section.items.length > 0);
}

export function flattenAdminNavigation(sections) {
  return sections.flatMap((section) => section.items);
}

export function isAdminPathActive(item, pathname) {
  if (!item) return false;
  return (item.matches || [item.href]).some((prefix) =>
    prefix === "/admin" ? pathname === "/admin" : pathname.startsWith(prefix)
  );
}
