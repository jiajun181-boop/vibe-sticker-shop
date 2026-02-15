import { prisma } from "@/lib/prisma";

/**
 * Default catalog display configuration.
 * Used as fallback when no "catalog.config" setting exists in DB.
 */
const DEFAULTS = {
  departments: [
    {
      key: "print-marketing",
      categories: ["marketing-prints", "retail-promo", "packaging"],
    },
    {
      key: "signs-banners",
      categories: ["banners-displays", "rigid-signs", "window-glass-films", "display-stands"],
    },
    {
      key: "wraps-graphics",
      categories: ["vehicle-branding-advertising", "large-format-graphics", "fleet-compliance-id"],
    },
    {
      key: "stickers-labels-dept",
      categories: ["stickers-labels", "safety-warning-decals", "facility-asset-labels"],
    },
  ],

  homepageCategories: [
    "marketing-prints", "retail-promo", "packaging",
    "banners-displays", "rigid-signs", "window-glass-films", "display-stands", "large-format-graphics",
    "vehicle-branding-advertising", "fleet-compliance-id",
    "stickers-labels", "safety-warning-decals", "facility-asset-labels",
  ],

  maxPerCategory: 4,
  hiddenCategories: [],

  categoryMeta: {
    "marketing-prints": {
      title: "Marketing Prints",
      icon: "M",
      subGroups: [
        { slug: "business-cards", title: "Business Cards", href: "/shop/marketing-prints/business-cards" },
        { slug: "flyers", title: "Flyers", href: "/shop/marketing-prints/flyers" },
        { slug: "postcards", title: "Postcards", href: "/shop/marketing-prints/postcards" },
        { slug: "brochures-booklets", title: "Brochures & Booklets", href: "/shop/marketing-prints/brochures-booklets" },
        { slug: "posters", title: "Posters", href: "/shop/marketing-prints/posters" },
        { slug: "menus", title: "Menus", href: "/shop/marketing-prints/menus" },
        { slug: "ncr-forms", title: "NCR Forms", href: "/shop/marketing-prints/ncr-forms" },
        { slug: "order-forms", title: "Order Forms", href: "/shop/marketing-prints/order-forms" },
        { slug: "waivers-releases", title: "Waivers & Releases", href: "/shop/marketing-prints/waivers-releases" },
        { slug: "envelopes", title: "Envelopes", href: "/shop/marketing-prints/envelopes" },
        { slug: "letterhead-stationery", title: "Letterhead & Stationery", href: "/shop/marketing-prints/letterhead-stationery" },
        { slug: "presentation-folders", title: "Folders", href: "/shop/marketing-prints/presentation-folders" },
        { slug: "greeting-cards", title: "Cards & Invitations", href: "/shop/marketing-prints/greeting-cards" },
      ],
    },
    packaging: {
      title: "Packaging Inserts",
      icon: "P",
      subGroups: [
        { slug: "tags", title: "Tags & Labels", href: "/shop/packaging/tags" },
        { slug: "inserts-packaging", title: "Inserts & Seals", href: "/shop/packaging/inserts-packaging" },
      ],
    },
    "retail-promo": {
      title: "Retail & POP Displays",
      icon: "R",
      subGroups: [
        { slug: "shelf-displays", title: "Shelf Displays", href: "/shop/retail-promo/shelf-displays" },
        { slug: "table-tents", title: "Table Tents", href: "/shop/retail-promo/table-tents" },
        { slug: "tickets-coupons", title: "Tickets & Coupons", href: "/shop/retail-promo/tickets-coupons" },
        { slug: "retail-tags", title: "Tags & Labels", href: "/shop/retail-promo/retail-tags" },
      ],
    },

    "banners-displays": {
      title: "Banners & Flags",
      icon: "B",
      subGroups: [
        { slug: "vinyl-banners", title: "Vinyl Banners", href: "/shop/banners-displays/vinyl-banners" },
        { slug: "mesh-banners", title: "Mesh Banners", href: "/shop/banners-displays/mesh-banners" },
        { slug: "pole-banners", title: "Pole Banners", href: "/shop/banners-displays/pole-banners" },
        { slug: "canvas-prints", title: "Canvas Prints", href: "/shop/banners-displays/canvas-prints" },
      ],
    },
    "rigid-signs": {
      title: "Rigid Signs",
      icon: "R",
      subGroups: [
        { slug: "yard-signs", title: "Yard & Lawn Signs", href: "/shop/rigid-signs/yard-signs" },
        { slug: "real-estate-signs", title: "Real Estate Signs", href: "/shop/rigid-signs/real-estate-signs" },
        { slug: "foam-board-signs", title: "Foam Board Signs", href: "/shop/rigid-signs/foam-board-signs" },
        { slug: "a-frame-signs", title: "A-Frame Signs", href: "/shop/rigid-signs/a-frame-signs" },
        { slug: "election-signs", title: "Election & Campaign", href: "/shop/rigid-signs/election-signs" },
        { slug: "display-signs", title: "Display Signs", href: "/shop/rigid-signs/display-signs" },
      ],
    },
    "window-glass-films": {
      title: "Window & Glass Films",
      icon: "W",
      subGroups: [
        { slug: "static-clings", title: "Static Clings", href: "/shop/window-glass-films/static-clings" },
        { slug: "adhesive-films", title: "Adhesive Films", href: "/shop/window-glass-films/adhesive-films" },
        { slug: "one-way-vision", title: "One-Way Vision", href: "/shop/window-glass-films/one-way-vision" },
        { slug: "privacy-films", title: "Privacy Films", href: "/shop/window-glass-films/privacy-films" },
        { slug: "window-lettering", title: "Window Lettering", href: "/shop/window-glass-films/window-lettering" },
      ],
    },
    "display-stands": {
      title: "Stands & Frames",
      icon: "D",
      subGroups: [
        { slug: "retractable-stands", title: "Roll-Up Stands", href: "/shop/display-stands/retractable-stands" },
        { slug: "x-banner-stands", title: "X-Banner Stands", href: "/shop/display-stands/x-banner-stands" },
        { slug: "tabletop-displays", title: "Tabletop Displays", href: "/shop/display-stands/tabletop-displays" },
        { slug: "backdrops-popups", title: "Backdrops & Pop-Ups", href: "/shop/display-stands/backdrops-popups" },
        { slug: "flags-hardware", title: "Flags & Poles", href: "/shop/display-stands/flags-hardware" },
        { slug: "a-frames-signs", title: "A-Frames & Signs", href: "/shop/display-stands/a-frames-signs" },
        { slug: "lawn-yard-signs", title: "Lawn & Yard Signs", href: "/shop/display-stands/lawn-yard-signs" },
        { slug: "tents-outdoor", title: "Tents & Outdoor", href: "/shop/display-stands/tents-outdoor" },
      ],
    },
    "large-format-graphics": {
      title: "Wall & Floor Graphics",
      icon: "L",
      subGroups: [
        { slug: "wall-graphics", title: "Wall Graphics", href: "/shop/large-format-graphics/wall-graphics" },
        { slug: "floor-graphics", title: "Floor Graphics", href: "/shop/large-format-graphics/floor-graphics" },
        { slug: "window-graphics", title: "Window Graphics", href: "/shop/large-format-graphics/window-graphics" },
        { slug: "vehicle-graphics", title: "Vehicle Graphics", href: "/shop/large-format-graphics/vehicle-graphics" },
      ],
    },
    "vehicle-branding-advertising": {
      title: "Vehicle Branding",
      icon: "V",
      subGroups: [
        { slug: "vehicle-wraps", title: "Vehicle Wraps", href: "/shop/vehicle-branding-advertising/vehicle-wraps" },
        { slug: "door-panel-graphics", title: "Door & Panel", href: "/shop/vehicle-branding-advertising/door-panel-graphics" },
        { slug: "vehicle-decals", title: "Decals & Lettering", href: "/shop/vehicle-branding-advertising/vehicle-decals" },
        { slug: "magnetic-signs", title: "Magnetic Signs", href: "/shop/vehicle-branding-advertising/magnetic-signs" },
        { slug: "fleet-packages", title: "Fleet Packages", href: "/shop/vehicle-branding-advertising/fleet-packages" },
      ],
    },
    "fleet-compliance-id": {
      title: "Fleet & DOT Numbers",
      icon: "F",
      subGroups: [
        { slug: "dot-mc-numbers", title: "DOT & MC Numbers", href: "/shop/fleet-compliance-id/dot-mc-numbers" },
        { slug: "unit-weight-ids", title: "Unit & Weight IDs", href: "/shop/fleet-compliance-id/unit-weight-ids" },
        { slug: "spec-labels", title: "Spec Labels", href: "/shop/fleet-compliance-id/spec-labels" },
        { slug: "inspection-compliance", title: "Inspection & Compliance", href: "/shop/fleet-compliance-id/inspection-compliance" },
      ],
    },

    "stickers-labels": {
      title: "Stickers & Labels",
      icon: "S",
      subGroups: [
        { slug: "die-cut-stickers", title: "Die-Cut", href: "/shop/stickers-labels/die-cut-stickers" },
        { slug: "kiss-cut-singles", title: "Kiss-Cut", href: "/shop/stickers-labels/kiss-cut-singles" },
        { slug: "sticker-pages", title: "Sheets & Pages", href: "/shop/stickers-labels/sticker-pages" },
        { slug: "sticker-rolls", title: "Rolls & Labels", href: "/shop/stickers-labels/sticker-rolls" },
        { slug: "vinyl-lettering", title: "Vinyl Lettering", href: "/shop/stickers-labels/vinyl-lettering" },
        { slug: "decals", title: "Decals", href: "/shop/stickers-labels/decals" },
        { slug: "specialty", title: "Specialty", href: "/shop/stickers-labels/specialty" },
      ],
    },
    "safety-warning-decals": {
      title: "Safety Decals",
      icon: "!",
      subGroups: [
        { slug: "reflective-visibility", title: "Reflective & Visibility", href: "/shop/safety-warning-decals/reflective-visibility" },
        { slug: "fire-emergency", title: "Fire & Emergency", href: "/shop/safety-warning-decals/fire-emergency" },
        { slug: "hazard-warning", title: "Hazard & Warning", href: "/shop/safety-warning-decals/hazard-warning" },
        { slug: "ppe-equipment", title: "PPE & Equipment", href: "/shop/safety-warning-decals/ppe-equipment" },
        { slug: "electrical-chemical", title: "Electrical & Chemical", href: "/shop/safety-warning-decals/electrical-chemical" },
      ],
    },
    "facility-asset-labels": {
      title: "Industrial Labels",
      icon: "I",
      subGroups: [
        { slug: "asset-equipment-tags", title: "Asset & Equipment Tags", href: "/shop/facility-asset-labels/asset-equipment-tags" },
        { slug: "pipe-valve-labels", title: "Pipe & Valve Labels", href: "/shop/facility-asset-labels/pipe-valve-labels" },
        { slug: "warehouse-labels", title: "Warehouse Labels", href: "/shop/facility-asset-labels/warehouse-labels" },
        { slug: "electrical-cable-labels", title: "Electrical & Cable", href: "/shop/facility-asset-labels/electrical-cable-labels" },
      ],
    },
  },

  departmentMeta: {
    "print-marketing": { title: "Print & Marketing" },
    "signs-banners": { title: "Signs & Banners" },
    "wraps-graphics": { title: "Wraps & Graphics" },
    "stickers-labels-dept": { title: "Stickers & Labels" },
  },
};

export { DEFAULTS as CATALOG_DEFAULTS };

export const ALL_CATEGORIES = DEFAULTS.homepageCategories;

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
