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

  // Check for sub-product groups in this category
  const subGroupEntries = getSubProductsForCategory(decoded);

  const subGroups = [];
  const groupedSlugs = new Set();

  for (const [parentSlug, cfg] of subGroupEntries) {
    const slugSet = new Set(cfg.dbSlugs);
    const groupProducts = products.filter((p) => slugSet.has(p.slug));
    for (const s of cfg.dbSlugs) groupedSlugs.add(s);

    if (groupProducts.length > 0) {
      subGroups.push({
        parentSlug,
        products: toClientSafe(groupProducts),
      });
    }
  }

  // Products not in any sub-group
  const standalone = products.filter((p) => !groupedSlugs.has(p.slug));

  return (
    <CategoryLandingClient
      category={decoded}
      categoryTitle={meta?.title || decoded}
      categoryIcon={meta?.icon || ""}
      subGroups={subGroups}
      standaloneProducts={toClientSafe(standalone)}
    />
  );
}
