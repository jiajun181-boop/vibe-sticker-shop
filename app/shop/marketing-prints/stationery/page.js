import { prisma } from "@/lib/prisma";
import SubGroupClient from "../SubGroupClient";

export const dynamic = "force-dynamic";

const SLUGS = ["letterhead", "envelopes", "ncr-invoices", "order-forms-single", "release-forms", "notepads", "presentation-folders"];

export async function generateMetadata() {
  return {
    title: "Stationery & Forms — Vibe Sticker Shop",
    description: "Custom printed letterhead, envelopes, NCR forms, notepads, and presentation folders. Professional quality for your business.",
  };
}

export default async function StationeryPage() {
  const products = await prisma.product.findMany({
    where: { slug: { in: SLUGS }, isActive: true },
    include: { images: { take: 1, orderBy: { sortOrder: "asc" } } },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  return <SubGroupClient products={products} groupKey="stationery" />;
}
