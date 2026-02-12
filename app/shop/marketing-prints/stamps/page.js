import { prisma } from "@/lib/prisma";
import StampsClient from "./StampsClient";

export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://vibestickers.com";

export async function generateMetadata() {
  return {
    title: "Self-Inking Stamps — Vibe Sticker Shop",
    description:
      "Custom self-inking stamps in 8 models: rectangular, square, and round. S-series and R-series with replacement pads available. Enter your text, add a logo, done.",
    openGraph: {
      title: "Self-Inking Stamps — Vibe Sticker Shop",
      description:
        "Custom self-inking stamps in 8 models. Fast, clean impressions. Replacement pads available.",
      url: `${SITE_URL}/shop/marketing-prints/stamps`,
      type: "website",
    },
  };
}

export default async function StampsPage() {
  const products = await prisma.product.findMany({
    where: {
      slug: { startsWith: "stamps-" },
      isActive: true,
    },
    include: {
      images: { take: 1, orderBy: { sortOrder: "asc" } },
    },
    orderBy: { sortOrder: "asc" },
  });

  return <StampsClient products={products} />;
}
