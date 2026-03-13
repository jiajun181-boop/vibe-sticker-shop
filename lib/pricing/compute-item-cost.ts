/**
 * lib/pricing/compute-item-cost.ts
 *
 * Computes cost breakdown for an OrderItem using the pricing contract engine.
 * Used post-order-creation to populate costBreakdownJson, materialCostCents,
 * and estimatedCostCents on each item.
 *
 * Non-critical — failures are logged but never propagate.
 */

import { prisma } from "@/lib/prisma";
import { buildPricingContract, sumCostBuckets } from "./pricing-contract";

/**
 * Compute and persist costBreakdownJson + summary cost fields for order items.
 * Call this after order items are created (webhook, invoice payment, etc.).
 *
 * @param orderId - The order whose items should be costed
 */
export async function populateItemCosts(orderId: string): Promise<void> {
  const items = await prisma.orderItem.findMany({
    where: { orderId },
    select: {
      id: true,
      productId: true,
      quantity: true,
      meta: true,
      costBreakdownJson: true,
      materialCostCents: true,
      estimatedCostCents: true,
    },
  });

  for (const item of items) {
    // Skip items that already have a cost breakdown
    if (item.costBreakdownJson) continue;
    // Skip items without a product link (e.g., manual/ad-hoc items)
    if (!item.productId) continue;

    try {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        include: { pricingPreset: true },
      });
      if (!product) continue;

      // Build pricing input from item meta
      const meta = (item.meta && typeof item.meta === "object" && !Array.isArray(item.meta))
        ? item.meta as Record<string, unknown>
        : {};

      const input: Record<string, unknown> = {
        quantity: item.quantity,
        material: meta.material || meta.materialId || undefined,
        size: meta.size || meta.sizeLabel || undefined,
        width: meta.width || undefined,
        height: meta.height || undefined,
        finishing: meta.finishing || meta.finishings || undefined,
        doubleSided: meta.doubleSided || meta.sides === "double" || undefined,
      };

      const contract = await buildPricingContract(product, input);
      const cost = contract.cost;
      const totalCost = sumCostBuckets(cost);

      // Only write if we got meaningful cost data
      if (totalCost <= 0) continue;

      const updateData: Record<string, unknown> = {
        costBreakdownJson: cost,
      };

      // Also populate summary cost fields if they're still at defaults
      if (item.materialCostCents === 0 && cost.material > 0) {
        updateData.materialCostCents = cost.material;
      }
      if (item.estimatedCostCents === 0 && totalCost > 0) {
        updateData.estimatedCostCents = totalCost;
      }

      await prisma.orderItem.update({
        where: { id: item.id },
        data: updateData,
      });
    } catch (err) {
      console.error(`[CostBreakdown] Failed to compute cost for item ${item.id}:`, err);
      // Non-fatal — continue with next item
    }
  }
}
