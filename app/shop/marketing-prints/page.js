import { prisma } from "@/lib/prisma";
import MarketingPrintsClient from "./MarketingPrintsClient";

export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://vibestickers.com";

export async function generateMetadata() {
  const url = `${SITE_URL}/shop/marketing-prints`;
  return {
    title: "Marketing Prints — Vibe Sticker Shop",
    description:
      "Professional printing for flyers, postcards, brochures, booklets, menus, business cards, stamps, and more. Serving Toronto, the GTA, and Ontario with fast turnaround.",
    alternates: { canonical: url },
    openGraph: {
      title: "Marketing Prints — Vibe Sticker Shop",
      description:
        "Full-colour marketing print products — flyers, postcards, brochures, booklets, menus, and 25+ more.",
      url,
      type: "website",
    },
  };
}

export default async function MarketingPrintsPage() {
  const products = await prisma.product.findMany({
    where: {
      category: "marketing-prints",
      isActive: true,
      AND: [
        { slug: { not: { startsWith: "business-cards-" } } },
        { slug: { not: { startsWith: "stamps-" } } },
      ],
    },
    include: {
      images: { take: 1, orderBy: { sortOrder: "asc" } },
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  // Count business cards and stamps for the featured links
  const [bcCount, stampsCount] = await Promise.all([
    prisma.product.count({ where: { isActive: true, slug: { startsWith: "business-cards-" } } }),
    prisma.product.count({ where: { isActive: true, slug: { startsWith: "stamps-" } } }),
  ]);

  return (
    <MarketingPrintsClient
      products={products}
      bcCount={bcCount}
      stampsCount={stampsCount}
    />
  );
}
