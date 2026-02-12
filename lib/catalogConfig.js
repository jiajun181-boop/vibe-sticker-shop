import { prisma } from "@/lib/prisma";

/**
 * Default catalog display configuration.
 * Used as fallback when no "catalog.config" setting exists in DB.
 */
const DEFAULTS = {
  homepageCategories: [
    "stickers-labels",
    "rigid-signs",
    "banners-displays",
    "display-stands",
    "marketing-prints",
    "large-format-graphics",
    "vehicle-branding-advertising",
    "facility-asset-labels",
    "retail-promo",
    "packaging",
    "business-forms",
  ],
  maxPerCategory: 4,
  hiddenCategories: [
    "window-graphics",
    "fleet-compliance-id",
    "safety-warning-decals",
    "signs-boards",
    "displays",
  ],
  categoryMeta: {
    "stickers-labels": { title: "Stickers & Labels", icon: "\u2728" },
    "rigid-signs": { title: "Signs & Boards", icon: "\ud83e\udea7" },
    "banners-displays": { title: "Banners & Displays", icon: "\ud83c\udff3\ufe0f" },
    "display-stands": { title: "Display Stands & Hardware", icon: "\ud83e\uddf1" },
    "marketing-prints": { title: "Marketing Prints", icon: "\ud83d\uddde\ufe0f" },
    "large-format-graphics": { title: "Large Format Graphics", icon: "\ud83e\udea9" },
    "vehicle-branding-advertising": { title: "Vehicle Branding", icon: "\ud83d\ude90" },
    "facility-asset-labels": { title: "Facility & Asset Labels", icon: "\ud83c\udfed" },
    "retail-promo": { title: "Retail Promo", icon: "\ud83c\udff7\ufe0f" },
    packaging: { title: "Packaging Inserts", icon: "\ud83d\udce6" },
    "business-forms": { title: "Business Forms", icon: "\ud83e\uddfe" },
  },
};

export { DEFAULTS as CATALOG_DEFAULTS };

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
      homepageCategories: saved.homepageCategories ?? DEFAULTS.homepageCategories,
      maxPerCategory: saved.maxPerCategory ?? DEFAULTS.maxPerCategory,
      hiddenCategories: saved.hiddenCategories ?? DEFAULTS.hiddenCategories,
      categoryMeta: saved.categoryMeta ?? DEFAULTS.categoryMeta,
    };
  } catch {
    return DEFAULTS;
  }
}
