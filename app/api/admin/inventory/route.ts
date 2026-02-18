import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-auth";
import { getLowStockProducts } from "@/lib/inventory";

export async function GET(req: NextRequest) {
  const auth = await requirePermission(req, "products", "view");
  if (!auth.authenticated) return auth.response;

  try {
    const url = new URL(req.url);
    const lowStockOnly = url.searchParams.get("lowStock") === "1";

    if (lowStockOnly) {
      const lowStock = await getLowStockProducts();
      return NextResponse.json({ products: lowStock, total: lowStock.length });
    }

    const products = await prisma.product.findMany({
      where: { trackInventory: true },
      select: {
        id: true,
        name: true,
        slug: true,
        category: true,
        stockQuantity: true,
        reservedQuantity: true,
        lowStockThreshold: true,
        isActive: true,
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ products, total: products.length });
  } catch (err) {
    console.error("[Inventory] Error:", err);
    return NextResponse.json({ error: "Failed to fetch inventory" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await requirePermission(req, "products", "edit");
  if (!auth.authenticated) return auth.response;

  try {
    const body = await req.json();
    const { productId, stockQuantity, lowStockThreshold, trackInventory } = body;

    if (!productId) {
      return NextResponse.json({ error: "productId is required" }, { status: 400 });
    }

    const data: Record<string, unknown> = {};
    if (typeof stockQuantity === "number") data.stockQuantity = Math.max(0, stockQuantity);
    if (typeof lowStockThreshold === "number") data.lowStockThreshold = Math.max(0, lowStockThreshold);
    if (typeof trackInventory === "boolean") data.trackInventory = trackInventory;

    const updated = await prisma.product.update({
      where: { id: productId },
      data,
      select: {
        id: true,
        name: true,
        stockQuantity: true,
        reservedQuantity: true,
        lowStockThreshold: true,
        trackInventory: true,
      },
    });

    return NextResponse.json({ product: updated });
  } catch (err) {
    console.error("[Inventory PATCH] Error:", err);
    return NextResponse.json({ error: "Failed to update inventory" }, { status: 500 });
  }
}
