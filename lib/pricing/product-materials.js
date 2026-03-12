// lib/pricing/product-materials.js
// Product-level material resolution for admin pricing surfaces.
//
// Returns the valid material options for a specific product —
// narrower than template-level options. Prevents quoting a
// business card with NCR stock or a flyer with cardstock.

// ── Business cards: fixed material, not configurable ──────────────────────────
// These use outsourced fixedPrices keyed by sizeLabel.
// Material input is irrelevant — the stock IS the product.
const BUSINESS_CARD_SLUGS = new Set([
  "business-cards-classic",
  "business-cards-gloss",
  "business-cards-matte",
  "business-cards-soft-touch",
  "business-cards-gold-foil",
  "business-cards-linen",
  "business-cards-pearl",
  "business-cards-thick",
  "magnets-business-card",
]);

// ── Canvas: fixed (hardcoded canvas material, not configurable) ──────────────
const CANVAS_SLUGS = new Set([
  "canvas-standard",
  "canvas-gallery-wrap",
  "canvas-framed",
  "canvas-panoramic",
  "canvas-split-2",
  "canvas-split-3",
  "canvas-split-5",
]);

// ── Stamps: fixed (outsourced, price is per stamp model/size) ─────────────────
const STAMP_SLUGS = new Set([
  "stamps-s510", "stamps-s520", "stamps-s542", "stamps-s827",
  "stamps-r512", "stamps-r524", "stamps-r532", "stamps-r552",
  "funny-approval-stamp", "custom-face-stamp", "book-name-stamp",
]);

// ── Sample packs: fixed price, not configurable ──────────────────────────────
const SAMPLE_PACK_SLUGS = new Set([
  "sticker-sample-pack", "business-card-sample-pack",
]);

// ── NCR: fixed material by part count ─────────────────────────────────────────
const NCR_FIXED = {
  "ncr-forms-duplicate": { id: "ncr_2part", label: "NCR 2-Part" },
  "ncr-forms-triplicate": { id: "ncr_3part", label: "NCR 3-Part" },
  "ncr-invoices": { id: "ncr_4part", label: "NCR 4-Part" },
};

// ── Paper print products: valid paper IDs per slug ────────────────────────────
// Derived from marketing-print-order-config.js PRINT_TYPES[].papers[]
const CARDSTOCK_OPTIONS = [
  { id: "14pt-gloss", label: "14pt Gloss Cardstock" },
  { id: "14pt-matte", label: "14pt Matte Cardstock" },
];
const CARDSTOCK_HEAVY = [
  ...CARDSTOCK_OPTIONS,
  { id: "16pt-matte", label: "16pt Matte Cardstock" },
];
const COATED_TEXT_OPTIONS = [
  { id: "100lb-gloss-text", label: "100lb Gloss Text" },
  { id: "80lb-gloss-text", label: "80lb Gloss Text" },
  { id: "80lb-matte-text", label: "80lb Matte Text" },
];
const BOND_OPTIONS = [
  { id: "20lb_bond", label: "20lb Bond" },
];

