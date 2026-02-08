// app/shop/[category]/[product]/page.js
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ProductClient from "./ProductClient";

export const dynamic = "force-dynamic";

export default async function ProductPage({ params }) {
  const { category, product: slug } = await params;

  // 1. Fetch from DB
  const product = await prisma.product.findFirst({
    where: { 
      slug: decodeURIComponent(slug),
      category: decodeURIComponent(category),
      isActive: true 
    },
  });

  // 2. Not found check
  if (!product) {
    notFound();
  }

  // 3. Render Client Component with data
  return <ProductClient product={product} />;
}