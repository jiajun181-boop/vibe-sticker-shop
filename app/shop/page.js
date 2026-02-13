import { prisma } from "@/lib/prisma";
import { getCatalogConfig } from "@/lib/catalogConfig";
import ShopClient from "./ShopClient";

export const dynamic = "force-dynamic";

export default async function ShopPage({ searchParams }) {
  const params = (await searchParams) || {};
  const initialQuery = typeof params.q === "string" ? params.q : "";
  const initialTag = typeof params.tag === "string" ? params.tag : "";
  const initialUseCase = typeof params.useCase === "string" ? params.useCase : "";

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

  return (
    <ShopClient
      products={products}
      initialQuery={initialQuery}
      initialTag={initialTag}
      initialUseCase={initialUseCase}
      categoryMeta={config.categoryMeta}
      departments={config.departments}
      departmentMeta={config.departmentMeta}
      categoryCounts={categoryCounts}
    />
  );
}