const PAPER_PRODUCT_OPTIONS = {
  // ── Cardstock products (14pt) ──
  "postcards": CARDSTOCK_OPTIONS,
  "rack-cards": CARDSTOCK_OPTIONS,
  "door-hangers-standard": CARDSTOCK_OPTIONS,
  "door-hangers-perforated": CARDSTOCK_OPTIONS,
  "door-hangers-large": CARDSTOCK_OPTIONS,
  "greeting-cards": CARDSTOCK_OPTIONS,
  "loyalty-cards": [{ id: "14pt-gloss", label: "14pt Gloss Cardstock" }],
  "shelf-talkers": [{ id: "14pt-gloss", label: "14pt Gloss Cardstock" }],
  "shelf-danglers": [{ id: "14pt-gloss", label: "14pt Gloss Cardstock" }],
  "shelf-wobblers": [{ id: "14pt-gloss", label: "14pt Gloss Cardstock" }],
  "inserts-packaging": CARDSTOCK_HEAVY,
  "presentation-folders": CARDSTOCK_HEAVY,
  "table-tents": [{ id: "14pt-gloss", label: "14pt Gloss Cardstock" }],
  "invitation-cards": [{ id: "14pt-gloss", label: "14pt Gloss Cardstock" }],
  "bookmarks": [{ id: "14pt-gloss", label: "14pt Gloss Cardstock" }],
  "coupons": [
    { id: "100lb-gloss-text", label: "100lb Gloss Text" },
    { id: "14pt-gloss", label: "14pt Gloss Cardstock" },
  ],
  "tickets": [
    { id: "100lb-gloss-text", label: "100lb Gloss Text" },
    { id: "14pt-gloss", label: "14pt Gloss Cardstock" },
  ],
  "tags": [{ id: "14pt-gloss", label: "14pt Gloss Cardstock" }],

  // ── Coated text products ──
  "flyers": COATED_TEXT_OPTIONS,
  "brochures-bi-fold": COATED_TEXT_OPTIONS,
  "brochures-tri-fold": COATED_TEXT_OPTIONS,
  "brochures-z-fold": COATED_TEXT_OPTIONS,
  "table-mat": [
    { id: "100lb-gloss-text", label: "100lb Gloss Text" },
    { id: "80lb-gloss-text", label: "80lb Gloss Text" },
  ],
  "menus-takeout": [
    { id: "20lb_bond", label: "20lb Bond" },
    { id: "100lb-gloss-text", label: "100lb Gloss Text" },
  ],
  "calendars-wall": [{ id: "100lb-gloss-text", label: "100lb Gloss Text" }],
  "calendars-desk": [{ id: "100lb-gloss-text", label: "100lb Gloss Text" }],

  // ── Bond / offset products ──
  "notepads": [
    { id: "70lb-offset", label: "70lb Offset" },
    { id: "60lb-recycled", label: "60lb Recycled" },
  ],
  "document-printing": BOND_OPTIONS,

  // ── Laminated menus ──
  "menus-laminated": CARDSTOCK_OPTIONS,

  // ── Letterhead / envelope products ──
  "letterheads": [
    { id: "70lb-white-offset", label: "70lb White Offset" },
    { id: "24lb-bond", label: "24lb Bond" },
  ],
  "envelopes": [
    { id: "envelope_regular", label: "Envelope #10 Regular" },
    { id: "envelope_window", label: "Envelope #10 Window" },
  ],

  // ── Poster (uses poster_fixed pricing, material is decorative) ──
  "posters": [
    { id: "100lb-gloss", label: "100lb Gloss Coated" },
    { id: "100lb-matte", label: "100lb Matte Coated" },
  ],
};

// ── Booklet products: interior paper options ─────────────────────────────────
const BOOKLET_INTERIOR_OPTIONS = [
  { id: "100lb-gloss-text", label: "100lb Gloss Text" },
  { id: "100lb-matte-text", label: "100lb Matte Text" },
  { id: "80lb-uncoated", label: "80lb Uncoated" },
  { id: "70lb-offset", label: "70lb Offset" },
];
const BOOKLET_PRODUCT_OPTIONS = {
  "booklets-saddle-stitch": BOOKLET_INTERIOR_OPTIONS,
  "booklets-perfect-bound": BOOKLET_INTERIOR_OPTIONS,
  "booklets-wire-o": BOOKLET_INTERIOR_OPTIONS,
};

// ── Sticker products: per cutting-type materials ──────────────────────────────
const VINYL_MATERIALS = [
  { id: "white-vinyl", label: "White Vinyl" },
  { id: "matte-vinyl", label: "Matte Vinyl" },
  { id: "clear-vinyl", label: "Clear Vinyl" },
  { id: "frosted-vinyl", label: "Frosted Vinyl" },
  { id: "holographic-vinyl", label: "Holographic Film" },
  { id: "3m-reflective", label: "3M Reflective" },
  { id: "heavy-duty-vinyl", label: "Heavy Duty Vinyl" },
];
const CLING_MATERIALS = [
  { id: "clear-static-cling", label: "Clear Static Cling" },
  { id: "frosted-static-cling", label: "Frosted Static Cling" },
  { id: "white-static-cling", label: "White Static Cling" },
];

