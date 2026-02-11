import { prisma } from "@/lib/prisma";
import { getCatalogConfig } from "@/lib/catalogConfig";
import ShopClient from "./ShopClient";

export const dynamic = "force-dynamic";

export default async function ShopPage({ searchParams }) {
  const params = (await searchParams) || {};
  const initialCategory = typeof params.category === "string" ? params.category : "all";
  const initialQuery = typeof params.q === "string" ? params.q : "";
  const initialTag = typeof params.tag === "string" ? params.tag : "";

  const [products, bcSample, config] = await Promise.all([
    prisma.product.findMany({
      where: {
        isActive: true,
        slug: { not: { startsWith: "business-cards-" } },
      },
      include: { images: { take: 1, orderBy: { sortOrder: "asc" } } },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
    prisma.product.findFirst({
      where: { isActive: true, slug: { startsWith: "business-cards-" } },
      include: { images: { take: 1, orderBy: { sortOrder: "asc" } } },
      orderBy: { basePrice: "asc" },
    }),
    getCatalogConfig(),
  ]);

  // Inject a single "Business Cards" entry linking to the landing page
  if (bcSample) {
    products.push({
      id: "bc-landing",
      name: "Business Cards",
      slug: "business-cards",
      category: "marketing-prints",
      basePrice: bcSample.basePrice,
      sortOrder: 1,
      isActive: true,
      pricingUnit: "per_unit",
      images: bcSample.images,
      tags: bcSample.tags || [],
      description: "8 premium finishes — Classic, Gloss, Matte, Soft Touch & more",
      turnaroundDays: bcSample.turnaroundDays,
      optionsConfig: { ui: { showFromPrice: true, isLandingPage: true } },
    });
  }

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
