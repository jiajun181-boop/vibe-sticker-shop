// lib/useCases.js
// Use-case quick-entry configuration. Parallel to industryTags — additive, not replacing.

export const USE_CASES = [
  { slug: "corporate", icon: "\u{1F3E2}" },
  { slug: "events", icon: "\u{1F3EA}" },
  { slug: "fleet-setup", icon: "\u{1F69B}" },
  { slug: "opening-store", icon: "\u{1F3EA}" },
  { slug: "window-glass", icon: "\u{1FA9F}" },
  { slug: "decoration-backdrop", icon: "\u{1F3AC}" },
  { slug: "wedding", icon: "\u{1F48D}" },
  { slug: "gifting", icon: "\u{1F381}" },
  { slug: "campus", icon: "\u{1F393}" },
  { slug: "trade-show", icon: "\u{1F3AA}" },
];

export const USE_CASE_SLUGS = USE_CASES.map((u) => u.slug);

// Map use-case slug → product slugs to surface.
// Slugs must match active products in the database.
export const USE_CASE_META = {
  gifting: { relatedIndustries: ["retail", "event"] },
  wedding: { relatedIndustries: ["event", "beauty"] },
  corporate: { relatedIndustries: ["finance", "real-estate", "construction"] },
  campus: { relatedIndustries: ["education"] },
  events: { relatedIndustries: ["event", "fitness", "beauty"] },
  "fleet-setup": { relatedIndustries: ["fleet", "construction", "automotive"] },
  "opening-store": { relatedIndustries: ["retail", "restaurants", "beauty"] },
  "trade-show": { relatedIndustries: ["event", "corporate"] },
  "window-glass": { relatedIndustries: ["retail", "restaurants", "real-estate"] },
  "decoration-backdrop": { relatedIndustries: ["event", "retail", "beauty"] },
};

export const USE_CASE_PRODUCTS = {
  gifting: [
    "stickers-single-diecut",
    "stickers-sheet-kisscut",
    "labels-clear",
    "postcards",
    "greeting-cards",
    "tags-hang-tags",
    "bookmarks",
    "stickers-color-on-white",
    "stickers-color-on-clear",
  ],
  wedding: [
    "invitation-cards",
    "greeting-cards",
    "envelopes",
    "mp-menus",
    "tags-hang-tags",
    "stickers-single-diecut",
    "postcards",
    "bookmarks",
    "certificates",
  ],
  corporate: [
    "flyers",
    "brochures",
    "postcards",
    "rack-cards",
    "mp-presentation-folders",
    "mp-letterhead",
    "envelopes",
    "ncr-invoices",
    "vinyl-banners",
  ],
  campus: [
    "stickers-single-diecut",
    "stickers-sheet-kisscut",
    "flyers",
    "postcards",
    "bookmarks",
    "posters",
    "vinyl-banners",
    "coroplast-signs",
  ],
  events: [
    "vinyl-banners",
    "mesh-banners",
    "feather-flags",
    "teardrop-flags",
    "mp-tickets",
    "flyers",
    "postcards",
    "posters",
    "pull-up-banner",
    "x-banner-prints",
  ],
  "fleet-setup": [
    "tssa-number-lettering",
    "cvor-number-decals",
    "dot-number-lettering",
    "fleet-unit-number-stickers",
    "custom-printed-vehicle-logo-decals",
    "vehicle-partial-wrap",
    "reflective-vinyl-lettering",
  ],
  "opening-store": [
    "vinyl-banners",
    "coroplast-signs",
    "window-graphics-perforated",
    "frosted-privacy-window-film",
    "color-white-on-clear-vinyl",
    "storefront-hours-door-decal-cut-vinyl",
    "flyers",
    "postcards",
  ],
  "trade-show": [
    "pull-up-banner",
    "x-banner-prints",
    "tabletop-banner",
    "vinyl-banners",
    "flyers",
    "brochures",
    "postcards",
    "rack-cards",
  ],
  "window-glass": [
    "window-graphics-perforated",
    "frosted-privacy-window-film",
    "frosted-matte-window-film",
    "clear-static-cling",
    "frosted-static-cling",
    "holographic-iridescent-film",
    "color-white-on-clear-vinyl",
    "color-white-color-clear-vinyl",
    "window-cut-vinyl-lettering",
    "window-lettering-business",
    "storefront-hours-door-decal-cut-vinyl",
  ],
  "decoration-backdrop": [
    "step-repeat-backdrop-8x8",
    "wall-mural-graphic",
    "vinyl-banners",
    "pull-up-banner",
    "popup-display-curved-8ft",
    "popup-display-straight-8ft",
    "tension-fabric-display-3x3",
    "posters",
    "coroplast-signs",
  ],
};

