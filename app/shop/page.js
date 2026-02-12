import { prisma } from "@/lib/prisma";
import { getCatalogConfig } from "@/lib/catalogConfig";
import ShopClient from "./ShopClient";

export const dynamic = "force-dynamic";

// Business cards (8 variants) and stamps (8 models) are sub-products
// that get collapsed into single representative entries linking to their
// landing pages.
const GROUPED_ENTRIES = [
  {
    id: "bc-landing",
    name: "Business Cards",
    slug: "business-cards",
    sortOrder: 1,
    description: "8 premium finishes — Classic, Gloss, Matte, Soft Touch & more",
    href: "/shop/business-cards",
    sampleWhere: { isActive: true, slug: { startsWith: "business-cards-" } },
  },
  {
    id: "stamps-landing",
    name: "Self-Inking Stamps",
    slug: "stamps",
    sortOrder: 2,
    description: "8 models — Rectangular, Square & Round. Custom text + logo.",
    href: "/shop/marketing-prints/stamps",
    sampleWhere: { isActive: true, slug: { startsWith: "stamps-" } },
  },
];

export default async function ShopPage({ searchParams }) {
  const params = (await searchParams) || {};
  const initialCategory = typeof params.category === "string" ? params.category : "all";
  const initialQuery = typeof params.q === "string" ? params.q : "";
  const initialTag = typeof params.tag === "string" ? params.tag : "";
  const initialUseCase = typeof params.useCase === "string" ? params.useCase : "";

  const [products, config, ...groupedSamples] = await Promise.all([
    // All active products, excluding business-cards-* and stamps-* sub-variants
    prisma.product.findMany({
      where: {
        isActive: true,
        AND: [
          { slug: { not: { startsWith: "business-cards-" } } },
          { slug: { not: { startsWith: "stamps-" } } },
        ],
      },
      include: { images: { take: 1, orderBy: { sortOrder: "asc" } } },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
    getCatalogConfig(),
    // Fetch a sample product for each grouped entry (for price & image)
    ...GROUPED_ENTRIES.map((ge) =>
      prisma.product.findFirst({
        where: ge.sampleWhere,
        include: { images: { take: 1, orderBy: { sortOrder: "asc" } } },
        orderBy: { basePrice: "asc" },
      })
    ),
  ]);

  // Inject representative entries for Business Cards and Stamps
  GROUPED_ENTRIES.forEach((ge, i) => {
    const sample = groupedSamples[i];
    if (!sample) return;
    products.push({
      id: ge.id,
      name: ge.name,
      slug: ge.slug,
      category: "marketing-prints",
      basePrice: sample.basePrice,
      sortOrder: ge.sortOrder,
      isActive: true,
      pricingUnit: "per_unit",
      images: sample.images,
      tags: sample.tags || [],
      description: ge.description,
      turnaroundDays: sample.turnaroundDays,
      optionsConfig: {
        ui: { showFromPrice: true, isLandingPage: true, href: ge.href },
      },
    });
  });

  return (
    <ShopClient
      products={products}
      initialCategory={initialCategory}
      initialQuery={initialQuery}
      initialTag={initialTag}
      initialUseCase={initialUseCase}
      hiddenCategories={config.hiddenCategories}
      categoryMeta={config.categoryMeta}
    />
  );
}
