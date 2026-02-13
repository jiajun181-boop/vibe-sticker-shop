import { prisma } from "@/lib/prisma";
import { getCatalogConfig } from "@/lib/catalogConfig";
import ShopClient from "./ShopClient";

export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://vibestickers.com";
const BRAND = "La Lunar Printing Inc.";

export async function generateMetadata({ searchParams }) {
  const params = (await searchParams) || {};
  const title = "Shop All Products | La Lunar Printing";
  const description = "Browse our full catalog of custom printing products. Stickers, labels, signs, banners, business cards, and more. Order online with fast turnaround.";

  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/shop` },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/shop`,
      siteName: BRAND,
      type: "website",
    },
    twitter: { card: "summary_large_image", title, description },
    // Prevent parameter variations from being indexed
    ...(params.q || params.tag || params.useCase
      ? { robots: { index: false, follow: true } }
      : {}),
  };
}

export default async function ShopPage({ searchParams }) {
  const params = (await searchParams) || {};
  const initialQuery = typeof params.q === "string" ? params.q : "";
  const initialTag = typeof params.tag === "string" ? params.tag : "";
  const initialUseCase = typeof params.useCase === "string" ? params.useCase : "";
  const initialView = typeof params.view === "string" ? params.view : "";

  const [products, config] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true },
      include: { images: { take: 1, orderBy: { sortOrder: "asc" } } },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
    getCatalogConfig(),
  ]);

  // Count products per category for the grid view
  const categoryCounts = {};
  for (const p of products) {
    categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
  }

  // Build thumbnail previews (first 3 product images per category)
  const categoryPreviews = {};
  for (const p of products) {
    if (!categoryPreviews[p.category]) categoryPreviews[p.category] = [];
    if (categoryPreviews[p.category].length < 3 && p.images?.[0]?.url) {
      categoryPreviews[p.category].push(p.images[0].url);
    }
  }

  return (
    <ShopClient
      products={products}
      initialQuery={initialQuery}
      initialTag={initialTag}
      initialUseCase={initialUseCase}
      initialView={initialView}
      categoryMeta={config.categoryMeta}
      departments={config.departments}
      departmentMeta={config.departmentMeta}
      categoryCounts={categoryCounts}
      categoryPreviews={categoryPreviews}
    />
  );
}
