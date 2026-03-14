import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-auth";

// ─── Types ────────────────────────────────────────────────────────────────────

interface MaterialReport {
  id: string;
  type: string;
  name: string;
  family: string | null;
  rollSpec: string | null;
  sqftPerRoll: number;
  rollCost: number;
  costPerSqft: number;
  lamination: string | null;
  isActive: boolean;
  /** Materials don't track discrete stock; flag rolls with $0 cost as "needs attention" */
  needsAttention: boolean;
  attentionReason: string | null;
}

interface ProductReport {
  id: string;
  name: string;
  slug: string;
  stockQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  lowStockThreshold: number;
  isLowStock: boolean;
  isOutOfStock: boolean;
  isActive: boolean;
}

interface StockMovement {
  orderId: string;
  orderStatus: string;
  customerEmail: string;
  createdAt: Date;
  items: Array<{
    productId: string | null;
    productName: string;
    quantity: number;
    material: string | null;
  }>;
}

interface ReorderSuggestion {
  id: string;
  name: string;
  slug: string;
  currentStock: number;
  reservedQuantity: number;
  availableQuantity: number;
  lowStockThreshold: number;
  deficit: number;
  suggestedReorder: number;
}

// ─── GET /api/admin/inventory/report ──────────────────────────────────────────

