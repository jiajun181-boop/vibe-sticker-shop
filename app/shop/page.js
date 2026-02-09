import { prisma } from "@/lib/prisma";
import ShopClient from "./ShopClient";

export const dynamic = "force-dynamic";

export default async function ShopPage({ searchParams }) {
  const params = (await searchParams) || {};
  const initialCategory = typeof params.category === "string" ? params.category : "all";

  const products = await prisma.product.findMany({
    where: { isActive: true },
    include: { images: { take: 1, orderBy: { sortOrder: "asc" } } },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  return <ShopClient products={products} initialCategory={initialCategory} />;
}
