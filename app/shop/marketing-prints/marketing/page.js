import { prisma } from "@/lib/prisma";
import SubGroupClient from "../SubGroupClient";

export const dynamic = "force-dynamic";

const SLUGS = ["rack-cards", "door-hangers", "tags-hang-tags", "calendars", "product-inserts", "box-sleeves"];

export async function generateMetadata() {
  return {
    title: "Marketing Materials — Vibe Sticker Shop",
    description: "Custom rack cards, door hangers, hang tags, calendars, and packaging inserts. Professional marketing print materials.",
  };
}

export default async function MarketingMaterialsPage() {
  const products = await prisma.product.findMany({
    where: { slug: { in: SLUGS }, isActive: true },
    include: { images: { take: 1, orderBy: { sortOrder: "asc" } } },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  return <SubGroupClient products={products} groupKey="marketing" />;
}
