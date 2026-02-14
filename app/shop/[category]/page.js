import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCatalogConfig } from "@/lib/catalogConfig";
import { SUB_PRODUCT_CONFIG, getSubProductsForCategory } from "@/lib/subProductConfig";
import { getTurnaround } from "@/lib/turnaroundConfig";
import CategoryLandingClient from "./CategoryLandingClient";
import SubGroupLandingClient from "./SubGroupLandingClient";

export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://lunarprint.ca";

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

  const config = await getCatalogConfig();

  if (!config.homepageCategories.includes(decoded)) {
    notFound();
  }

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
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  // If category has sub-groups, render sub-group card landing instead of flat product list
  const subGroups = meta?.subGroups;
  if (subGroups?.length > 0) {
    // Build sub-group data with counts, previews, minPrice, turnaround
    const subGroupData = subGroups.map((sg) => {
      const subCfg = SUB_PRODUCT_CONFIG[sg.slug];
      const matching = subCfg
        ? products.filter((p) => subCfg.dbSlugs.includes(p.slug))
        : [];

      const prices = matching.filter((p) => p.basePrice > 0).map((p) => p.basePrice);
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

    // Orphan products not in any sub-group
    const allSubSlugs = new Set(
      subGroups.flatMap((sg) => SUB_PRODUCT_CONFIG[sg.slug]?.dbSlugs || [])
    );
    const orphans = products.filter((p) => !allSubSlugs.has(p.slug));

    return (
      <SubGroupLandingClient
        category={decoded}
        categoryTitle={meta?.title || decoded}
        categoryIcon={meta?.icon || ""}
        subGroups={subGroupData}
        orphanProducts={toClientSafe(orphans)}
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
