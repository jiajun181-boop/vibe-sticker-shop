import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCatalogConfig } from "@/lib/catalogConfig";
import { SUB_PRODUCT_CONFIG, getSubProductsForCategory } from "@/lib/subProductConfig";
import { getTurnaround } from "@/lib/turnaroundConfig";
import { computeFromPrice } from "@/lib/pricing/from-price";
import { getSmartDefaults } from "@/lib/pricing/get-smart-defaults";
import { getCuttingTypeForSlug, getCuttingType } from "@/lib/sticker-order-config";
import { CATEGORY_FAQ_SCHEMAS } from "@/lib/seo/category-faq-schemas";
import { BreadcrumbSchemaFromItems, CollectionPageSchema } from "@/components/JsonLd";
import { getProductImage } from "@/lib/product-image";
import CategoryLandingClient from "./CategoryLandingClient";
import SubGroupLandingClient from "./SubGroupLandingClient";
import SignsCategoryClient from "./SignsCategoryClient";
import StickersCategoryClient from "./StickersCategoryClient";
import WindowsWallsFloorsCategoryClient from "./WindowsWallsFloorsCategoryClient";
import MarketingCategoryClient from "./MarketingCategoryClient";
import BannersCategoryClient from "./BannersCategoryClient";
import VehicleCategoryClient from "./VehicleCategoryClient";
import CanvasCategoryClient from "./CanvasCategoryClient";

