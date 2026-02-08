import { prisma } from "@/lib/prisma";
import ProductTable from "./product-table";

export const dynamic = "force-dynamic";

export default async function AdminProducts() {
  const products = await prisma.product.findMany({
    include: { images: { take: 1, orderBy: { sortOrder: "asc" } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="min-h-screen bg-gray-50 p-8 pt-24">
      <div className="max-w-6xl mx-auto">
        <ProductTable products={products} />
      </div>
    </div>
  );
}
