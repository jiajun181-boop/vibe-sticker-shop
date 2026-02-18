import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCatalogConfig } from "@/lib/catalogConfig";
import { SUB_PRODUCT_CONFIG, getSubProductsForCategory } from "@/lib/subProductConfig";
import { getTurnaround } from "@/lib/turnaroundConfig";
import { computeFromPrice } from "@/lib/pricing/from-price";
import { getSmartDefaults } from "@/lib/pricing/get-smart-defaults";
import { getCuttingTypeForSlug, getCuttingType } from "@/lib/sticker-order-config";
import CategoryLandingClient from "./CategoryLandingClient";
import SubGroupLandingClient from "./SubGroupLandingClient";

export const revalidate = 120;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://lunarprint.ca";
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
    key: "business-essentials",
    title: "Business Essentials",
    slugs: ["business-cards", "letterhead", "notepads", "bookmarks", "calendars", "envelopes", "stamps", "ncr-forms", "order-forms", "waivers-releases"],
  },
  {
    key: "marketing-materials",
    title: "Marketing Materials",
    slugs: ["flyers", "postcards", "brochures", "booklets", "posters", "presentation-folders"],
  },
  {
    key: "retail-events-packaging",
    title: "Retail, Events & Packaging",
    slugs: ["menus", "rack-cards", "door-hangers", "tickets-coupons", "retail-tags", "tags", "inserts-packaging", "certificates", "greeting-cards", "invitation-cards", "loyalty-cards", "shelf-displays", "table-tents"],
  },
];

const BANNERS_SEGMENTS = [
  {
    key: "banners",
    title: "Banners",
    slugs: ["vinyl-banners", "mesh-banners", "pole-banners", "fabric-banners"],
  },
  {
    key: "stands-displays",
    title: "Stands & Displays",
    slugs: ["retractable-stands", "x-banner-stands", "tabletop-displays", "backdrops-popups"],
  },
  {
    key: "outdoor-signage",
    title: "Outdoor & Signage",
    slugs: ["flags-hardware", "tents-outdoor"],
  },
];

const VEHICLE_GRAPHICS_FLEET_SEGMENTS = [
  {
    key: "vehicle-branding",
    title: "Vehicle Branding",
    slugs: ["vehicle-wraps", "door-panel-graphics", "vehicle-decals", "vehicle-graphics", "magnetic-signs"],
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
    title: "Custom Stickers & Labels",
    slugs: ["die-cut-stickers", "kiss-cut-singles", "sticker-pages", "sticker-rolls"],
  },
  {
    key: "vinyl-specialty",
    title: "Vinyl & Specialty",
    slugs: ["vinyl-lettering"],
  },
  {
    key: "safety-compliance",
    title: "Safety & Compliance",
    slugs: ["fire-emergency", "hazard-warning", "ppe-equipment", "electrical-chemical"],
  },
  {
    key: "industrial-labels",
    title: "Industrial & Asset Labels",
    slugs: ["asset-equipment-tags", "pipe-valve-labels", "warehouse-labels", "electrical-cable-labels"],
  },
];

const SIGNS_SEGMENTS = [
  {
    key: "outdoor-signs",
    title: "Outdoor Signs",
    slugs: ["yard-signs", "real-estate-signs", "election-signs"],
  },
  {
    key: "indoor-portable",
    title: "Indoor & Portable Signs",
    slugs: ["foam-board-signs", "a-frame-signs"],
  },
  {
    key: "event-display",
    title: "Event & Display Boards",
    slugs: ["event-boards", "display-signs"],
  },
];

const WINDOWS_WALLS_FLOORS_SEGMENTS = [
  {
    key: "window-films",
    title: "Window Films",
    slugs: ["static-clings", "adhesive-films", "one-way-vision", "privacy-films"],
  },
  {
    key: "lettering-graphics",
    title: "Lettering & Window Graphics",
    slugs: ["window-lettering", "window-graphics"],
  },
  {
    key: "wall-floor",
    title: "Wall & Floor Graphics",
    slugs: ["canvas-prints", "wall-graphics", "floor-graphics"],
  },
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
  const priority = ["yard-signs", "real-estate-signs", "election-signs"];
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

  const title = `${meta.title} - Vibe Sticker Shop`;
  const description = `Custom ${meta.title.toLowerCase()} printing — professional quality, fast turnaround in Toronto & the GTA.`;
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

  // Collect categories to fetch: main + any cross-category sub-groups
  // (e.g. marketing-prints page also needs business-cards & stamps products)
  const categoriesToFetch = [decoded];
  if (meta?.subGroups) {
    for (const sg of meta.subGroups) {
      const subCfg = SUB_PRODUCT_CONFIG[sg.slug];
      if (subCfg && subCfg.category !== decoded && !categoriesToFetch.includes(subCfg.category)) {
        categoriesToFetch.push(subCfg.category);
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
      images: { take: 1, orderBy: { sortOrder: "asc" } },
      pricingPreset: true,
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  // Use pre-computed minPrice for listings (write-time calculation).
  // Falls back to computeFromPrice() only when minPrice is missing.
  for (const p of products) {
    p.fromPrice = p.displayFromPrice || p.minPrice || computeFromPrice(p);
    p.quickAddQty = getSmartDefaults(p).minQuantity;
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
        <CategoryLandingClient
          category={decoded}
          categoryTitle={meta?.title || decoded}
          categoryIcon={meta?.icon || ""}
          products={toClientSafe(expandedProducts)}
          filterGroups={filterGroups}
          turnaroundGroups={turnaroundGroups}
        />
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
        previews: matching.slice(0, 3).map((p) => p.images?.[0]?.url).filter(Boolean),
        topProducts: matching.slice(0, 3).map((p) => ({
          name: p.name,
          price: p.fromPrice || p.basePrice || 0,
          imageUrl: p.images?.[0]?.url || null,
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
      "banners-displays": BANNERS_SEGMENTS,
      "stickers-labels-decals": STICKERS_SEGMENTS,
      "signs-rigid-boards": SIGNS_SEGMENTS,
      "windows-walls-floors": WINDOWS_WALLS_FLOORS_SEGMENTS,
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
    <CategoryLandingClient
      category={decoded}
      categoryTitle={meta?.title || decoded}
      categoryIcon={meta?.icon || ""}
      products={toClientSafe(products)}
      filterGroups={filterGroups}
      turnaroundGroups={turnaroundGroups}
    />
  );
}
