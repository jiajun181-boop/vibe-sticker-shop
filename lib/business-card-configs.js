// lib/business-card-configs.js — Product configs for 9 individual business card pages
// Each config defines: slug, display info, SEO, configurator steps, and pricing label mapping.

const SIZE = { w: 3.5, h: 2, label: '3.5" × 2"' };

const STANDARD_QUANTITIES = [50, 100, 250, 500, 1000, 2500, 5000];
const MAGNET_QUANTITIES = [50, 100, 250, 500, 1000];

// Rounded corners surcharge: $0.03/card (in cents)
const ROUNDED_SURCHARGE_PER_CARD = 3;

// Multi-name: file fees + per-name discount (all in cents)
const MULTI_NAME = {
  enabled: true,
  maxNames: 20,
  discountPerName: 500, // $5 off per name (applied to each name including first)
  // File fee tiers: names 2-5 = $12, 6-10 = $10, 11+ = $8
  fileFees: [
    { upToNames: 5, feePerName: 1200 },
    { upToNames: 10, feePerName: 1000 },
    { upToNames: 999, feePerName: 800 },
  ],
};

// ─── Helper: compute file fees for extra names ──────────────────────────────

export function computeMultiNameFileFees(extraNames, fileFees) {
  if (extraNames <= 0 || !fileFees) return 0;
  let total = 0;
  let allocated = 0;
  let prevCap = 1; // first name is free
  for (const tier of fileFees) {
    const slots = tier.upToNames - prevCap;
    const use = Math.min(extraNames - allocated, slots);
    if (use > 0) total += use * tier.feePerName;
    allocated += use;
    prevCap = tier.upToNames;
    if (allocated >= extraNames) break;
  }
  return total;
}

// ─── Config Definitions ─────────────────────────────────────────────────────

