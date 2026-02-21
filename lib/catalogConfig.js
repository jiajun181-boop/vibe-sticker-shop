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
        // Marketing Materials
        { slug: "flyers", title: "Flyers", href: "/shop/marketing-business-print/flyers" },
        { slug: "brochures", title: "Brochures", href: "/shop/marketing-business-print/brochures" },
        { slug: "door-hangers", title: "Door Hangers", href: "/shop/marketing-business-print/door-hangers" },
        { slug: "greeting-invitation-cards", title: "Greeting & Invitation Cards", href: "/shop/marketing-business-print/greeting-invitation-cards" },
        { slug: "tickets-coupons", title: "Tickets, Coupons & Loyalty", href: "/shop/marketing-business-print/tickets-coupons" },
        { slug: "menus", title: "Menus", href: "/shop/marketing-business-print/menus" },
        { slug: "posters", title: "Posters", href: "/shop/marketing-business-print/posters" },
        { slug: "postcards", title: "Postcards", href: "/shop/marketing-business-print/postcards" },
        { slug: "rack-cards", title: "Rack Cards", href: "/shop/marketing-business-print/rack-cards" },
        { slug: "booklets", title: "Booklets", href: "/shop/marketing-business-print/booklets" },
        { slug: "bookmarks", title: "Bookmarks", href: "/shop/marketing-business-print/bookmarks" },
        { slug: "calendars", title: "Calendars", href: "/shop/marketing-business-print/calendars" },
        // Business Essentials
        { slug: "business-cards", title: "Business Cards", href: "/shop/marketing-business-print/business-cards" },
        { slug: "stamps", title: "Stamps", href: "/shop/marketing-business-print/stamps" },
        { slug: "letterhead", title: "Letterhead", href: "/shop/marketing-business-print/letterhead" },
        { slug: "envelopes", title: "Envelopes", href: "/shop/marketing-business-print/envelopes" },
        { slug: "notepads", title: "Notepads", href: "/shop/marketing-business-print/notepads" },
        { slug: "ncr-forms", title: "NCR Forms", href: "/shop/marketing-business-print/ncr-forms" },
        { slug: "document-printing", title: "Document Printing", href: "/shop/marketing-business-print/document-printing" },
        { slug: "certificates", title: "Certificates", href: "/shop/marketing-business-print/certificates" },
        // Retail & Point of Sale
        { slug: "shelf-displays", title: "Shelf Displays", href: "/shop/marketing-business-print/shelf-displays" },
        { slug: "table-tents", title: "Table Tents", href: "/shop/marketing-business-print/table-tents" },
      ],
    },
    "stickers-labels-decals": {
      title: "Custom Stickers & Labels",
      icon: "\uD83C\uDFF7\uFE0F",
      subGroups: [
        { slug: "die-cut-stickers", title: "Die-Cut Stickers", href: "/shop/stickers-labels-decals/die-cut-stickers" },
        { slug: "kiss-cut-singles", title: "Kiss-Cut Stickers", href: "/shop/stickers-labels-decals/kiss-cut-singles" },
        { slug: "sticker-pages", title: "Sticker Sheets", href: "/shop/stickers-labels-decals/sticker-pages" },
        { slug: "sticker-rolls", title: "Roll Labels", href: "/shop/stickers-labels-decals/sticker-rolls" },
        { slug: "vinyl-lettering", title: "Vinyl Lettering", href: "/shop/stickers-labels-decals/vinyl-lettering" },
      ],
    },
    "signs-rigid-boards": {
      title: "Signs & Display Boards",
      icon: "\uD83E\uDEA7",
      subGroups: [
        // ── Outdoor Coroplast Signs ──
        { slug: "yard-sign", title: "Yard & Lawn Signs", href: "/shop/signs-rigid-boards/yard-sign" },
        { slug: "real-estate-sign", title: "Real Estate Signs", href: "/shop/signs-rigid-boards/real-estate-sign" },
        { slug: "election-signs", title: "Election & Campaign Signs", href: "/shop/signs-rigid-boards/election-signs" },
        { slug: "open-house-signs", title: "Open House Signs", href: "/shop/signs-rigid-boards/open-house-signs" },
        { slug: "directional-signs", title: "Directional Signs", href: "/shop/signs-rigid-boards/directional-signs" },
        // ── Indoor Boards ──
        { slug: "pvc-board-signs", title: "PVC Board Signs", href: "/shop/signs-rigid-boards/pvc-board-signs" },
        { slug: "selfie-frame-board", title: "Event & Photo Boards", href: "/shop/signs-rigid-boards/selfie-frame-board" },
        { slug: "welcome-sign-board", title: "Event Signs", href: "/shop/signs-rigid-boards/welcome-sign-board" },
        { slug: "tri-fold-presentation-board", title: "Presentation Boards", href: "/shop/signs-rigid-boards/tri-fold-presentation-board" },
        // ── Accessories ──
        { slug: "a-frame-sign-stand", title: "A-Frame Signs", href: "/shop/signs-rigid-boards/a-frame-sign-stand" },
        { slug: "h-stakes", title: "H-Wire Stakes", href: "/shop/signs-rigid-boards/h-stakes" },
        { slug: "real-estate-frame", title: "Real Estate Frames", href: "/shop/signs-rigid-boards/real-estate-frame" },
      ],
    },
    "banners-displays": {
      title: "Banners & Displays",
      icon: "\uD83C\uDFF3\uFE0F",
      subGroups: [
        // ── Banners ──
        { slug: "vinyl-banners", title: "Vinyl Banners", href: "/order/vinyl-banners", description: "Durable 13oz–15oz vinyl for indoor/outdoor use", badges: ["Same Day Available"] },
        { slug: "mesh-banners", title: "Mesh Banners", href: "/order/mesh-banners", description: "Wind-resistant mesh for outdoor & fences", badges: ["Outdoor"] },
        { slug: "pole-banners", title: "Pole Banners", href: "/order/vinyl-banners", description: "Street-level pole-mounted banners" },
        // ── Stands & Displays ──
        { slug: "retractable-stands", title: "Retractable Stands", href: "/order/retractable-stands", description: "Roll-up banner stands for trade shows", badges: ["In Stock"] },
        { slug: "x-banner-stands", title: "X-Banner Stands", href: "/order/x-banner-stands", description: "Lightweight X-frame display stands", badges: ["In Stock"] },
        { slug: "tabletop-displays", title: "Tabletop Displays", href: "/shop/banners-displays/tabletop-displays", description: "Compact displays for counters & tables" },
        { slug: "backdrops-popups", title: "Backdrops & Pop-Ups", href: "/order/backdrops", description: "Step-and-repeat, tension fabric & media walls" },
        // ── Outdoor & Events ──
        { slug: "flags-hardware", title: "Flags & Hardware", href: "/order/flags", description: "Feather flags, teardrop flags & bases" },
        { slug: "tents-outdoor", title: "Tents & Outdoor", href: "/shop/banners-displays/tents-outdoor", description: "Custom canopy tents & outdoor event displays" },
        { slug: "fabric-banners", title: "Fabric Banners", href: "/order/fabric-banners", description: "Premium dye-sublimation fabric banners" },
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
      title: "Windows, Walls & Floors",
      icon: "\uD83E\uDE9F",
      subGroups: [
        { slug: "one-way-vision", title: "One-Way Vision", href: "/shop/windows-walls-floors/one-way-vision" },
        { slug: "frosted-window-film", title: "Frosted Window Film", href: "/shop/windows-walls-floors/frosted-window-film" },
        { slug: "static-cling", title: "Static Cling", href: "/shop/windows-walls-floors/static-cling" },
        { slug: "transparent-color-film", title: "Transparent Color Film", href: "/shop/windows-walls-floors/transparent-color-film" },
        { slug: "blockout-vinyl", title: "Blockout Vinyl", href: "/shop/windows-walls-floors/blockout-vinyl" },
        { slug: "opaque-window-graphics", title: "Opaque Window Graphics", href: "/shop/windows-walls-floors/opaque-window-graphics" },
        { slug: "glass-waistline", title: "Glass Waistline", href: "/shop/windows-walls-floors/glass-waistline" },
        { slug: "wall-graphics", title: "Wall Graphics", href: "/shop/windows-walls-floors/wall-graphics" },
        { slug: "floor-graphics", title: "Floor Graphics", href: "/shop/windows-walls-floors/floor-graphics" },
      ],
    },
    "vehicle-graphics-fleet": {
      title: "Vehicle Graphics & Fleet Branding",
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
    "signs-rigid-boards": { title: "Signs & Display Boards" },
    "banners-displays": { title: "Banners & Displays" },
    "canvas-prints": { title: "Canvas Prints" },
    "windows-walls-floors": { title: "Windows, Walls & Floors" },
    "vehicle-graphics-fleet": { title: "Vehicle Graphics & Fleet Branding" },
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