const STICKER_PRODUCT_OPTIONS = {
  "die-cut-stickers": [...VINYL_MATERIALS, ...CLING_MATERIALS],
  "kiss-cut-stickers": VINYL_MATERIALS,
  "sticker-sheets": [
    { id: "gloss-paper", label: "Gloss Paper (Label)" },
    { id: "matte-paper", label: "Matte Paper (Label)" },
    { id: "soft-touch-paper", label: "Soft Touch Paper" },
    ...VINYL_MATERIALS,
    { id: "foil-stamping", label: "Foil Stamping" },
  ],
  "kiss-cut-sticker-sheets": [
    { id: "gloss-paper", label: "Gloss Paper (Label)" },
    { id: "matte-paper", label: "Matte Paper (Label)" },
    ...VINYL_MATERIALS,
  ],
  "roll-labels": [
    { id: "white-gloss-bopp", label: "White Gloss BOPP" },
    { id: "clear-bopp", label: "Clear BOPP" },
    { id: "silver-brushed-bopp", label: "Silver Brushed BOPP" },
    { id: "freezer-grade-bopp", label: "Freezer Grade BOPP" },
  ],
  "vinyl-lettering": [
    { id: "outdoor", label: "Outdoor Vinyl" },
    { id: "indoor", label: "Indoor Vinyl" },
    { id: "reflective", label: "Reflective" },
  ],
};

// ── Windows/Walls/Floors: per-product materials ──────────────────────────────
const WWF_PRODUCT_OPTIONS = {
  "window-graphics-transparent-color": [
    { id: "transparent-film", label: "Transparent Film" },
    { id: "clear-film", label: "Clear Film" },
  ],
  "one-way-vision": [
    { id: "perforated-vinyl", label: "Perforated Vinyl" },
  ],
  "window-graphics-blockout": [
    { id: "blockout-vinyl", label: "Blockout Vinyl (Permanent)" },
    { id: "blockout-vinyl-rem", label: "Blockout Vinyl (Removable)" },
  ],
  "frosted-window-graphics": [
    { id: "frosted-film", label: "Frosted Vinyl" },
  ],
  "static-cling-frosted": [
    { id: "static-cling-frosted", label: "Frosted Static Cling" },
  ],
  "window-graphics-standard": [
    { id: "white-vinyl", label: "White Vinyl" },
    { id: "removable-white", label: "Removable White Vinyl" },
  ],
  "window-graphics-double-sided": [
    { id: "clear-vinyl", label: "Clear Vinyl (Double-Sided)" },
  ],
  "static-cling-standard": [
    { id: "static-cling-clear", label: "Clear Static Cling" },
  ],
  "wall-graphics": [
    { id: "wall-repositionable", label: "Repositionable Vinyl" },
    { id: "wall-permanent", label: "Permanent Vinyl" },
  ],
  "floor-graphics": [
    { id: "floor-vinyl", label: "Floor Vinyl (Non-Slip)" },
    { id: "floor-anti-slip", label: "Anti-Slip Floor Vinyl" },
  ],
};

// ── Banner products ───────────────────────────────────────────────────────────
const BANNER_PRODUCT_OPTIONS = {
  "vinyl-banner": [
    { id: "13oz-vinyl", label: "13oz Frontlit Vinyl" },
    { id: "15oz-blockout", label: "15oz Blockout" },
  ],
  "mesh-banner": [
    { id: "mesh-standard", label: "Mesh Standard (8oz)" },
    { id: "mesh-heavy", label: "Mesh Heavy" },
  ],
  "fabric-banner": [
    { id: "polyester", label: "Polyester" },
    { id: "satin", label: "Satin" },
  ],
  "pole-banner": [
    { id: "18oz-vinyl", label: "18oz Vinyl" },
    { id: "polyester", label: "Polyester" },
  ],
  "retractable-banner": [
    { id: "premium-vinyl", label: "PET Grey Back (Roll-up)" },
  ],
  "x-banner-stand": [
    { id: "premium-vinyl", label: "PET Grey Back (Roll-up)" },
  ],
  "feather-flag": [
    { id: "polyester", label: "Polyester" },
  ],
  "teardrop-flag": [
    { id: "polyester", label: "Polyester" },
  ],
  "backdrop": [
    { id: "vinyl", label: "Vinyl" },
    { id: "fabric", label: "Fabric" },
  ],
};

