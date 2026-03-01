// lib/design-studio/product-configs.js — Product print specifications registry

// --- Helper: shorthand spec builders ---
const s300 = (label, w, h) => ({ label, widthIn: w, heightIn: h, bleedIn: 0.125, safeIn: 0.125, dpi: 300, sides: 1, editorMode: "single" });
const s150 = (label, w, h) => ({ label, widthIn: w, heightIn: h, bleedIn: 0.125, safeIn: 0.125, dpi: 150, sides: 1, editorMode: "single" });
const large = (label, w, h) => ({ label, widthIn: w, heightIn: h, bleedIn: 0.25, safeIn: 0.5, dpi: 150, sides: 1, editorMode: "single" });
const sign = (label, w, h) => ({ label, widthIn: w, heightIn: h, bleedIn: 0.125, safeIn: 0.25, dpi: 150, sides: 1, editorMode: "single" });

export const PRODUCT_PRINT_SPECS = {
  // ══════════════════════════════════════════
  // BUSINESS CARDS & CARD PRODUCTS
  // ══════════════════════════════════════════
  "business-cards":         s300("Business Cards",         3.5,  2),
  "business-cards-classic": s300("Classic Business Cards", 3.5,  2),
  "business-cards-gloss":   s300("Gloss Business Cards",   3.5,  2),
  "business-cards-matte":   s300("Matte Business Cards",   3.5,  2),
  "business-cards-thick":   s300("Thick Business Cards",   3.5,  2),
  "business-cards-linen":   s300("Linen Business Cards",   3.5,  2),
  "business-cards-pearl":   s300("Pearl Business Cards",   3.5,  2),
  "business-cards-soft-touch": s300("Soft Touch Business Cards", 3.5, 2),
  "business-cards-gold-foil":  s300("Gold Foil Business Cards",  3.5, 2),
  "loyalty-cards":          s300("Loyalty Cards",           3.5,  2),
  "magnets-business-card":  s300("Business Card Magnets",  3.5,  2),
  "invitation-cards":       s300("Invitation Cards",        5,    7),
  "greeting-cards":         s300("Greeting Cards",          5,    7),

  // ══════════════════════════════════════════
  // POSTCARDS & MAILERS
  // ══════════════════════════════════════════
  postcards:                s300("Postcards",               6,    4),

  // ══════════════════════════════════════════
  // FLYERS & FLAT PRINTS
  // ══════════════════════════════════════════
  flyers:                   s300("Flyers",                  8.5,  11),
  brochures:                s300("Brochures",               8.5,  11),
  certificates:             s300("Certificates",            8.5,  11),
  "waivers-releases":       s300("Waivers & Releases",      8.5,  11),
  "order-forms":            s300("Order Forms",             8.5,  11),
  letterheads:              s300("Letterheads",             8.5,  11),
  letterhead:               s300("Letterheads",             8.5,  11),
  notepads:                 s300("Notepads",                5.5,  8.5),

  // ══════════════════════════════════════════
  // MENUS & TABLE PRODUCTS
  // ══════════════════════════════════════════
  menus:                    s300("Menus",                   8.5,  11),
  "table-tents":            s300("Table Tents",             4,    6),

  // ══════════════════════════════════════════
  // RACK CARDS & DOOR HANGERS
  // ══════════════════════════════════════════
  "rack-cards":             s300("Rack Cards",              4,    9),
  "door-hangers":           s300("Door Hangers",            4.25, 11),

  // ══════════════════════════════════════════
  // BOOKMARKS, TICKETS, TAGS, COUPONS
  // ══════════════════════════════════════════
  bookmarks:                s300("Bookmarks",               2,    6),
  tickets:                  s300("Tickets",                 5.5,  2),
  tags:                     s300("Hang Tags",               2,    3.5),
  "retail-tags":            s300("Retail Tags",             2,    3),
  coupons:                  s300("Coupons",                 3.5,  2),
  "inserts-packaging":      s300("Packaging Inserts",       4,    6),
  stamps:                   s300("Stamps",                  2.5,  1.5),

  // ══════════════════════════════════════════
  // ENVELOPES & FOLDERS
  // ══════════════════════════════════════════
  envelopes:                s300("Envelopes",               9.5,  4.125),
  "presentation-folders":   s300("Presentation Folders",    9,    12),

  // ══════════════════════════════════════════
  // POSTERS (higher DPI for small, lower for large)
  // ══════════════════════════════════════════
  posters:                  s150("Posters",                 18,   24),

  // ══════════════════════════════════════════
  // STICKERS & LABELS
  // ══════════════════════════════════════════
  "die-cut-stickers":       s300("Die-Cut Stickers",        3,    3),
  "kiss-cut-stickers":      s300("Kiss-Cut Stickers",       3,    3),
  "sticker-sheets":         s300("Sticker Sheets",          8.5,  11),
  "sticker-rolls":          s300("Roll Labels",             2,    2),
  "roll-labels":            s300("Roll Labels",             2,    2),
  decals:                   s300("Decals",                  6,    6),
  "industrial-labels":      s300("Industrial Labels",       4,    6),
  "safety-labels":          s300("Safety Labels",           4,    6),

  // ══════════════════════════════════════════
  // BANNERS (large format, 150 DPI, bigger bleed)
  // ══════════════════════════════════════════
  banners:                  large("Vinyl Banners",          48,   24),
  "vinyl-banners":          large("Vinyl Banners",          48,   24),
  "mesh-banners":           large("Mesh Banners",           72,   36),
  "fabric-banners":         large("Fabric Banners",         48,   24),
  flags:                    large("Flags",                  24,   84),
  backdrops:                large("Backdrops",              96,   96),

  // ══════════════════════════════════════════
  // RETRACTABLE & DISPLAY STANDS
  // ══════════════════════════════════════════
  "retractable-stands":     large("Retractable Stands",     33,   81),
  "x-banner-stands":        large("X-Banner Stands",        24,   63),
  "tabletop-displays":      s150("Tabletop Displays",       11,   17),

  // ══════════════════════════════════════════
  // RIGID SIGNS
  // ══════════════════════════════════════════
  "yard-signs":             sign("Yard Signs",              24,   18),
  "a-frame-signs":          sign("A-Frame Signs",           24,   36),
  "foam-board-signs":       sign("Foam Board Signs",        18,   24),
  "aluminum-signs":         sign("Aluminum Signs",          18,   24),
  "pvc-signs":              sign("PVC Signs",               18,   24),
  "magnetic-signs":         sign("Magnetic Signs",          18,   24),
  signs:                    sign("Signs",                   18,   24),

  // ══════════════════════════════════════════
  // WINDOW, WALL & FLOOR GRAPHICS
  // ══════════════════════════════════════════
  "window-films":           large("Window Films",           36,   48),
  "wall-floor-graphics":    large("Wall & Floor Graphics",  36,   48),

  // ══════════════════════════════════════════
  // VEHICLE GRAPHICS
  // ══════════════════════════════════════════
  "vehicle-decals":         s150("Vehicle Decals",          24,   12),
  "vehicle-wraps":          large("Vehicle Wraps",          144,  48),
  vehicle:                  large("Vehicle Graphics",       72,   36),
  "vinyl-lettering":        s150("Vinyl Lettering",         24,   6),

  // ══════════════════════════════════════════
  // CANVAS PRINTS
  // ══════════════════════════════════════════
  "canvas-prints":          s150("Canvas Prints",           16,   20),
  canvas:                   s150("Canvas Prints",           16,   20),

  // ══════════════════════════════════════════
  // CALENDARS
  // ══════════════════════════════════════════
  calendars:                s300("Calendars",               8.5,  11),

  // ══════════════════════════════════════════
  // SHELF DISPLAYS
  // ══════════════════════════════════════════
  "shelf-displays":         s300("Shelf Displays",          4,    5),
};

