import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ALL_CATEGORIES, CATALOG_DEFAULTS } from "@/lib/catalogConfig";
import { getSubProductsForCategory } from "@/lib/subProductConfig";
import CategoryLandingClient from "./CategoryLandingClient";

export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://vibestickers.com";

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
  const meta = CATALOG_DEFAULTS.categoryMeta[decoded];
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

  if (!ALL_CATEGORIES.includes(decoded)) {
    notFound();
  }

  const meta = CATALOG_DEFAULTS.categoryMeta[decoded];

  // Fetch all active products in this category
  const products = await prisma.product.findMany({
    where: { category: decoded, isActive: true },
    include: {
      images: { take: 1, orderBy: { sortOrder: "asc" } },
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  // Build filter groups from sub-product config (for filter chips, not section headers)
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

  return (
    <CategoryLandingClient
      category={decoded}
      categoryTitle={meta?.title || decoded}
      categoryIcon={meta?.icon || ""}
      products={toClientSafe(products)}
      filterGroups={filterGroups}
    />
  );
}
