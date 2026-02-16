import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCatalogConfig } from "@/lib/catalogConfig";
import { SUB_PRODUCT_CONFIG, getSubProductsForCategory } from "@/lib/subProductConfig";
import { getTurnaround } from "@/lib/turnaroundConfig";
import { computeFromPrice } from "@/lib/pricing/from-price";
import CategoryLandingClient from "./CategoryLandingClient";
import SubGroupLandingClient from "./SubGroupLandingClient";

export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://lunarprint.ca";

// Legacy category URLs -> current canonical category URLs.
const CATEGORY_ALIASES = Object.freeze({
  "fleet-compliance": "fleet-compliance-id",
  "window-graphics-film": "window-glass-films",
  "window-graphics": "window-glass-films",
  "business-cards": "marketing-prints",
  stamps: "marketing-prints",
  "business-forms": "marketing-prints",
  "paper-marketing": "marketing-prints",
  "flyers-brochures": "marketing-prints",
  "posters-prints": "marketing-prints",
});

const FLATTENED_SUBGROUP_CATEGORIES = new Set(["packaging", "banners-displays"]);

function safeDecode(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
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
  if (category !== "rigid-signs") return groups;
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

  const title = `${meta.title} — Vibe Sticker Shop`;
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
  const activeCount = await prisma.product.count({
    where: { category: decoded, isActive: true },
  });

  // Do not hard-404 categories that still have products but are missing from homepage config.
  if (!inHomepageConfig && activeCount === 0) notFound();

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

  // Compute real "From" price for each product using the quote engine
  for (const p of products) {
    p.fromPrice = computeFromPrice(p);
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

    // Build sub-group data with counts, previews, minPrice, turnaround
    const subGroupData = subGroups.map((sg) => {
      const subCfg = SUB_PRODUCT_CONFIG[sg.slug];
      const matching = subCfg
        ? products.filter((p) => subCfg.dbSlugs.includes(p.slug))
        : [];

      const prices = matching.map((p) => p.fromPrice || p.basePrice).filter((p) => p > 0);
      const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
      const turnaround = matching.length > 0
        ? getTurnaround(matching[0])
        : getTurnaround({ category: subCfg?.category || decoded });

      return {
        ...sg,
        count: matching.length,
        previews: matching.slice(0, 3).map((p) => p.images?.[0]?.url).filter(Boolean),
        minPrice,
        turnaround,
      };
    });

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

    return (
      <SubGroupLandingClient
        category={decoded}
        categoryTitle={meta?.title || decoded}
        categoryIcon={meta?.icon || ""}
        subGroups={orderedSubGroupData}
        siblingCategories={siblingCategories}
        totalCount={products.length}
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