/**
 * Get product specification by slug.
 * Supports custom dimensions via URL params override.
 */
export function getProductSpec(slug, overrides = {}) {
  const base = PRODUCT_PRINT_SPECS[slug];
  if (!base) return null;

  return {
    ...base,
    slug,
    widthIn: overrides.width ? parseFloat(overrides.width) : base.widthIn,
    heightIn: overrides.height ? parseFloat(overrides.height) : base.heightIn,
    sides: overrides.sides ? parseInt(overrides.sides, 10) : base.sides,
  };
}

/**
 * Convert spec inches to pixel dimensions (includes bleed).
 * Returns the full canvas size at target DPI.
 */
export function getCanvasDimensions(spec) {
  const totalWidthIn = spec.widthIn + spec.bleedIn * 2;
  const totalHeightIn = spec.heightIn + spec.bleedIn * 2;

  return {
    width: Math.round(totalWidthIn * spec.dpi),
    height: Math.round(totalHeightIn * spec.dpi),
    // Bleed/safe in pixels
    bleedPx: Math.round(spec.bleedIn * spec.dpi),
    safePx: Math.round(spec.safeIn * spec.dpi),
    // Trim area (no bleed)
    trimWidth: Math.round(spec.widthIn * spec.dpi),
    trimHeight: Math.round(spec.heightIn * spec.dpi),
  };
}

/**
 * Calculate display scale to fit canvas inside a container.
 */
export function getDisplayScale(spec, containerWidth, containerHeight) {
  const dims = getCanvasDimensions(spec);
  const scaleX = containerWidth / dims.width;
  const scaleY = containerHeight / dims.height;
  return Math.min(scaleX, scaleY, 1); // never scale up
}