const configs = [
  {
    id: "classic",
    slug: "business-cards-classic",
    name: "bc.type.classic",
    tagline: "bc.desc.classic",
    seo: {
      title: "Classic Business Cards — 14pt Uncoated | Order Online",
      description:
        "Order classic 14pt uncoated business cards. Choose your finish: gloss, matte, or soft-touch lamination. Single or double sided, starting at 50 cards.",
      canonical: "/order/business-cards-classic",
    },
    size: SIZE,
    steps: {
      sides: true,
      finishing: true,
      foilOptions: false,
      layers: false,
      addons: true,
    },
    finishingOptions: [
      { id: "none", label: "bc.finishing.none", surchargePerCard: 0 },
      { id: "gloss", label: "bc.finishing.gloss", surchargePerCard: 0 },
      { id: "matte", label: "bc.finishing.matte", surchargePerCard: 0 },
      { id: "soft-touch", label: "bc.finishing.softTouch", surchargePerCard: 0 },
    ],
    buildSizeLabel: (choices) => {
      const finishMap = { gloss: "gloss", matte: "matte", "soft-touch": "soft-touch" };
      const prefix = finishMap[choices.finishingId] || "classic";
      return `${prefix}-${choices.sideId}`;
    },
    quantities: STANDARD_QUANTITIES,
    defaultSideId: "double",
    roundedSurchargePerCard: ROUNDED_SURCHARGE_PER_CARD,
    multiName: MULTI_NAME,
  },
  {
    id: "gloss",
    slug: "business-cards-gloss",
    name: "bc.type.gloss",
    tagline: "bc.desc.gloss",
    seo: {
      title: "Gloss Business Cards — 14pt + UV Gloss Coating | Order Online",
      description:
        "Order glossy business cards with built-in UV gloss coating on 14pt card stock. Single or double sided, starting at 50 cards.",
      canonical: "/order/business-cards-gloss",
    },
    size: SIZE,
    steps: {
      sides: true,
      finishing: false,
      foilOptions: false,
      layers: false,
      addons: true,
    },
    buildSizeLabel: (choices) => `gloss-${choices.sideId}`,
    quantities: STANDARD_QUANTITIES,
    defaultSideId: "double",
    roundedSurchargePerCard: ROUNDED_SURCHARGE_PER_CARD,
    multiName: MULTI_NAME,
  },
  {
    id: "matte",
    slug: "business-cards-matte",
    name: "bc.type.matte",
    tagline: "bc.desc.matte",
    seo: {
      title: "Matte Business Cards — 14pt + Matte Lamination | Order Online",
      description:
        "Order matte finish business cards with built-in matte lamination on 14pt card stock. Single or double sided, starting at 50 cards.",
      canonical: "/order/business-cards-matte",
    },
    size: SIZE,
    steps: {
      sides: true,
      finishing: false,
      foilOptions: false,
      layers: false,
      addons: true,
    },
    buildSizeLabel: (choices) => `matte-${choices.sideId}`,
    quantities: STANDARD_QUANTITIES,
    defaultSideId: "double",
    roundedSurchargePerCard: ROUNDED_SURCHARGE_PER_CARD,
    multiName: MULTI_NAME,
  },
  {
    id: "soft-touch",
    slug: "business-cards-soft-touch",
    name: "bc.type.soft-touch",
    tagline: "bc.desc.soft-touch",
    seo: {
      title: "Soft Touch Business Cards — 14pt + Soft-Touch Lamination | Order Online",
      description:
        "Order premium soft-touch business cards with velvety soft-touch lamination on 14pt card stock. Single or double sided, starting at 50 cards.",
      canonical: "/order/business-cards-soft-touch",
    },
    size: SIZE,
    steps: {
      sides: true,
      finishing: false,
      foilOptions: false,
      layers: false,
      addons: true,
    },
    buildSizeLabel: (choices) => `soft-touch-${choices.sideId}`,
    quantities: STANDARD_QUANTITIES,
    defaultSideId: "double",
    roundedSurchargePerCard: ROUNDED_SURCHARGE_PER_CARD,
    multiName: MULTI_NAME,
  },
  {
    id: "gold-foil",
    slug: "business-cards-gold-foil",
    name: "bc.type.gold-foil",
    tagline: "bc.desc.gold-foil",
    seo: {
      title: "Gold Foil Business Cards — Digital Foil + Soft Touch | Order Online",
      description:
        "Order gold foil business cards with digital foil stamping and soft-touch lamination. Choose foil coverage and sides. Starting at 50 cards.",
      canonical: "/order/business-cards-gold-foil",
    },
    size: SIZE,
    steps: {
      sides: true,
      finishing: false,
      foilOptions: true,
      layers: false,
      addons: true,
    },
    foilCoverageOptions: [
      { id: "logo", label: "bc.foil.coverage.logo" },
      { id: "full", label: "bc.foil.coverage.full" },
    ],
    foilSidesOptions: [
      { id: "front", label: "bc.foil.sides.front" },
      { id: "both", label: "bc.foil.sides.both" },
    ],
    buildSizeLabel: (choices) => `gold-foil-${choices.sideId}`,
    quantities: STANDARD_QUANTITIES,
    defaultSideId: "double",
    roundedSurchargePerCard: ROUNDED_SURCHARGE_PER_CARD,
    multiName: MULTI_NAME,
  },
  {
    id: "linen",
    slug: "business-cards-linen",
    name: "bc.type.linen",
    tagline: "bc.desc.linen",
    seo: {
      title: "Linen Business Cards — Textured Linen Stock | Order Online",
      description:
        "Order linen texture business cards on premium textured linen stock. Cannot be laminated. Single or double sided, starting at 50 cards.",
      canonical: "/order/business-cards-linen",
    },
    size: SIZE,
    steps: {
      sides: true,
      finishing: false,
      foilOptions: false,
      layers: false,
      addons: true,
    },
    buildSizeLabel: (choices) => `linen-${choices.sideId}`,
    quantities: STANDARD_QUANTITIES,
    defaultSideId: "double",
    roundedSurchargePerCard: ROUNDED_SURCHARGE_PER_CARD,
    multiName: MULTI_NAME,
  },
  {
    id: "pearl",
    slug: "business-cards-pearl",
    name: "bc.type.pearl",
    tagline: "bc.desc.pearl",
    seo: {
      title: "Pearl Business Cards — Pearlescent Shimmer Finish | Order Online",
      description:
        "Order pearl shimmer business cards on premium pearlescent stock. Cannot be laminated. Single or double sided, starting at 50 cards.",
      canonical: "/order/business-cards-pearl",
    },
    size: SIZE,
    steps: {
      sides: true,
      finishing: false,
      foilOptions: false,
      layers: false,
      addons: true,
    },
    buildSizeLabel: (choices) => `pearl-${choices.sideId}`,
    quantities: STANDARD_QUANTITIES,
    defaultSideId: "double",
    roundedSurchargePerCard: ROUNDED_SURCHARGE_PER_CARD,
    multiName: MULTI_NAME,
  },
  {
    id: "thick",
    slug: "business-cards-thick",
    name: "bc.type.thick",
    tagline: "bc.desc.thick",
    seo: {
      title: "Ultra Thick Business Cards — 32pt Double/Triple Layer | Order Online",
      description:
        "Order ultra thick 32pt business cards. Choose double or triple layer construction. Always double-sided. Starting at 50 cards.",
      canonical: "/order/business-cards-thick",
    },
    size: SIZE,
    steps: {
      sides: false,
      finishing: false,
      foilOptions: false,
      layers: true,
      addons: true,
    },
    layerOptions: [
      { id: "double-layer", label: "bc.layer.double-layer" },
      { id: "triple-layer", label: "bc.layer.triple-layer" },
    ],
    buildSizeLabel: (choices) => `thick-${choices.layerId}`,
    quantities: STANDARD_QUANTITIES,
    defaultSideId: "double",
    defaultLayerId: "double-layer",
    roundedSurchargePerCard: ROUNDED_SURCHARGE_PER_CARD,
    multiName: MULTI_NAME,
  },
  {
    id: "magnet",
    slug: "magnets-business-card",
    name: "bc.type.magnet",
    tagline: "bc.desc.magnet",
    seo: {
      title: "Business Card Magnets — Magnetic Vinyl | Order Online",
      description:
        "Order magnetic business cards on 17pt flexible magnetic vinyl. Single-sided full color printing. Starting at 50 magnets.",
      canonical: "/order/magnets-business-card",
    },
    size: SIZE,
    steps: {
      sides: false,
      finishing: false,
      foilOptions: false,
      layers: false,
      addons: false,
    },
    buildSizeLabel: () => "magnet-single",
    quantities: MAGNET_QUANTITIES,
    defaultSideId: "single",
    roundedSurchargePerCard: 0,
    multiName: MULTI_NAME,
  },
];

// ─── Lookup Helpers ─────────────────────────────────────────────────────────

const _bySlug = new Map(configs.map((c) => [c.slug, c]));

export function getBusinessCardConfig(slug) {
  return _bySlug.get(slug) || null;
}

export function getAllBusinessCardConfigs() {
  return configs;
}

export function isBusinessCardSlug(slug) {
  return _bySlug.has(slug);
}