/** Solution bundles for /ideas pages — pre-configured packages */
export const SOLUTION_BUNDLES = {
  corporate: [
    {
      id: "corp-starter",
      name: "Startup Kit",
      priceHint: "$299+",
      items: ["250 Business Cards", "100 Flyers", "100 Envelopes"],
    },
    {
      id: "corp-pro",
      name: "Professional Suite",
      priceHint: "$599+",
      items: ["500 Business Cards", "250 Flyers", "250 Postcards", "2 Presentation Folders"],
    },
  ],
  wedding: [
    {
      id: "wedding-essentials",
      name: "Wedding Essentials",
      priceHint: "$399+",
      items: ["100 Invitations", "100 RSVP Cards", "100 Envelopes", "100 Sticker Seals"],
    },
    {
      id: "wedding-full",
      name: "Full Wedding Suite",
      priceHint: "$749+",
      items: ["150 Invitations", "150 RSVP Cards", "150 Envelopes", "100 Menu Cards", "50 Programs", "150 Sticker Seals"],
    },
  ],
  events: [
    {
      id: "event-basic",
      name: "Event Starter",
      priceHint: "$349+",
      items: ["1 Retractable Banner", "250 Flyers", "1 Vinyl Banner (3x6)"],
    },
    {
      id: "event-pro",
      name: "Event Pro",
      priceHint: "$699+",
      items: ["2 Retractable Banners", "500 Flyers", "2 Vinyl Banners", "250 Postcards"],
    },
  ],
  "fleet-setup": [
    {
      id: "fleet-single",
      name: "Single Vehicle",
      priceHint: "$199+",
      items: ["1 TSSA Set", "1 CVOR Set", "2 Unit Numbers", "Logo Decals"],
    },
    {
      id: "fleet-multi",
      name: "Fleet Package (5 Vehicles)",
      priceHint: "$799+",
      items: ["5 TSSA Sets", "5 CVOR Sets", "10 Unit Numbers", "5 Logo Decal Sets"],
    },
  ],
  "opening-store": [
    {
      id: "store-starter",
      name: "Storefront Starter",
      priceHint: "$449+",
      items: ["1 Vinyl Banner (4x8)", "2 Coroplast Signs", "500 Flyers", "250 Business Cards"],
    },
  ],
  "trade-show": [
    {
      id: "tradeshow-basic",
      name: "Trade Show Starter",
      priceHint: "$349+",
      items: ["1 Retractable Banner (33x81)", "2 Tabletop Banners", "250 Flyers"],
    },
    {
      id: "tradeshow-pro",
      name: "Premium Booth Kit",
      priceHint: "$799+",
      items: ["2 Retractable Banners", "1 X-Banner (31x71)", "500 Flyers", "250 Business Cards", "250 Brochures"],
    },
  ],
  "window-glass": [
    {
      id: "window-basic",
      name: "Storefront Window Kit",
      priceHint: "$349+",
      items: ["Window Cut Vinyl Lettering (Name + Hours)", "1 Frosted Privacy Film Panel", "1 Door Hours Decal"],
    },
    {
      id: "window-pro",
      name: "Full Glass Branding",
      priceHint: "$699+",
      items: ["Colour + White on Clear (2 panels)", "Frosted Matte Film", "Door Hours Decal", "Window Lettering"],
    },
    {
      id: "window-privacy",
      name: "Office Privacy Package",
      priceHint: "$499+",
      items: ["Frosted Static Cling (4 panels)", "Window Cut Vinyl Logo", "Frosted Matte Film (2 panels)"],
    },
  ],
  "decoration-backdrop": [
    {
      id: "backdrop-basic",
      name: "Photo Backdrop Kit",
      priceHint: "$399+",
      items: ["1 Step & Repeat Backdrop (8x8)", "2 Coroplast Signs"],
    },
    {
      id: "backdrop-pro",
      name: "Event Decor Package",
      priceHint: "$899+",
      items: ["1 Step & Repeat Backdrop (8x8)", "2 Retractable Banners", "1 Tension Fabric Display", "2 Posters"],
    },
  ],
};