export async function GET(request: NextRequest) {
  const auth = await requirePermission(request, "inventory", "view");
  if (!auth.authenticated) return auth.response;

  try {
    const url = new URL(request.url);
    const type = url.searchParams.get("type") || "all"; // "materials" | "products" | "all"
    const lowStockOnly = url.searchParams.get("lowStockOnly") === "true";

    const report: {
      generatedAt: string;
      type: string;
      materials?: { items: MaterialReport[]; total: number; activeCount: number; needsAttentionCount: number };
      products?: { items: ProductReport[]; total: number; lowStockCount: number; outOfStockCount: number; activeTrackedCount: number };
      stockMovements?: StockMovement[];
      reorderSuggestions?: ReorderSuggestion[];
      summary?: {
        totalTrackedProducts: number;
        totalLowStock: number;
        totalOutOfStock: number;
        totalMaterials: number;
        totalActiveMaterials: number;
      };
    } = {
      generatedAt: new Date().toISOString(),
      type,
    };

    // ── Material stock levels ───────────────────────────────────────────────

    if (type === "materials" || type === "all") {
      const materials = await prisma.material.findMany({
        orderBy: [{ type: "asc" }, { sortOrder: "asc" }],
        select: {
          id: true,
          type: true,
          name: true,
          family: true,
          rollSpec: true,
          sqftPerRoll: true,
          rollCost: true,
          costPerSqft: true,
          lamination: true,
          isActive: true,
        },
      });

      const materialItems: MaterialReport[] = materials.map((m) => {
        // Flag materials that may need attention:
        // - Zero cost (pricing not set)
        // - Zero sqft per roll (roll spec incomplete)
        // - Inactive materials that might still be referenced
        let needsAttention = false;
        let attentionReason: string | null = null;

        if (m.isActive && m.costPerSqft === 0 && m.rollCost === 0) {
          needsAttention = true;
          attentionReason = "No cost set — pricing will be $0";
        } else if (m.isActive && m.sqftPerRoll === 0) {
          needsAttention = true;
          attentionReason = "Roll sqft not set — cannot compute per-sqft cost from roll";
        }

        return {
          id: m.id,
          type: m.type,
          name: m.name,
          family: m.family,
          rollSpec: m.rollSpec,
          sqftPerRoll: m.sqftPerRoll,
          rollCost: m.rollCost,
          costPerSqft: m.costPerSqft,
          lamination: m.lamination,
          isActive: m.isActive,
          needsAttention,
          attentionReason,
        };
      });

      const filtered = lowStockOnly
        ? materialItems.filter((m) => m.needsAttention)
        : materialItems;

      report.materials = {
        items: filtered,
        total: filtered.length,
        activeCount: materials.filter((m) => m.isActive).length,
        needsAttentionCount: materialItems.filter((m) => m.needsAttention).length,
      };
    }

    // ── Product stock levels ────────────────────────────────────────────────

    if (type === "products" || type === "all") {
      const products = await prisma.product.findMany({
        where: { trackInventory: true },
        select: {
          id: true,
          name: true,
          slug: true,
          stockQuantity: true,
          reservedQuantity: true,
          lowStockThreshold: true,
          isActive: true,
        },
        orderBy: { name: "asc" },
      });

      const productItems: ProductReport[] = products.map((p) => {
        const availableQuantity = p.stockQuantity - p.reservedQuantity;
        const isLowStock = availableQuantity <= p.lowStockThreshold;
        const isOutOfStock = availableQuantity <= 0;

        return {
          id: p.id,
          name: p.name,
          slug: p.slug,
          stockQuantity: p.stockQuantity,
          reservedQuantity: p.reservedQuantity,
          availableQuantity,
          lowStockThreshold: p.lowStockThreshold,
          isLowStock,
          isOutOfStock,
          isActive: p.isActive,
        };
      });

      const filtered = lowStockOnly
        ? productItems.filter((p) => p.isLowStock)
        : productItems;

      report.products = {
        items: filtered,
        total: filtered.length,
        lowStockCount: productItems.filter((p) => p.isLowStock).length,
        outOfStockCount: productItems.filter((p) => p.isOutOfStock).length,
        activeTrackedCount: products.filter((p) => p.isActive).length,
      };
    }

    // ── Stock movement history (recent orders consuming stock) ───────────

    if (type === "products" || type === "all") {
      const recentOrders = await prisma.order.findMany({
        where: {
          status: { in: ["paid"] },
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // last 30 days
        },
        select: {
          id: true,
          status: true,
          customerEmail: true,
          createdAt: true,
          items: {
            where: { productId: { not: null } },
            select: {
              productId: true,
              productName: true,
              quantity: true,
              material: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      });

      // Only include orders that have items with tracked-inventory products
      const trackedProductIds = new Set(
        (report.products?.items ?? []).map((p) => p.id)
      );

      report.stockMovements = recentOrders
        .filter((o) => o.items.some((i) => i.productId && trackedProductIds.has(i.productId)))
        .map((o) => ({
          orderId: o.id,
          orderStatus: o.status,
          customerEmail: o.customerEmail,
          createdAt: o.createdAt,
          items: o.items
            .filter((i) => i.productId && trackedProductIds.has(i.productId))
            .map((i) => ({
              productId: i.productId,
              productName: i.productName,
              quantity: i.quantity,
              material: i.material,
            })),
        }))
        .slice(0, 25); // cap at 25 movements
    }

    // ── Reorder suggestions (items below threshold) ─────────────────────

    if (type === "products" || type === "all") {
      const lowStockProducts = (report.products?.items ?? []).filter(
        (p) => p.isLowStock && p.isActive
      );

      report.reorderSuggestions = lowStockProducts.map((p) => {
        // Suggest reorder to 2x threshold, minimum of threshold + 10
        const targetStock = Math.max(p.lowStockThreshold * 2, p.lowStockThreshold + 10);
        const deficit = p.lowStockThreshold - p.availableQuantity;
        const suggestedReorder = Math.max(0, targetStock - p.availableQuantity);

        return {
          id: p.id,
          name: p.name,
          slug: p.slug,
          currentStock: p.stockQuantity,
          reservedQuantity: p.reservedQuantity,
          availableQuantity: p.availableQuantity,
          lowStockThreshold: p.lowStockThreshold,
          deficit: Math.max(0, deficit),
          suggestedReorder,
        };
      });
    }

    // ── Summary ─────────────────────────────────────────────────────────

    report.summary = {
      totalTrackedProducts: report.products?.items.length ?? 0,
      totalLowStock: report.products?.lowStockCount ?? 0,
      totalOutOfStock: report.products?.outOfStockCount ?? 0,
      totalMaterials: report.materials?.total ?? 0,
      totalActiveMaterials: report.materials?.activeCount ?? 0,
    };

    return NextResponse.json(report);
  } catch (err) {
    console.error("[Inventory Report] Error:", err);
    return NextResponse.json(
      { error: "Failed to generate inventory report" },
      { status: 500 }
    );
  }
}
