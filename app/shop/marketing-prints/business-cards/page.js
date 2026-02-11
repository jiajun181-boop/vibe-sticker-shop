import { prisma } from "@/lib/prisma";
import BusinessCardsClient from "./BusinessCardsClient";

export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://vibestickers.com";

export async function generateMetadata() {
  return {
    title: "Business Cards — Vibe Sticker Shop",
    description:
      "Premium business cards in 8 finishes: Classic, Gloss, Matte, Soft Touch, Gold Foil, Linen, Pearl, and Thick Layered. Standard 3.5 × 2 inch North American size. Multi-name ordering available.",
    openGraph: {
      title: "Business Cards — Vibe Sticker Shop",
      description:
        "Premium business cards in 8 finishes. Standard 3.5 × 2 inch. Multi-name ordering available.",
      url: `${SITE_URL}/shop/business-cards`,
      type: "website",
    },
  };
}

export default async function BusinessCardsPage() {
  const products = await prisma.product.findMany({
    where: {
      slug: { startsWith: "business-cards-" },
      isActive: true,
    },
    include: {
      images: { take: 1, orderBy: { sortOrder: "asc" } },
    },
    orderBy: { sortOrder: "asc" },
  });

  return <BusinessCardsClient products={products} />;
}
