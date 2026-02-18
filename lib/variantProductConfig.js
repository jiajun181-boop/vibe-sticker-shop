/**
 * Variant product page configuration.
 * Maps parent "variant page" slugs to their child product slugs.
 * Used by VariantProductPage.js for style selectors.
 */

const VARIANT_PAGES = {
  stickers: {
    category: "custom-stickers",
    title: "Custom Stickers",
    metaTitle: "Custom Stickers | Die-Cut, Kiss-Cut, Holographic & More | La Lunar Printing",
    metaDescription:
      "Order custom stickers in any shape, size, or material. Die-cut, kiss-cut, holographic, clear, sheets, and more. Fast turnaround from La Lunar Printing.",
    description:
      "Choose your sticker style below. All stickers are printed in full colour on premium vinyl with weather-resistant lamination.",
    variants: [
      { slug: "die-cut-singles", label: "Die-Cut White", shortLabel: "Die-Cut", description: "Precision die-cut to any shape on white vinyl", isDefault: true },
      { slug: "clear-singles", label: "Die-Cut Clear", shortLabel: "Clear", description: "Transparent vinyl, die-cut to shape" },
      { slug: "holographic-singles", label: "Holographic", shortLabel: "Holo", description: "Rainbow holographic finish" },
      { slug: "removable-stickers", label: "Kiss-Cut", shortLabel: "Kiss-Cut", description: "Easy-peel on backing sheet" },
      { slug: "sticker-sheets", label: "Sheets", shortLabel: "Sheets", description: "Multiple stickers on one sheet" },
      { slug: "sticker-packs", label: "Sticker Packs", shortLabel: "Packs", description: "Bundled sticker packs" },
      { slug: "transfer-stickers", label: "Transfer", shortLabel: "Transfer", description: "Transfer vinyl stickers" },
      { slug: "static-cling-stickers", label: "Static Cling", shortLabel: "Cling", description: "Removable static cling, no adhesive" },
      { slug: "magnet-stickers", label: "Magnet", shortLabel: "Magnet", description: "Flexible magnetic vinyl" },
      { slug: "reflective-stickers", label: "Reflective", shortLabel: "Reflective", description: "High-visibility reflective vinyl" },
    ],
  },
  labels: {
    category: "custom-stickers",
    title: "Custom Labels",
    metaTitle: "Custom Labels | Roll Labels, Clear BOPP, Kraft Paper | La Lunar Printing",
    metaDescription:
      "Order custom labels on rolls. White BOPP, clear BOPP, and kraft paper options. Waterproof and tear-proof for product packaging.",
    description:
      "Choose your label material below. All labels are printed in full colour and supplied on rolls for easy application.",
    variants: [
      { slug: "roll-labels", label: "White BOPP", shortLabel: "White", description: "White tear-proof BOPP on rolls", isDefault: true },
      { slug: "clear-labels", label: "Clear BOPP", shortLabel: "Clear", description: "Transparent BOPP for a no-label look" },
      { slug: "kraft-paper-labels", label: "Kraft Paper", shortLabel: "Kraft", description: "Natural brown kraft for artisan products" },
    ],
  },
  decals: {
    category: "custom-stickers",
    title: "Custom Decals",
    metaTitle: "Custom Decals | Window, Floor & Vinyl Lettering | La Lunar Printing",
    metaDescription:
      "Order custom vinyl decals for windows, walls, floors, and vehicles. Indoor/outdoor durable vinyl with professional installation options.",
    description:
      "Choose your decal type below. All decals are printed on durable vinyl rated for indoor and outdoor use.",
    variants: [
      { slug: "window-decals", label: "Window Decals", shortLabel: "Window", description: "Durable vinyl for windows and walls", isDefault: true },
      { slug: "floor-decals", label: "Floor Decals", shortLabel: "Floor", description: "Anti-slip laminated for commercial floors" },
      { slug: "vinyl-lettering", label: "Vinyl Lettering", shortLabel: "Lettering", description: "Computer-cut text in any font/colour" },
    ],
  },
};

/**
 * Get variant page config by parent slug (e.g. "stickers", "labels", "decals").
 */
export function getVariantConfig(slug) {
  return VARIANT_PAGES[slug] ?? null;
}

/**
 * Reverse lookup: given a child product slug, return the parent variant page slug.
 * Used for redirecting old direct-product URLs to the variant page with ?style= param.
 */
const _childToParent = new Map();
for (const [parentSlug, config] of Object.entries(VARIANT_PAGES)) {
  for (const v of config.variants) {
    _childToParent.set(v.slug, parentSlug);
  }
}

export function getVariantParent(childSlug) {
  return _childToParent.get(childSlug) ?? null;
}

/**
 * Get all variant page slugs (for checking in routing).
 */
export function isVariantPage(slug) {
  return slug in VARIANT_PAGES;
}

/**
 * Get all child slugs for a variant page.
 */
export function getVariantChildSlugs(parentSlug) {
  const config = VARIANT_PAGES[parentSlug];
  if (!config) return [];
  return config.variants.map((v) => v.slug);
}
