import { prisma } from "@/lib/prisma";

/**
 * Default catalog display configuration.
 * Used as fallback when no "catalog.config" setting exists in DB.
 */
const DEFAULTS = {
  /** Categories displayed on the shop page, grouped by department */
  departments: [
    {
      key: "print-marketing",
      categories: [
        "marketing-prints",
        "business-cards",
        "stamps",
      ],
    },
    {
      key: "signs-displays",
      categories: [
        "rigid-signs",
        "banners-displays",
        "display-stands",
        "large-format-graphics",
      ],
    },
    {
      key: "vehicle-fleet",
      categories: [
        "vehicle-branding-advertising",
        "fleet-compliance-id",
      ],
    },
    {
      key: "labels-safety",
      categories: [
        "stickers-labels",
        "safety-warning-decals",
        "facility-asset-labels",
      ],
    },
    {
      key: "business-retail",
      categories: [
        "business-forms",
        "retail-promo",
        "packaging",
      ],
    },
  ],

  /** Flat list of all visible categories (derived from departments) */
  homepageCategories: [
    "marketing-prints",
    "business-cards",
    "stamps",
    "rigid-signs",
    "banners-displays",
    "display-stands",
    "large-format-graphics",
    "vehicle-branding-advertising",
    "fleet-compliance-id",
    "stickers-labels",
    "safety-warning-decals",
    "facility-asset-labels",
    "business-forms",
    "retail-promo",
    "packaging",
  ],

  maxPerCategory: 4,
  hiddenCategories: [],

  categoryMeta: {
    "marketing-prints":            { title: "Marketing Prints",          icon: "📄" },
    "business-cards":              { title: "Business Cards",            icon: "💳" },
    stamps:                        { title: "Self-Inking Stamps",        icon: "🔖" },
    "rigid-signs":                 { title: "Signs & Boards",            icon: "🪧" },
    "banners-displays":            { title: "Banners & Displays",        icon: "🏳️" },
    "display-stands":              { title: "Display Stands",            icon: "🧱" },
    "large-format-graphics":       { title: "Large Format Graphics",     icon: "🖼️" },
    "vehicle-branding-advertising":{ title: "Vehicle Branding",          icon: "🚐" },
    "fleet-compliance-id":         { title: "Fleet Compliance",          icon: "🪪" },
    "stickers-labels":             { title: "Stickers & Labels",         icon: "✨" },
    "safety-warning-decals":       { title: "Safety & Warning",          icon: "⚠️" },
    "facility-asset-labels":       { title: "Facility & Asset Labels",   icon: "🏭" },
    "business-forms":              { title: "Business Forms",            icon: "📋" },
    "retail-promo":                { title: "Retail Promo",              icon: "🛍️" },
    packaging:                     { title: "Packaging Inserts",         icon: "📦" },
  },

  departmentMeta: {
    "print-marketing":  { title: "Print & Marketing" },
    "signs-displays":   { title: "Signs & Displays" },
    "vehicle-fleet":    { title: "Vehicle & Fleet" },
    "labels-safety":    { title: "Labels & Safety" },
    "business-retail":  { title: "Business & Retail" },
  },
};

export { DEFAULTS as CATALOG_DEFAULTS };

/** All valid category slugs */
export const ALL_CATEGORIES = DEFAULTS.homepageCategories;

/**
 * Fetches catalog display config from the Setting table.
 * Falls back to hardcoded DEFAULTS for any missing fields.
 */
export async function getCatalogConfig() {
  try {
    const row = await prisma.setting.findUnique({
      where: { key: "catalog.config" },
    });
    if (!row) return DEFAULTS;
    const saved = row.value;
    return {
      departments: saved.departments ?? DEFAULTS.departments,
      homepageCategories: saved.homepageCategories ?? DEFAULTS.homepageCategories,
      maxPerCategory: saved.maxPerCategory ?? DEFAULTS.maxPerCategory,
      hiddenCategories: saved.hiddenCategories ?? DEFAULTS.hiddenCategories,
      categoryMeta: saved.categoryMeta ?? DEFAULTS.categoryMeta,
      departmentMeta: saved.departmentMeta ?? DEFAULTS.departmentMeta,
    };
  } catch {
    return DEFAULTS;
  }
}