// ── Sign products ─────────────────────────────────────────────────────────────
const SIGN_PRODUCT_OPTIONS = {
  "yard-signs": [
    { id: "coroplast_4mm", label: "Coroplast 4mm" },
    { id: "coroplast_6mm", label: "Coroplast 6mm" },
  ],
  "foam-board-signs": [
    { id: "foam_5mm", label: "Foam Board 5mm" },
    { id: "foam_10mm", label: "Foam Board 10mm" },
  ],
  "aluminum-signs": [
    { id: "aluminum-040", label: "Aluminum 0.040\"" },
    { id: "aluminum-063", label: "Aluminum 0.063\"" },
    { id: "acm-dibond", label: "ACM / Dibond" },
  ],
  "pvc-signs": [
    { id: "pvc_3mm", label: "PVC Board 3mm" },
  ],
  "a-frame-signs": [
    { id: "coroplast_6mm", label: "Coroplast 6mm" },
    { id: "coroplast_10mm", label: "Coroplast 10mm" },
  ],
  "real-estate-signs": [
    { id: "coroplast_6mm", label: "Coroplast 6mm" },
    { id: "coroplast_10mm", label: "Coroplast 10mm" },
  ],
};

// ── Vehicle products ──────────────────────────────────────────────────────────
const VEHICLE_PRODUCT_OPTIONS = {
  "vehicle-decals": [
    { id: "cast-vinyl", label: "Cast Vinyl" },
    { id: "reflective", label: "Reflective Vinyl" },
  ],
  "long-term-outdoor-vehicle-decals": [
    { id: "cast-vinyl", label: "Cast Vinyl" },
    { id: "reflective", label: "Reflective Vinyl" },
  ],
  "partial-wrap-spot-graphics": [
    { id: "cast-vinyl", label: "Cast Vinyl" },
    { id: "calendered", label: "Calendered Vinyl" },
  ],
  "printed-truck-door-decals-full-color": [
    { id: "cast-vinyl", label: "Cast Vinyl" },
    { id: "calendered", label: "Calendered Vinyl" },
  ],
  "magnetic-car-signs": [
    { id: "magnetic-30mil", label: "Magnetic 30mil" },
  ],
  "dot-numbers": [
    { id: "outdoor-vinyl", label: "Outdoor Vinyl" },
    { id: "reflective", label: "Reflective Vinyl" },
  ],
  "usdot-number-decals": [
    { id: "outdoor-vinyl", label: "Outdoor Vinyl" },
    { id: "reflective", label: "Reflective Vinyl" },
  ],
  "truck-door-compliance-kit": [
    { id: "outdoor-vinyl", label: "Outdoor Vinyl" },
    { id: "reflective", label: "Reflective Vinyl" },
  ],
};

// ═══════════════════════════════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════════════════════════════

/**
 * Get material options for a specific product.
 *
 * @param {string} slug - product slug
 * @returns {{ type: "fixed", material?: string, label?: string } | { type: "options", options: Array<{id: string, label: string}> } | null}
 *   - "fixed": material is not configurable (business cards, NCR)
 *   - "options": constrained set of valid materials
 *   - null: no product-level info, fall back to template-level
 */
