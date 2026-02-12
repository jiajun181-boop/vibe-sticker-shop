import { prisma } from "@/lib/prisma";
import SubGroupClient from "../SubGroupClient";

export const dynamic = "force-dynamic";

const SLUGS = ["invitation-cards", "certificates", "coupons", "bookmarks", "tickets", "greeting-cards", "table-display-cards"];

export async function generateMetadata() {
  return {
    title: "Cards & Invitations — Vibe Sticker Shop",
    description: "Custom greeting cards, invitation cards, certificates, coupons, bookmarks, and event tickets. Premium printing with fast turnaround.",
  };
}

export default async function CardsPage() {
  const products = await prisma.product.findMany({
    where: { slug: { in: SLUGS }, isActive: true },
    include: { images: { take: 1, orderBy: { sortOrder: "asc" } } },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  return <SubGroupClient products={products} groupKey="cards" />;
}
