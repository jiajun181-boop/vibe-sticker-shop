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
      categories: ["marketing-prints", "packaging"],
    },
    {
      key: "signs-displays",
      categories: [
        "banners-displays",
        "window-glass-films",
        "display-stands",
        "large-format-graphics",
        "vehicle-branding-advertising",
        "fleet-compliance-id",
      ],
    },
    {
      key: "labels-safety",
      categories: ["stickers-labels", "safety-warning-decals", "facility-asset-labels"],
    },
  ],

  /** Flat list of all valid DB category slugs (used for route validation) */
  homepageCategories: [
    "marketing-prints", "packaging",
    "banners-displays", "window-glass-films", "display-stands", "large-format-graphics",
    "vehicle-branding-advertising", "fleet-compliance-id",
    "stickers-labels", "safety-warning-decals", "facility-asset-labels",
  ],

  maxPerCategory: 4,
  hiddenCategories: [],

  categoryMeta: {
    /* ── Marketing Prints (parent card with sub-group pills) ─── */
    "marketing-prints": {
      title: "Marketing Prints",
      icon: "📄",
      subGroups: [
        { slug: "flyers",               title: "Flyers",        href: "/shop/marketing-prints/flyers" },
        { slug: "postcards",            title: "Postcards",     href: "/shop/marketing-prints/postcards" },
        { slug: "brochures",            title: "Brochures",     href: "/shop/marketing-prints/brochures" },
        { slug: "booklets",             title: "Booklets",      href: "/shop/marketing-prints/booklets" },
        { slug: "posters",              title: "Posters",       href: "/shop/marketing-prints/posters" },
        { slug: "menus",                title: "Menus",         href: "/shop/marketing-prints/menus" },
        { slug: "envelopes",            title: "Envelopes",     href: "/shop/marketing-prints/envelopes" },
        { slug: "rack-cards",           title: "Rack Cards",    href: "/shop/marketing-prints/rack-cards" },
        { slug: "door-hangers",         title: "Door Hangers",  href: "/shop/marketing-prints/door-hangers" },
        { slug: "presentation-folders", title: "Folders",       href: "/shop/marketing-prints/presentation-folders" },
        { slug: "business-cards",       title: "Business Cards", href: "/shop/marketing-prints/business-cards" },
        { slug: "stamps",              title: "Stamps",         href: "/shop/marketing-prints/stamps" },
        { slug: "business-forms",      title: "Business Forms", href: "/shop/marketing-prints/business-forms" },
      ],
    },
    "business-cards":              { title: "Business Cards",         icon: "💳" },
    stamps:                        { title: "Self-Inking Stamps",     icon: "🔖" },
    packaging:                     { title: "Packaging Inserts",      icon: "📦" },

    /* ── Large Format & Signage ───────────────────────────────── */
    // Hard rule: banners-displays = printed/fabricated output (成品)
    //            display-stands   = hardware/frames/accessories (硬件)
    "banners-displays":            { title: "Banners & Flags",         icon: "🏳️" },
    "window-glass-films":          { title: "Window & Glass Films",   icon: "🪟" },
    "display-stands":              { title: "Stands & Frames",        icon: "🧱" },
    "large-format-graphics": {
      title: "Wall & Floor Graphics",
      icon: "🖼️",
      subGroups: [
        { slug: "wall-graphics",  title: "Wall Graphics (墙)", href: "/shop/large-format-graphics/wall-graphics" },
        { slug: "floor-graphics", title: "Floor Graphics (地)", href: "/shop/large-format-graphics/floor-graphics" },
      ],
    },
    "vehicle-branding-advertising":{ title: "Vehicle Branding",       icon: "🚐" },
    "fleet-compliance-id":         { title: "Fleet & DOT Numbers",    icon: "🪪" },

    /* ── Stickers & Labels (parent card with sub-group pills) ── */
    "stickers-labels": {
      title: "Stickers & Labels",
      icon: "✨",
      subGroups: [
        { slug: "die-cut-stickers", title: "Die-Cut",      href: "/shop/stickers-labels/die-cut-stickers" },
        { slug: "kiss-cut-singles",  title: "Kiss-Cut",     href: "/shop/stickers-labels/kiss-cut-singles" },
        { slug: "sticker-pages",     title: "Sheets & Pages", href: "/shop/stickers-labels/sticker-pages" },
        { slug: "sticker-rolls",     title: "Rolls & Labels", href: "/shop/stickers-labels/sticker-rolls" },
      ],
    },
    "safety-warning-decals":       { title: "Safety Decals",           icon: "⚠️" },
    "facility-asset-labels":       { title: "Industrial Labels",      icon: "🏭" },
  },

  departmentMeta: {
    "print-marketing":  { title: "Print & Marketing" },
    "signs-displays":   {
      title: "Large Format & Signage",
      subSections: [
        { label: "By Surface", i18nKey: "shop.bySurface", categories: ["window-glass-films", "large-format-graphics", "vehicle-branding-advertising"] },
        { label: "Hardware & More", i18nKey: "shop.hardwareMore", categories: ["banners-displays", "display-stands", "fleet-compliance-id"] },
      ],
    },
    "labels-safety":    { title: "Labels & Safety" },
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