function CategoryFaqSchema({ category }) {
  const schema = CATEGORY_FAQ_SCHEMAS[category];
  if (!schema) return null;
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

function CategorySeoSchemas({ category, categoryName, description, products }) {
  return (
    <>
      <BreadcrumbSchemaFromItems items={[
        { name: "Shop", url: `${SITE_URL}/shop` },
        { name: categoryName },
      ]} />
      {products && products.length > 0 && (
        <CollectionPageSchema
          name={categoryName}
          description={description || `Custom ${categoryName} printing — professional quality, fast turnaround.`}
          url={`${SITE_URL}/shop/${category}`}
          products={products}
        />
      )}
    </>
  );
}

export const revalidate = 120;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.lunarprint.ca";
const PLACEMENT_TAG_PREFIX = "placement:";

// Legacy category URLs -> current canonical category URLs.
const CATEGORY_ALIASES = Object.freeze({
  "fleet-compliance": "vehicle-graphics-fleet",
  "window-graphics-film": "windows-walls-floors",
  "window-graphics": "windows-walls-floors",
  "business-cards": "marketing-business-print",
  stamps: "marketing-business-print",
  "business-forms": "marketing-business-print",
  "paper-marketing": "marketing-business-print",
  "flyers-brochures": "marketing-business-print",
  "posters-prints": "marketing-business-print",
  "marketing-prints": "marketing-business-print",
  "retail-promo": "marketing-business-print",
  "packaging": "marketing-business-print",
  "custom-stickers": "stickers-labels-decals",
  "stickers-labels": "stickers-labels-decals",
  "safety-warning-decals": "stickers-labels-decals",
  "facility-asset-labels": "stickers-labels-decals",
  "rigid-signs": "signs-rigid-boards",
  "display-stands": "banners-displays",
  "banners-displays": "banners-displays",
  "window-glass-films": "windows-walls-floors",
  "large-format-graphics": "windows-walls-floors",
  "vehicle-branding-advertising": "vehicle-graphics-fleet",
  "fleet-compliance-id": "vehicle-graphics-fleet",
});

const FLATTENED_SUBGROUP_CATEGORIES = new Set(["packaging"]);

const MARKETING_SEGMENTS = [
  {
    key: "marketing-materials",
    title: "Marketing Materials",
    slugs: ["flyers", "brochures", "door-hangers", "greeting-invitation-cards", "tickets-coupons", "menus", "posters", "postcards", "rack-cards", "booklets", "bookmarks", "calendars"],
  },
  {
    key: "business-essentials",
    title: "Business Essentials",
    slugs: ["business-cards", "stamps", "letterhead", "envelopes", "notepads", "ncr-forms", "document-printing", "certificates"],
  },
  {
    key: "retail-pos",
    title: "Retail & Point of Sale",
    slugs: ["shelf-displays", "table-tents"],
  },
];

const VEHICLE_GRAPHICS_FLEET_SEGMENTS = [
  {
    key: "vehicle-branding",
    title: "Vehicle Branding",
    slugs: ["vehicle-wraps", "door-panel-graphics", "vehicle-decals", "magnetic-signs"],
  },
  {
    key: "fleet-packages",
    title: "Fleet & Safety Packages",
    slugs: ["fleet-packages"],
  },
  {
    key: "compliance-id",
    title: "Compliance & Identification",
    slugs: ["dot-mc-numbers", "unit-weight-ids", "spec-labels", "inspection-compliance"],
  },
];

const STICKERS_SEGMENTS = [
  {
    key: "custom-stickers",
    title: "Stickers & Labels",
    slugs: ["die-cut-stickers", "kiss-cut-singles", "sticker-pages", "sticker-rolls"],
  },
  {
    key: "vinyl-specialty",
    title: "Vinyl & Specialty",
    slugs: ["vinyl-lettering"],
  },
];

const SIGNS_PRODUCT_SECTIONS = [
  {
    key: "outdoor-realestate",
    title: "Outdoor & Real Estate Signs",
    description: "Coroplast yard signs, real estate signs, election signs, and accessories. Weatherproof for Canadian outdoors.",
    productSlugs: ["yard-sign", "real-estate-sign", "election-signs", "open-house-signs", "a-frame-sign-stand", "h-stakes", "real-estate-frame"],
    noImageGradient: "from-sky-100 to-emerald-100",
    noImageIcon: "\uD83E\uDEA7",
  },
  {
    key: "events-weddings",
    title: "Events, Weddings & Fun",
    description: "Photo boards, selfie frames, giant cheques, life-size cutouts, and welcome signs for events and celebrations.",
    productSlugs: ["selfie-frame-board", "tri-fold-presentation-board", "graduation-checks", "giant-checks", "presentation-checks", "life-size-cutouts", "wedding-seating-charts", "seating-chart-boards", "welcome-sign-board", "welcome-sign-boards"],
    noImageGradient: "from-orange-100 to-amber-100",
    noImageIcon: "\uD83D\uDDBC\uFE0F",
  },
  {
    key: "business-property",
    title: "Business & Property Signs",
    description: "Professional signage for commercial properties and facilities.",
    productSlugs: ["parking-signs", "parking-property-signs", "business-hours-signs", "construction-site-signs", "wayfinding-signs", "directional-signs", "ada-braille-signs"],
    noImageGradient: "from-slate-100 to-blue-100",
    noImageIcon: "\uD83C\uDFE2",
  },
  {
    key: "boards-material",
    title: "Custom Boards by Material",
    description: "Choose your substrate. Priced by the square foot for custom sizes.",
    productSlugs: ["coroplast-signs", "coroplast-board-prints", "foam-board-prints", "foamboard-sheet", "pvc-sintra-prints", "pvc-sintra-signs", "pvc-board-signs", "acm-dibond-signs", "aluminum-composite"],
    noImageGradient: "from-gray-200 to-gray-300",
    noImageIcon: "\uD83D\uDD27",
  },
];

const BANNERS_DISPLAYS_SEGMENTS = [
  {
    key: "banners",
    title: "Banners",
    slugs: ["vinyl-banners", "mesh-banners", "pole-banners"],
  },
  {
    key: "stands-displays",
    title: "Stands & Displays",
    slugs: ["retractable-stands", "x-banner-stands", "tabletop-displays", "backdrops-popups"],
  },
  {
    key: "outdoor-events",
    title: "Outdoor & Events",
    slugs: ["flags-hardware", "tents-outdoor", "fabric-banners"],
  },
];

const WWF_PRODUCT_SLUGS = [
  "one-way-vision",
  "frosted-window-film",
  "static-cling",
  "transparent-color-film",
  "blockout-vinyl",
  "opaque-window-graphics",
  "glass-waistline",
  "wall-graphics",
  "floor-graphics",
];

function safeDecode(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function hasPlacementSubseries(tags, category, subseries) {
  if (!Array.isArray(tags) || !category || !subseries) return false;
  return tags.includes(`${PLACEMENT_TAG_PREFIX}${category}:${subseries}`);
}

function toClientSafe(value) {
  return JSON.parse(
    JSON.stringify(value, (_key, v) => {
      if (typeof v === "bigint") return v.toString();
      return v;
    })
  );
}

function normalizeProductNameKey(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\b(banners|cards|labels|prints|stickers|menus)\b/g, (m) => m.replace(/s$/, ""))
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeProductSlugKey(slug) {
  return String(slug || "")
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/-?(banners|cards|labels|prints|stickers|menus|flags)s?$/g, "-$1")
    .replace(/-+$/g, "")
    .trim();
}

function productStrengthScore(p) {
  const hasImage = p?.images?.[0]?.url ? 1 : 0;
  const price = (p?.fromPrice || p?.basePrice || 0) > 0 ? 1 : 0;
  const hasDescription = p?.description ? 1 : 0;
  return hasImage * 100 + price * 10 + hasDescription;
}

function dedupeByNormalizedName(list) {
  const seen = new Map();
  for (const p of list) {
    const nameKey = normalizeProductNameKey(p.name);
    const slugKey = normalizeProductSlugKey(p.slug);
    const key = `${nameKey}::${slugKey}`;
    const existing = seen.get(key);
    if (!existing) {
      seen.set(key, p);
      continue;
    }
    const existingScore = productStrengthScore(existing);
    const nextScore = productStrengthScore(p);
    if (nextScore > existingScore) {
      seen.set(key, p);
    } else if (nextScore === existingScore) {
      const existingPrice = existing.fromPrice || existing.basePrice || Number.MAX_SAFE_INTEGER;
      const nextPrice = p.fromPrice || p.basePrice || Number.MAX_SAFE_INTEGER;
      if (nextPrice < existingPrice) seen.set(key, p);
    }
  }
  return [...seen.values()];
}

function prioritizeSubGroups(category, groups) {
  if (category !== "signs-rigid-boards" && category !== "rigid-signs") return groups;
  const priority = ["yard-lawn-signs", "real-estate-signs"];
  const rank = new Map(priority.map((slug, i) => [slug, i]));
  return [...groups].sort((a, b) => {
    const ra = rank.has(a.slug) ? rank.get(a.slug) : Number.MAX_SAFE_INTEGER;
    const rb = rank.has(b.slug) ? rank.get(b.slug) : Number.MAX_SAFE_INTEGER;
    if (ra !== rb) return ra - rb;
    return 0;
  });
}

export async function generateMetadata({ params }) {
  const { category } = await params;
  const decoded = safeDecode(category);
  const config = await getCatalogConfig();
  const meta = config.categoryMeta[decoded];
  if (!meta) return {};

  const CATEGORY_TITLES = {
    "stickers-labels-decals": "Custom Stickers & Labels Toronto",
    "signs-rigid-boards": "Custom Signs & Display Boards Toronto | Coroplast & Foam Board",
    "windows-walls-floors": "Window Films, Wall & Floor Graphics Toronto",
    "canvas-prints": "Canvas Prints Toronto | Gallery Wrap, Framed & Split Panel",
  };
  const title = CATEGORY_TITLES[decoded] || meta.title;

  const CATEGORY_DESCRIPTIONS = {
    "stickers-labels-decals": "Custom die-cut stickers, kiss-cut stickers, sticker sheets, roll labels & vinyl lettering. Waterproof, UV-protected. Fast turnaround in Toronto.",
    "banners-displays": "Custom printed vinyl banners, mesh banners, roll-up stands, and display solutions in Toronto. Same day available.",
    "signs-rigid-boards": "Custom printed Coroplast signs and foam board displays in Toronto. Real estate signs, yard signs, event backdrops, photo boards. Same day available. Free GTA delivery.",
    "windows-walls-floors": "Custom window films, frosted vinyl, one-way vision, wall graphics & floor decals in Toronto. Professional quality, same day available.",
    "canvas-prints": "Museum-quality canvas prints in Toronto. Gallery wrap, framed, panoramic & split panel sets. Epson professional printer, original ink with custom ICC profile. Print on demand & drop-ship fulfillment for sellers.",
  };
  const description = CATEGORY_DESCRIPTIONS[decoded]
    || `Custom ${meta.title.toLowerCase()} printing — professional quality, fast turnaround in Toronto & the GTA.`;
  const url = `${SITE_URL}/shop/${category}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: "website" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function CategoryPage({ params }) {
  const { category } = await params;
  const decoded = safeDecode(category);
  const aliasTarget = CATEGORY_ALIASES[decoded];
  if (aliasTarget && aliasTarget !== decoded) {
    redirect(`/shop/${aliasTarget}?from=${encodeURIComponent(decoded)}`);
  }

  const config = await getCatalogConfig();
  const inHomepageConfig = config.homepageCategories.includes(decoded);
  if (!inHomepageConfig) notFound();

  const meta = config.categoryMeta[decoded];

  // Collect categories to fetch: main + legacy aliases + cross-category sub-groups
  const categoriesToFetch = [decoded];

  // Include legacy DB category names (products may still use old names)
  for (const [legacy, target] of Object.entries(CATEGORY_ALIASES)) {
    if (target === decoded && !categoriesToFetch.includes(legacy)) {
      categoriesToFetch.push(legacy);
    }
  }

  // Cross-category sub-groups (e.g. marketing-prints also needs stamps products)
  if (meta?.subGroups) {
    for (const sg of meta.subGroups) {
      const subCfg = SUB_PRODUCT_CONFIG[sg.slug];
      if (subCfg && subCfg.category !== decoded && !categoriesToFetch.includes(subCfg.category)) {
        categoriesToFetch.push(subCfg.category);
      }
    }
  }

  // Cross-category product sharing — shared products appear in both category pages
  const CROSS_FETCH = {
  };
  for (const xCat of CROSS_FETCH[decoded] || []) {
    if (!categoriesToFetch.includes(xCat)) categoriesToFetch.push(xCat);
    // Also include legacy aliases for the cross-fetched category
    for (const [legacy, target] of Object.entries(CATEGORY_ALIASES)) {
      if (target === xCat && !categoriesToFetch.includes(legacy)) {
        categoriesToFetch.push(legacy);
      }
    }
  }

  const products = await prisma.product.findMany({
    where: {
      category: categoriesToFetch.length === 1
        ? decoded
        : { in: categoriesToFetch },
      isActive: true,
    },
    include: {
      images: { take: 2, orderBy: { sortOrder: "asc" } },
      pricingPreset: true,
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  // Use pre-computed minPrice for listings (write-time calculation).
  // Falls back to computeFromPrice() only when minPrice is missing.
  for (const p of products) {
    try {
      p.fromPrice = p.displayFromPrice || p.minPrice || computeFromPrice(p);
      p.quickAddQty = getSmartDefaults(p).minQuantity;
    } catch (err) {
      console.error(`[category-page] Error computing price/defaults for product ${p.slug}:`, err);
      p.fromPrice = p.basePrice || 0;
      p.quickAddQty = 1;
    }
  }

  // Shared SEO schemas for all category pages (breadcrumb + collection)
  const categoryTitle = meta?.title || decoded.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const seoSchemas = (
    <CategorySeoSchemas
      category={decoded}
      categoryName={categoryTitle}
      products={products}
    />
  );

  // Stickers & Labels — flat product grid with filter tabs
  if (decoded === "stickers-labels-decals") {
    try {
      return (
        <>
          {seoSchemas}
          <CategoryFaqSchema category={decoded} />
          <StickersCategoryClient products={toClientSafe(products)} />
        </>
      );
    } catch (err) {
      console.error("[stickers-page] Error rendering StickersCategoryClient:", err);
      // Fall through to generic SubGroupLandingClient / CategoryLandingClient below
    }
  }

  // Marketing & Business Print — sectioned category page
  if (decoded === "marketing-business-print") {
    const MARKETING_PRICE_MAP = {
      "business-cards": ["business-cards-classic", "business-cards-gloss", "business-cards-matte", "business-cards-soft-touch", "business-cards-gold-foil", "business-cards-linen", "business-cards-pearl", "business-cards-thick"],
      "flyers": ["flyers"],
      "brochures": ["brochures-bi-fold", "brochures-tri-fold", "brochures-z-fold"],
      "postcards": ["postcards"],
      "posters": ["posters", "posters-glossy", "posters-matte", "posters-adhesive", "posters-backlit"],
      "booklets": ["booklets", "booklets-saddle-stitch", "booklets-perfect-bound", "booklets-wire-o"],
      "letterhead": ["letterhead"],
      "notepads": ["notepads", "notepads-custom"],
      "stamps": ["stamps-s510", "stamps-s520", "stamps-s827", "stamps-s542", "stamps-r512", "stamps-r524", "stamps-r532", "stamps-r552"],
      "calendars": ["calendars-wall", "calendars-wall-desk", "calendars-desk"],
      "certificates": ["certificates"],
      "envelopes": ["envelopes"],
      "menus": ["menus-laminated", "menus-takeout", "table-mat"],
      "table-tents": ["table-tents-4x6", "table-tent-cards", "table-display-cards"],
      "shelf-displays": ["shelf-talkers", "shelf-danglers", "shelf-wobblers"],
      "rack-cards": ["rack-cards"],
      "door-hangers": ["door-hangers-standard", "door-hangers-perforated", "door-hangers-large"],
      "tags": ["hang-tags", "retail-tags"],
      "ncr-forms": ["ncr-forms-duplicate", "ncr-forms-triplicate", "ncr-invoices"],
      "tickets-coupons": ["tickets", "coupons", "loyalty-cards"],
      "greeting-invitation-cards": ["greeting-cards", "invitation-cards", "invitations-flat"],
      "bookmarks": ["bookmarks", "bookmarks-custom"],
      "loyalty-cards": ["loyalty-cards"],
      "document-printing": ["document-printing"],
      "inserts-packaging": ["inserts-packaging"],
      "presentation-folders": ["presentation-folders"],
    };

    const marketingPrices = {};
    const marketingImages = {};
    const marketingImages2 = {};
    for (const [key, slugs] of Object.entries(MARKETING_PRICE_MAP)) {
      const slugSet = new Set(slugs);
      const matching = products.filter((p) => slugSet.has(p.slug));
      if (matching.length > 0) {
        const prices = matching.map((p) => p.fromPrice).filter((p) => p > 0);
        marketingPrices[key] = prices.length > 0 ? Math.min(...prices) : 0;
        // Pick best image from matching products
        const withImage = matching.find((p) => p.images?.[0]?.url);
        if (withImage) {
          marketingImages[key] = withImage.images[0].url;
          if (withImage.images[1]?.url) marketingImages2[key] = withImage.images[1].url;
        }
      }
    }

    return (
      <>
        {seoSchemas}
      <CategoryFaqSchema category={decoded} />
        <MarketingCategoryClient marketingPrices={marketingPrices} marketingImages={marketingImages} marketingImages2={marketingImages2} />
      </>
    );
  }

  // Banners & Displays — sectioned category page
  if (decoded === "banners-displays") {
    const BANNER_PRICE_MAP = {
      "vinyl-banners": ["vinyl-banners"],
      "mesh-banners": ["mesh-banners"],
      "pole-banners": ["pole-banners"],
      "double-sided-banners": ["double-sided-banners"],
      "roll-up-banners": ["roll-up-banners"],
      "x-banner-frame-print": ["x-banner-frame-print"],
      "tabletop-x-banner": ["tabletop-x-banner"],
      "deluxe-tabletop-retractable-a3": ["deluxe-tabletop-retractable-a3"],
      "telescopic-backdrop": ["telescopic-backdrop"],
      "popup-display-curved-8ft": ["popup-display-curved-8ft"],
      "table-cloth": ["table-cloth"],
      "feather-flags": ["feather-flags"],
      "teardrop-flags": ["teardrop-flags"],
      "outdoor-canopy-tent-10x10": ["outdoor-canopy-tent-10x10"],
    };

    const bannerPrices = {};
    const bannerImages = {};
    const bannerImages2 = {};
    for (const [key, slugs] of Object.entries(BANNER_PRICE_MAP)) {
      const slugSet = new Set(slugs);
      const matching = products.filter((p) => slugSet.has(p.slug));
      if (matching.length > 0) {
        const prices = matching.map((p) => p.fromPrice).filter((p) => p > 0);
        bannerPrices[key] = prices.length > 0 ? Math.min(...prices) : 0;
        const img = getProductImage(matching[0]);
        if (img) bannerImages[key] = img;
        if (matching[0].images?.[1]?.url) bannerImages2[key] = matching[0].images[1].url;
      }
    }

    return (
      <>
        {seoSchemas}
      <CategoryFaqSchema category={decoded} />
        <BannersCategoryClient bannerPrices={bannerPrices} bannerImages={bannerImages} bannerImages2={bannerImages2} />
      </>
    );
  }

  // Signs & Display Boards — flat sectioned layout (no sub-group landings)
  if (decoded === "signs-rigid-boards") {
    const sections = SIGNS_PRODUCT_SECTIONS.map((section) => {
      const slugSet = new Set(section.productSlugs);
      const sectionProducts = products.filter((p) => slugSet.has(p.slug));
      // Sort by the order defined in productSlugs
      sectionProducts.sort((a, b) => section.productSlugs.indexOf(a.slug) - section.productSlugs.indexOf(b.slug));
      return {
        ...section,
        products: sectionProducts,
      };
    }).filter((s) => s.products.length > 0);

    return (
      <>
        {seoSchemas}
      <CategoryFaqSchema category={decoded} />
        <SignsCategoryClient
          category={decoded}
          categoryTitle={meta?.title || "Signs & Display Boards"}
          sections={toClientSafe(sections)}
          totalCount={products.length}
        />
      </>
    );
  }

  // Windows, Walls & Floors — sectioned category page
  if (decoded === "windows-walls-floors") {
    const WWF_PRICE_MAP = {
      "one-way-vision": ["one-way-vision"],
      "frosted-window-film": ["frosted-window-film"],
      "static-cling": ["static-cling"],
      "transparent-color-film": ["transparent-color-film"],
      "blockout-vinyl": ["blockout-vinyl"],
      "opaque-window-graphics": ["opaque-window-graphics"],
      "glass-waistline": ["glass-waistline"],
      "wall-graphics": ["wall-graphics"],
      "floor-graphics": ["floor-graphics"],
      "decals": ["decals"],
    };

    const wwfPrices = {};
    const wwfImages = {};
    const wwfImages2 = {};
    for (const [key, slugs] of Object.entries(WWF_PRICE_MAP)) {
      const slugSet = new Set(slugs);
      const matching = products.filter((p) => slugSet.has(p.slug));
      if (matching.length > 0) {
        const prices = matching.map((p) => p.fromPrice).filter((p) => p > 0);
        wwfPrices[key] = prices.length > 0 ? Math.min(...prices) : 0;
        const img = getProductImage(matching[0]);
        if (img) wwfImages[key] = img;
        if (matching[0].images?.[1]?.url) wwfImages2[key] = matching[0].images[1].url;
      }
    }

    return (
      <>
        {seoSchemas}
      <CategoryFaqSchema category={decoded} />
        <WindowsWallsFloorsCategoryClient wwfPrices={wwfPrices} wwfImages={wwfImages} wwfImages2={wwfImages2} />
      </>
    );
  }

  // Canvas Prints — sectioned category page (single + multi-panel)
  if (decoded === "canvas-prints") {
    const CANVAS_PRICE_MAP = {
      "canvas-standard": ["canvas-standard"],
      "canvas-gallery-wrap": ["canvas-gallery-wrap"],
      "canvas-framed": ["canvas-framed"],
      "canvas-panoramic": ["canvas-panoramic"],
      "canvas-split-2": ["canvas-split-2"],
      "canvas-split-3": ["canvas-split-3"],
      "canvas-split-5": ["canvas-split-5"],
    };

    const canvasPrices = {};
    const canvasImages = {};
    const canvasImages2 = {};
    for (const [key, slugs] of Object.entries(CANVAS_PRICE_MAP)) {
      const slugSet = new Set(slugs);
      const matching = products.filter((p) => slugSet.has(p.slug));
      if (matching.length > 0) {
        const prices = matching.map((p) => p.fromPrice).filter((p) => p > 0);
        canvasPrices[key] = prices.length > 0 ? Math.min(...prices) : 0;
        const img = getProductImage(matching[0]);
        if (img) canvasImages[key] = img;
        if (matching[0].images?.[1]?.url) canvasImages2[key] = matching[0].images[1].url;
      }
    }

    return (
      <>
        {seoSchemas}
      <CategoryFaqSchema category={decoded} />
        <CanvasCategoryClient canvasPrices={canvasPrices} canvasImages={canvasImages} canvasImages2={canvasImages2} />
      </>
    );
  }

  // Vehicle Graphics & Fleet — sectioned category page
  if (decoded === "vehicle-graphics-fleet") {
    const VEHICLE_PRICE_MAP = {
      // Compliance & ID
      "truck-door-compliance-kit": ["truck-door-compliance-kit"],
      "cvor-number-decals": ["cvor-number-decals"],
      "usdot-number-decals": ["usdot-number-decals"],
      "mc-number-decals": ["mc-number-decals"],
      "nsc-number-decals": ["nsc-number-decals"],
      "tssa-truck-number-lettering-cut-vinyl": ["tssa-truck-number-lettering-cut-vinyl"],
      "gvw-tare-weight-lettering": ["gvw-tare-weight-lettering"],
      "fleet-unit-number-stickers": ["fleet-unit-number-stickers"],
      "trailer-id-number-decals": ["trailer-id-number-decals"],
      "equipment-id-decals-cut-vinyl": ["equipment-id-decals-cut-vinyl"],
      "tire-pressure-load-labels": ["tire-pressure-load-labels"],
      "fuel-type-labels-diesel-gas": ["fuel-type-labels-diesel-gas"],
      "vehicle-inspection-maintenance-stickers": ["vehicle-inspection-maintenance-stickers"],
      // Wraps & Large Graphics
      "full-vehicle-wrap-design-print": ["full-vehicle-wrap-design-print"],
      "partial-wrap-spot-graphics": ["partial-wrap-spot-graphics"],
      "car-graphics": ["car-graphics"],
      "car-hood-decal": ["car-hood-decal"],
      "vehicle-roof-wrap": ["vehicle-roof-wrap"],
      "trailer-full-wrap": ["trailer-full-wrap"],
      "trailer-box-truck-large-graphics": ["trailer-box-truck-large-graphics"],
      "fleet-graphic-package": ["fleet-graphic-package"],
      "vehicle-wrap-print-only-quote": ["vehicle-wrap-print-only-quote"],
      // Vinyl Lettering & Decals
      "custom-cut-vinyl-lettering-any-text": ["custom-cut-vinyl-lettering-any-text"],
      "custom-truck-door-lettering-kit": ["custom-truck-door-lettering-kit"],
      "printed-truck-door-decals-full-color": ["printed-truck-door-decals-full-color"],
      "truck-side-panel-printed-decal": ["truck-side-panel-printed-decal"],
      "tailgate-rear-door-printed-decal": ["tailgate-rear-door-printed-decal"],
      "custom-printed-vehicle-logo-decals": ["custom-printed-vehicle-logo-decals"],
      "boat-lettering-registration": ["boat-lettering-registration"],
      "long-term-outdoor-vehicle-decals": ["long-term-outdoor-vehicle-decals"],
      "removable-promo-vehicle-decals": ["removable-promo-vehicle-decals"],
      "social-qr-vehicle-decals": ["social-qr-vehicle-decals"],
      "bumper-sticker-custom": ["bumper-sticker-custom"],
      "stay-back-warning-decals": ["stay-back-warning-decals"],
      // Magnetic Signs
      "magnetic-car-signs": ["magnetic-car-signs"],
      "magnetic-truck-door-signs": ["magnetic-truck-door-signs"],
      "magnetic-rooftop-sign": ["magnetic-rooftop-sign"],
      "car-door-magnets-pair": ["car-door-magnets-pair"],
      "magnets-flexible": ["magnets-flexible"],
      // Fleet Safety & Operations
      "reflective-conspicuity-tape-kit": ["reflective-conspicuity-tape-kit"],
      "reflective-safety-stripes-kit": ["reflective-safety-stripes-kit"],
      "high-visibility-rear-chevron-kit": ["high-visibility-rear-chevron-kit"],
      "dangerous-goods-placards": ["dangerous-goods-placards"],
      "fleet-vehicle-inspection-book": ["fleet-vehicle-inspection-book"],
      "hours-of-service-log-holder": ["hours-of-service-log-holder"],
      "ifta-cab-card-holder": ["ifta-cab-card-holder"],
    };

    const vehiclePrices = {};
    const vehicleImages = {};
    const vehicleImages2 = {};
    for (const [key, slugs] of Object.entries(VEHICLE_PRICE_MAP)) {
      const slugSet = new Set(slugs);
      const matching = products.filter((p) => slugSet.has(p.slug));
      if (matching.length > 0) {
        const prices = matching.map((p) => p.fromPrice).filter((p) => p > 0);
        vehiclePrices[key] = prices.length > 0 ? Math.min(...prices) : 0;
        const img = getProductImage(matching[0]);
        if (img) vehicleImages[key] = img;
        if (matching[0].images?.[1]?.url) vehicleImages2[key] = matching[0].images[1].url;
      }
    }

    return (
      <>
        {seoSchemas}
      <CategoryFaqSchema category={decoded} />
        <VehicleCategoryClient vehiclePrices={vehiclePrices} vehicleImages={vehicleImages} vehicleImages2={vehicleImages2} />
      </>
    );
  }

  // If category has sub-groups, render sub-group card landing instead of flat product list
  const subGroups = meta?.subGroups;
  if (subGroups?.length > 0) {
    // Some categories need all concrete products expanded directly on the page.
    if (FLATTENED_SUBGROUP_CATEGORIES.has(decoded)) {
      const expandedProducts = dedupeByNormalizedName(products);
      const subGroupEntries = getSubProductsForCategory(decoded);
      const filterGroups = [];

      for (const [parentSlug, cfg] of subGroupEntries) {
        const slugSet = new Set(cfg.dbSlugs);
        const count = expandedProducts.filter((p) => slugSet.has(p.slug)).length;
        if (count > 0) {
          filterGroups.push({
            slug: parentSlug,
            label: parentSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
            dbSlugs: cfg.dbSlugs,
            count,
          });
        }
      }

      const turnaroundMap = {};
      for (const p of expandedProducts) {
        const tk = getTurnaround(p);
        if (!turnaroundMap[tk]) turnaroundMap[tk] = [];
        turnaroundMap[tk].push(p.id);
      }
      const turnaroundGroups = Object.entries(turnaroundMap).map(([key, ids]) => ({
        key,
        count: ids.length,
        productIds: ids,
      }));

      return (
        <>
          {seoSchemas}
      <CategoryFaqSchema category={decoded} />
          <CategoryLandingClient
            category={decoded}
            categoryTitle={meta?.title || decoded}
            categoryIcon={meta?.icon || ""}
            products={toClientSafe(expandedProducts)}
            filterGroups={filterGroups}
            turnaroundGroups={turnaroundGroups}
          />
        </>
      );
    }

    // Build sub-group data with counts, previews, minPrice, turnaround, badges
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const subGroupData = subGroups.map((sg) => {
      const subCfg = SUB_PRODUCT_CONFIG[sg.slug];
      const placementMatching = products.filter((p) =>
        hasPlacementSubseries(p.tags, decoded, sg.slug) &&
        (!subCfg || subCfg.dbSlugs.includes(p.slug))
      );
      const fallbackMatching =
        placementMatching.length === 0 && subCfg
          ? products.filter((p) => subCfg.dbSlugs.includes(p.slug))
          : [];
      // Direct slug match: when subGroup slug IS a product slug (e.g. canvas-prints)
      const directMatch =
        placementMatching.length === 0 && fallbackMatching.length === 0
          ? products.filter((p) => p.slug === sg.slug)
          : [];
      const matching = placementMatching.length > 0 ? placementMatching
        : fallbackMatching.length > 0 ? fallbackMatching
        : directMatch;

      const prices = matching.map((p) => p.fromPrice || p.basePrice).filter((p) => p > 0);
      const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
      const turnaround = matching.length > 0
        ? getTurnaround(matching[0])
        : getTurnaround({ category: subCfg?.category || decoded });

      return {
        ...sg,
        count: matching.length,
        previews: matching.slice(0, 3).map((p) => getProductImage(p, p.category)).filter(Boolean),
        topProducts: matching.slice(0, 3).map((p) => ({
          name: p.name,
          price: p.fromPrice || p.basePrice || 0,
          imageUrl: getProductImage(p, p.category) || null,
        })),
        minPrice,
        turnaround,
        hasNew: matching.some((p) => p.createdAt > thirtyDaysAgo),
        hasFeatured: matching.some((p) => p.isFeatured),
      };
    }).filter((sg) => sg.count > 0);

    // Sibling categories in the same department (for cross-category recommendations)
    const dept = config.departments.find((d) => d.categories.includes(decoded));
    const siblingCategories = dept
      ? dept.categories
          .filter((c) => c !== decoded)
          .map((c) => ({
            slug: c,
            title: config.categoryMeta[c]?.title || c,
            icon: config.categoryMeta[c]?.icon || "",
            href: `/shop/${c}`,
          }))
      : [];

    const orderedSubGroupData = prioritizeSubGroups(decoded, subGroupData);
    const SEGMENT_MAP = {
      "marketing-business-print": MARKETING_SEGMENTS,
      "stickers-labels-decals": STICKERS_SEGMENTS,
      "banners-displays": BANNERS_DISPLAYS_SEGMENTS,
      "vehicle-graphics-fleet": VEHICLE_GRAPHICS_FLEET_SEGMENTS,
    };
    const segmentDef = SEGMENT_MAP[decoded] || null;

    const groupedSubGroups = segmentDef
      ? segmentDef.map((segment) => ({
          key: segment.key,
          title: segment.title,
          items: orderedSubGroupData.filter((sg) => segment.slugs.includes(sg.slug)),
        })).filter((segment) => segment.items.length > 0)
      : [];

    // Build sticker configurator data for stickers-labels-decals sub-groups
    const stickerConfigData = {};
    if (decoded === "stickers-labels-decals") {
      for (const sg of orderedSubGroupData) {
        const ctId = getCuttingTypeForSlug(sg.slug);
        if (ctId) {
          const ct = getCuttingType(ctId);
          stickerConfigData[sg.slug] = {
            cuttingTypeId: ctId,
            quantities: ct.quantities,
            materials: ct.materials,
            sizes: ct.sizes,
          };
        }
      }
    }

    return (
      <>
        {seoSchemas}
      <CategoryFaqSchema category={decoded} />
        <SubGroupLandingClient
          category={decoded}
          categoryTitle={meta?.title || decoded}
          categoryIcon={meta?.icon || ""}
          subGroups={orderedSubGroupData}
          groupedSubGroups={groupedSubGroups}
          siblingCategories={siblingCategories}
          totalCount={products.length}
          stickerConfigData={stickerConfigData}
        />
      </>
    );
  }

  // Regular category: flat product grid with filter chips
  const subGroupEntries = getSubProductsForCategory(decoded);
  const filterGroups = [];

  for (const [parentSlug, cfg] of subGroupEntries) {
    const slugSet = new Set(cfg.dbSlugs);
    const count = products.filter((p) => slugSet.has(p.slug)).length;
    if (count > 0) {
      filterGroups.push({
        slug: parentSlug,
        label: parentSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        dbSlugs: cfg.dbSlugs,
        count,
      });
    }
  }

  // Build turnaround filter groups from product data
  const turnaroundMap = {};
  for (const p of products) {
    const tk = getTurnaround(p);
    if (!turnaroundMap[tk]) turnaroundMap[tk] = [];
    turnaroundMap[tk].push(p.id);
  }
  const turnaroundGroups = Object.entries(turnaroundMap).map(([key, ids]) => ({
    key,
    count: ids.length,
    productIds: ids,
  }));

  return (
    <>
      {seoSchemas}
      <CategoryFaqSchema category={decoded} />
      <CategoryLandingClient
        category={decoded}
        categoryTitle={meta?.title || decoded}
        categoryIcon={meta?.icon || ""}
        products={toClientSafe(products)}
        filterGroups={filterGroups}
        turnaroundGroups={turnaroundGroups}
      />
    </>
  );
}
