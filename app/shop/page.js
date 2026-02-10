import { prisma } from "@/lib/prisma";
import { getCatalogConfig } from "@/lib/catalogConfig";
import ShopClient from "./ShopClient";

export const dynamic = "force-dynamic";

export default async function ShopPage({ searchParams }) {
  const params = (await searchParams) || {};
  const initialCategory = typeof params.category === "string" ? params.category : "all";
  const initialQuery = typeof params.q === "string" ? params.q : "";
  const initialTag = typeof params.tag === "string" ? params.tag : "";

  const [products, config] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true },
      include: { images: { take: 1, orderBy: { sortOrder: "asc" } } },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
    getCatalogConfig(),
  ]);

  return (
    <ShopClient
      products={products}
      initialCategory={initialCategory}
      initialQuery={initialQuery}
      initialTag={initialTag}
      hiddenCategories={config.hiddenCategories}
      categoryMeta={config.categoryMeta}
    />
  );
}