export function getProductMaterials(slug) {
  if (!slug) return null;

  // Business cards: fixed (outsourced pricing, stock IS the product)
  if (BUSINESS_CARD_SLUGS.has(slug)) {
    return { type: "fixed", source: "product", label: "Stock fixed by product type (outsourced pricing)" };
  }

  // Canvas: fixed (hardcoded canvas material)
  if (CANVAS_SLUGS.has(slug)) {
    return { type: "fixed", source: "product", label: "Canvas (cotton canvas — material hardcoded)" };
  }

  // Stamps: fixed (outsourced, price per stamp model)
  if (STAMP_SLUGS.has(slug)) {
    return { type: "fixed", source: "product", label: "Stamp (outsourced — price per model/size)" };
  }

  // Sample packs: fixed price
  if (SAMPLE_PACK_SLUGS.has(slug)) {
    return { type: "fixed", source: "product", label: "Sample pack (fixed price)" };
  }

  // NCR: fixed by part count
  const ncr = NCR_FIXED[slug];
  if (ncr) {
    return { type: "fixed", source: "product", material: ncr.id, label: ncr.label };
  }

  // Paper print products
  const papers = PAPER_PRODUCT_OPTIONS[slug];
  if (papers) {
    return { type: "options", source: "product", options: papers };
  }

  // Booklet products
  const bookletMats = BOOKLET_PRODUCT_OPTIONS[slug];
  if (bookletMats) {
    return { type: "options", source: "product", options: bookletMats };
  }

  // Sticker products
  const stickerMats = STICKER_PRODUCT_OPTIONS[slug];
  if (stickerMats) {
    return { type: "options", source: "product", options: stickerMats };
  }

  // Windows/Walls/Floors products
  const wwfMats = WWF_PRODUCT_OPTIONS[slug];
  if (wwfMats) {
    return { type: "options", source: "product", options: wwfMats };
  }

  // Banner products
  const bannerMats = BANNER_PRODUCT_OPTIONS[slug];
  if (bannerMats) {
    return { type: "options", source: "product", options: bannerMats };
  }

  // Sign products
  const signMats = SIGN_PRODUCT_OPTIONS[slug];
  if (signMats) {
    return { type: "options", source: "product", options: signMats };
  }

  // Vehicle products
  const vehicleMats = VEHICLE_PRODUCT_OPTIONS[slug];
  if (vehicleMats) {
    return { type: "options", source: "product", options: vehicleMats };
  }

  // Tabletop displays: fixed (marketing-print category but uses banner materials)
  if (slug === "tabletop-displays") {
    return { type: "fixed", source: "product", label: "Tabletop display (specialty — quote for pricing)" };
  }

  // No product-level info — caller should use template-level fallback
  return null;
}

/**
 * Validate a material against product-level constraints.
 *
 * @param {string} materialAlias - material ID from operator input
 * @param {string} slug - product slug
 * @returns {{ valid: boolean, reason?: string }}
 */
export function validateMaterialForProduct(materialAlias, slug) {
  if (!materialAlias || !slug) return { valid: true };

  const productMats = getProductMaterials(slug);
  if (!productMats) return { valid: true }; // no product-level constraint

  if (productMats.type === "fixed") {
    // If material is supplied for a fixed-stock product, it must match the fixed material (if any)
    if (productMats.material && materialAlias !== productMats.material) {
      return {
        valid: false,
        reason: `"${slug}" uses fixed stock: ${productMats.label}. Material "${materialAlias}" is not applicable.`,
      };
    }
    // If no specific material (business cards), any material input is invalid
    if (!productMats.material) {
      return {
        valid: false,
        reason: `"${slug}" uses fixed pricing — material is determined by the product type, not selectable.`,
      };
    }
    return { valid: true };
  }

  if (productMats.type === "options") {
    const validIds = new Set(productMats.options.map((o) => o.id));
    if (!validIds.has(materialAlias)) {
      const validList = productMats.options.map((o) => o.id).join(", ");
      return {
        valid: false,
        reason: `"${materialAlias}" is not a valid stock for "${slug}". Valid options: ${validList}`,
      };
    }
    return { valid: true };
  }

  return { valid: true };
}
