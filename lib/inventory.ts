import { prisma } from "./prisma";

interface StockCheckResult {
  available: boolean;
  productId: string;
  productName: string;
  requested: number;
  available_quantity: number;
}

/**
 * Check if requested quantity is available for products that track inventory.
 */
export async function checkStock(
  items: Array<{ productId: string; quantity: number }>
): Promise<{ ok: boolean; issues: StockCheckResult[] }> {
  const issues: StockCheckResult[] = [];

  for (const item of items) {
    const product = await prisma.product.findUnique({
      where: { id: item.productId },
      select: {
        id: true,
        name: true,
        trackInventory: true,
        stockQuantity: true,
        reservedQuantity: true,
      },
    });

    if (!product || !product.trackInventory) continue;

    const availableQty = product.stockQuantity - product.reservedQuantity;
    if (item.quantity > availableQty) {
      issues.push({
        available: false,
        productId: product.id,
        productName: product.name,
        requested: item.quantity,
        available_quantity: availableQty,
      });
    }
  }

  return { ok: issues.length === 0, issues };
}

/**
 * Atomically check stock and reserve in a single transaction.
 * Prevents TOCTOU race conditions between check and reserve.
 */
export async function checkAndReserveStock(
  items: Array<{ productId: string; quantity: number }>
): Promise<{ ok: boolean; issues: StockCheckResult[]; reserved: string[] }> {
  return prisma.$transaction(async (tx) => {
    const issues: StockCheckResult[] = [];
    const reserved: string[] = [];

    for (const item of items) {
      const product = await tx.product.findUnique({
        where: { id: item.productId },
        select: {
          id: true,
          name: true,
          trackInventory: true,
          stockQuantity: true,
          reservedQuantity: true,
        },
      });

      if (!product || !product.trackInventory) continue;

      const availableQty = product.stockQuantity - product.reservedQuantity;
      if (item.quantity > availableQty) {
        issues.push({
          available: false,
          productId: product.id,
          productName: product.name,
          requested: item.quantity,
          available_quantity: availableQty,
        });
      }
    }

    if (issues.length > 0) {
      return { ok: false, issues, reserved };
    }

    // All items available — reserve within the same transaction
    for (const item of items) {
      const product = await tx.product.findUnique({
        where: { id: item.productId },
        select: { id: true, trackInventory: true },
      });

      if (!product || !product.trackInventory) continue;

      await tx.product.update({
        where: { id: item.productId },
        data: { reservedQuantity: { increment: item.quantity } },
      });
      reserved.push(item.productId);
    }

    return { ok: true, issues, reserved };
  });
}

/**
 * Reserve stock for items during checkout. Returns reservation IDs.
 * @deprecated Use checkAndReserveStock for atomic check+reserve.
 */
export async function reserveStock(
  items: Array<{ productId: string; quantity: number }>
): Promise<string[]> {
  const reserved: string[] = [];

  for (const item of items) {
    const product = await prisma.product.findUnique({
      where: { id: item.productId },
      select: { id: true, trackInventory: true },
    });

    if (!product || !product.trackInventory) continue;

    await prisma.product.update({
      where: { id: item.productId },
      data: { reservedQuantity: { increment: item.quantity } },
    });
    reserved.push(item.productId);
  }

  return reserved;
}

/**
 * Release reserved stock (e.g., on checkout expiration).
 * Uses a transaction to ensure consistency.
 */
export async function releaseReserve(
  items: Array<{ productId: string; quantity: number }>
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    for (const item of items) {
      const product = await tx.product.findUnique({
        where: { id: item.productId },
        select: { id: true, trackInventory: true, reservedQuantity: true },
      });

      if (!product || !product.trackInventory) continue;

      const newReserved = Math.max(0, product.reservedQuantity - item.quantity);
      await tx.product.update({
        where: { id: item.productId },
        data: { reservedQuantity: newReserved },
      });
    }
  });
}

/**
 * Decrement actual stock after successful order (and release the reservation).
 * Uses a transaction to ensure consistency.
 */
export async function decrementStock(
  items: Array<{ productId: string; quantity: number }>
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    for (const item of items) {
      const product = await tx.product.findUnique({
        where: { id: item.productId },
        select: { id: true, trackInventory: true, stockQuantity: true, reservedQuantity: true },
      });

      if (!product || !product.trackInventory) continue;

      const newStock = Math.max(0, product.stockQuantity - item.quantity);
      const newReserved = Math.max(0, product.reservedQuantity - item.quantity);

      await tx.product.update({
        where: { id: item.productId },
        data: {
          stockQuantity: newStock,
          reservedQuantity: newReserved,
        },
      });
    }
  });
}

/**
 * Get products with low stock levels.
 */
export async function getLowStockProducts() {
  const products = await prisma.product.findMany({
    where: {
      trackInventory: true,
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      stockQuantity: true,
      reservedQuantity: true,
      lowStockThreshold: true,
    },
  });

  return products.filter(
    (p) => (p.stockQuantity - p.reservedQuantity) <= p.lowStockThreshold
  );
}
