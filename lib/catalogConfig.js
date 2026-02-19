import { prisma } from "@/lib/prisma";

/**
 * Default catalog display configuration.
 * Used as fallback when no "catalog.config" setting exists in DB.
 */
const DEFAULTS = {
  departments: [
    { key: "marketing-business-print", categories: ["marketing-business-print"] },
    { key: "stickers-labels-decals", categories: ["stickers-labels-decals"] },
    { key: "signs-rigid-boards", categories: ["signs-rigid-boards"] },
    { key: "banners-displays", categories: ["banners-displays"] },
    { key: "canvas-prints", categories: ["canvas-prints"] },
    { key: "windows-walls-floors", categories: ["windows-walls-floors"] },
    { key: "vehicle-graphics-fleet", categories: ["vehicle-graphics-fleet"] },
  ],

  homepageCategories: [
    "marketing-business-print",
    "stickers-labels-decals",
    "signs-rigid-boards",
    "banners-displays",
    "canvas-prints",
    "windows-walls-floors",
    "vehicle-graphics-fleet",
  ],

  maxPerCategory: 6,
  hiddenCategories: [],

  categoryMeta: {
    "marketing-business-print": {
      title: "Marketing & Business Print",
      icon: "\uD83D\uDDA8\uFE0F",
      subGroups: [
        { slug: "business-cards", title: "Business Cards", href: "/shop/marketing-business-print/business-cards" },
        { slug: "flyers", title: "Flyers", href: "/shop/marketing-business-print/flyers" },
        { slug: "rack-cards", title: "Rack Cards", href: "/shop/marketing-business-print/rack-cards" },
        { slug: "door-hangers", title: "Door Hangers", href: "/shop/marketing-business-print/door-hangers" },
        { slug: "postcards", title: "Postcards", href: "/shop/marketing-business-print/postcards" },
        { slug: "brochures", title: "Brochures", href: "/shop/marketing-business-print/brochures" },
        { slug: "booklets", title: "Booklets", href: "/shop/marketing-business-print/booklets" },
        { slug: "posters", title: "Posters", href: "/shop/marketing-business-print/posters" },
        { slug: "menus", title: "Menus", href: "/shop/marketing-business-print/menus" },
        { slug: "ncr-forms", title: "NCR Forms", href: "/shop/marketing-business-print/ncr-forms" },
        { slug: "order-forms", title: "Order Forms", href: "/shop/marketing-business-print/order-forms" },
        { slug: "waivers-releases", title: "Waivers & Releases", href: "/shop/marketing-business-print/waivers-releases" },
        { slug: "envelopes", title: "Envelopes", href: "/shop/marketing-business-print/envelopes" },
        { slug: "letterhead", title: "Letterhead", href: "/shop/marketing-business-print/letterhead" },
        { slug: "notepads", title: "Notepads", href: "/shop/marketing-business-print/notepads" },
        { slug: "bookmarks", title: "Bookmarks", href: "/shop/marketing-business-print/bookmarks" },
        { slug: "calendars", title: "Calendars", href: "/shop/marketing-business-print/calendars" },
        { slug: "stamps", title: "Stamps", href: "/shop/marketing-business-print/stamps" },
        { slug: "presentation-folders", title: "Folders", href: "/shop/marketing-business-print/presentation-folders" },
        { slug: "certificates", title: "Certificates", href: "/shop/marketing-business-print/certificates" },
        { slug: "greeting-invitation-cards", title: "Greeting & Invitation Cards", href: "/shop/marketing-business-print/greeting-invitation-cards" },
        { slug: "shelf-displays", title: "Shelf Displays", href: "/shop/marketing-business-print/shelf-displays" },
        { slug: "table-tents", title: "Table Tents", href: "/shop/marketing-business-print/table-tents" },
        { slug: "tickets-coupons", title: "Tickets, Coupons & Loyalty", href: "/shop/marketing-business-print/tickets-coupons" },
        { slug: "tags", title: "Tags & Labels", href: "/shop/marketing-business-print/tags" },
        { slug: "inserts-packaging", title: "Packaging Inserts & Seals", href: "/shop/marketing-business-print/inserts-packaging" },
      ],
    },
    "stickers-labels-decals": {
      title: "Stickers & Labels",
      icon: "\uD83C\uDFF7\uFE0F",
      subGroups: [
        { slug: "die-cut-stickers", title: "Die-Cut", href: "/shop/stickers-labels-decals/die-cut-stickers" },
        { slug: "kiss-cut-singles", title: "Kiss-Cut", href: "/shop/stickers-labels-decals/kiss-cut-singles" },
        { slug: "sticker-pages", title: "Sheets & Pages", href: "/shop/stickers-labels-decals/sticker-pages" },
        { slug: "sticker-rolls", title: "Rolls & Labels", href: "/shop/stickers-labels-decals/sticker-rolls" },
        { slug: "vinyl-lettering", title: "Vinyl Lettering", href: "/shop/stickers-labels-decals/vinyl-lettering" },
        { slug: "fire-emergency", title: "Fire & Emergency", href: "/shop/stickers-labels-decals/fire-emergency" },
        { slug: "hazard-warning", title: "Hazard & Warning", href: "/shop/stickers-labels-decals/hazard-warning" },
        { slug: "ppe-equipment", title: "PPE & Equipment", href: "/shop/stickers-labels-decals/ppe-equipment" },
        { slug: "electrical-chemical", title: "Electrical & Chemical", href: "/shop/stickers-labels-decals/electrical-chemical" },
        { slug: "asset-equipment-tags", title: "Asset & Equipment Tags", href: "/shop/stickers-labels-decals/asset-equipment-tags" },
        { slug: "pipe-valve-labels", title: "Pipe & Valve Labels", href: "/shop/stickers-labels-decals/pipe-valve-labels" },
        { slug: "warehouse-labels", title: "Warehouse Labels", href: "/shop/stickers-labels-decals/warehouse-labels" },
        { slug: "electrical-cable-labels", title: "Electrical & Cable", href: "/shop/stickers-labels-decals/electrical-cable-labels" },
      ],
    },
    "signs-rigid-boards": {
      title: "Signs & Rigid Boards",
      icon: "\uD83E\uDEA7",
      subGroups: [
        // ── Outdoor Signs ──
        { slug: "yard-lawn-signs", title: "Yard & Lawn Signs", href: "/shop/signs-rigid-boards/yard-lawn-signs" },
        { slug: "real-estate-signs", title: "Real Estate Signs", href: "/shop/signs-rigid-boards/real-estate-signs" },
        // ── Indoor & Portable ──
        { slug: "a-frames-signs", title: "A-Frame Signs", href: "/shop/signs-rigid-boards/a-frames-signs" },
        { slug: "display-tabletop", title: "Display & Tabletop", href: "/shop/signs-rigid-boards/display-tabletop" },
        // ── Event & Specialty ──
        { slug: "event-photo-boards", title: "Event & Photo Boards", href: "/shop/signs-rigid-boards/event-photo-boards" },
        { slug: "business-property", title: "Business & Property", href: "/shop/signs-rigid-boards/business-property" },
        { slug: "by-material", title: "Shop by Material", href: "/shop/signs-rigid-boards/by-material" },
      ],
    },
    "banners-displays": {
      title: "Banners & Displays",
      icon: "\uD83C\uDFF3\uFE0F",
      subGroups: [
        { slug: "vinyl-banners", title: "Vinyl Banners", href: "/shop/banners-displays/vinyl-banners" },
        { slug: "mesh-banners", title: "Mesh Banners", href: "/shop/banners-displays/mesh-banners" },
        { slug: "pole-banners", title: "Pole Banners", href: "/shop/banners-displays/pole-banners" },
        { slug: "fabric-banners", title: "Fabric Banners", href: "/shop/banners-displays/fabric-banners" },
        { slug: "retractable-stands", title: "Roll-Up Stands", href: "/shop/banners-displays/retractable-stands" },
        { slug: "x-banner-stands", title: "X-Banner Stands", href: "/shop/banners-displays/x-banner-stands" },
        { slug: "tabletop-displays", title: "Tabletop Displays", href: "/shop/banners-displays/tabletop-displays" },
        { slug: "backdrops-popups", title: "Backdrops & Pop-Ups", href: "/shop/banners-displays/backdrops-popups" },
        { slug: "flags-hardware", title: "Flags & Poles", href: "/shop/banners-displays/flags-hardware" },
        { slug: "tents-outdoor", title: "Tents & Outdoor", href: "/shop/banners-displays/tents-outdoor" },
      ],
    },
    "canvas-prints": {
      title: "Canvas Prints",
      icon: "\uD83D\uDDBC\uFE0F",
      subGroups: [
        { slug: "classic-canvas-prints", title: "Classic Canvas", href: "/shop/canvas-prints/classic-canvas-prints" },
        { slug: "floating-frame-canvas", title: "Floating Frame", href: "/shop/canvas-prints/floating-frame-canvas" },
        { slug: "large-format-canvas", title: "Large Format", href: "/shop/canvas-prints/large-format-canvas" },
        { slug: "canvas-collages", title: "Canvas Collages", href: "/shop/canvas-prints/canvas-collages" },
        { slug: "triptych-canvas-split", title: "Triptych & Splits", href: "/shop/canvas-prints/triptych-canvas-split" },
        { slug: "hex-canvas-prints", title: "Hexagonal Canvas", href: "/shop/canvas-prints/hex-canvas-prints" },
        { slug: "rolled-canvas-prints", title: "Rolled Canvas", href: "/shop/canvas-prints/rolled-canvas-prints" },
      ],
    },
    "windows-walls-floors": {
      title: "Windows/Walls/Floors Decals",
      icon: "\uD83E\uDE9F",
      subGroups: [
        // ── Window Films ──
        { slug: "static-clings", title: "Static Clings", href: "/shop/windows-walls-floors/static-clings" },
        { slug: "adhesive-films", title: "Adhesive Films", href: "/shop/windows-walls-floors/adhesive-films" },
        { slug: "one-way-vision", title: "One-Way Vision", href: "/shop/windows-walls-floors/one-way-vision" },
        { slug: "privacy-films", title: "Privacy Films", href: "/shop/windows-walls-floors/privacy-films" },
        // ── Lettering & Window Graphics ──
        { slug: "window-lettering", title: "Window Lettering", href: "/shop/windows-walls-floors/window-lettering" },
        { slug: "window-graphics", title: "Window Graphics", href: "/shop/windows-walls-floors/window-graphics" },
        // ── Wall & Floor ──
        { slug: "wall-graphics", title: "Wall Graphics", href: "/shop/windows-walls-floors/wall-graphics" },
        { slug: "floor-graphics", title: "Floor Graphics", href: "/shop/windows-walls-floors/floor-graphics" },
      ],
    },
    "vehicle-graphics-fleet": {
      title: "Vehicle & Fleet Graphics",
      icon: "\uD83D\uDE9A",
      subGroups: [
        // ── Vehicle Branding ──
        { slug: "vehicle-wraps", title: "Vehicle Wraps", href: "/shop/vehicle-graphics-fleet/vehicle-wraps" },
        { slug: "door-panel-graphics", title: "Door & Panel", href: "/shop/vehicle-graphics-fleet/door-panel-graphics" },
        { slug: "vehicle-decals", title: "Decals & Lettering", href: "/shop/vehicle-graphics-fleet/vehicle-decals" },
        { slug: "magnetic-signs", title: "Magnetic Signs", href: "/shop/vehicle-graphics-fleet/magnetic-signs" },
        // ── Fleet & Safety ──
        { slug: "fleet-packages", title: "Fleet Packages", href: "/shop/vehicle-graphics-fleet/fleet-packages" },
        // ── Compliance & Identification ──
        { slug: "dot-mc-numbers", title: "DOT & MC Numbers", href: "/shop/vehicle-graphics-fleet/dot-mc-numbers" },
        { slug: "unit-weight-ids", title: "Unit & Weight IDs", href: "/shop/vehicle-graphics-fleet/unit-weight-ids" },
        { slug: "spec-labels", title: "Spec Labels", href: "/shop/vehicle-graphics-fleet/spec-labels" },
        { slug: "inspection-compliance", title: "Inspection & Compliance", href: "/shop/vehicle-graphics-fleet/inspection-compliance" },
      ],
    },
  },

  departmentMeta: {
    "marketing-business-print": { title: "Marketing & Business Print" },
    "stickers-labels-decals": { title: "Stickers & Labels" },
    "signs-rigid-boards": { title: "Signs & Rigid Boards" },
    "banners-displays": { title: "Banners & Displays" },
    "canvas-prints": { title: "Canvas Prints" },
    "windows-walls-floors": { title: "Windows/Walls/Floors Decals" },
    "vehicle-graphics-fleet": { title: "Vehicle & Fleet Graphics" },
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
