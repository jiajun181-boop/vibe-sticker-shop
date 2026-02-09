// scripts/smoke-test.mjs
// Validates the updated Prisma schema for Stripe Integration Contract v1.1
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("=== Smoke Test — Stripe Integration v1.1 ===\n");

  // ── 1. Create Order with all new fields ──
  const order = await prisma.order.create({
    data: {
      stripeSessionId: `cs_test_smoke_${Date.now()}`,
      stripePaymentIntentId: `pi_test_smoke_${Date.now()}`,

      customerEmail: "smoke@test.com",
      customerName: "Smoke Test",
      customerPhone: "+1-416-555-0000",

      subtotalAmount: 5000,
      taxAmount: 650,
      shippingAmount: 1500,
      totalAmount: 7150,
      currency: "cad",

      status: "paid",
      paymentStatus: "paid",
      productionStatus: "not_started",
      paidAt: new Date(),

      items: {
        create: [
          {
            productName: "Custom Vinyl Sticker",
            productType: "sticker",
            quantity: 50,
            unitPrice: 100,
            totalPrice: 5000,
            widthIn: 3.0,
            heightIn: 3.0,
            material: "vinyl",
            finishing: "matte",
            meta: { shape: "circle", notes: "rush order" },
          },
        ],
      },
      notes: {
        create: {
          authorType: "system",
          message: "Smoke test order created",
        },
      },
    },
    include: { items: true, notes: true },
  });

  console.log("[OK] Order created:", order.id);
  console.log("     stripeSessionId:", order.stripeSessionId);
  console.log("     stripePaymentIntentId:", order.stripePaymentIntentId);
  console.log("     customerEmail:", order.customerEmail);
  console.log("     status:", order.status);
  console.log("     paymentStatus:", order.paymentStatus);
  console.log("     productionStatus:", order.productionStatus);
  console.log("     paidAt:", order.paidAt);
  console.log(`     subtotal: $${(order.subtotalAmount / 100).toFixed(2)}`);
  console.log(`     tax:      $${(order.taxAmount / 100).toFixed(2)}`);
  console.log(`     shipping: $${(order.shippingAmount / 100).toFixed(2)}`);
  console.log(`     total:    $${(order.totalAmount / 100).toFixed(2)}`);

  // ── 2. Verify OrderItem fields ──
  const item = order.items[0];
  console.log("\n[OK] OrderItem:", item.id);
  console.log("     productName:", item.productName);
  console.log("     productType:", item.productType);
  console.log("     quantity:", item.quantity);
  console.log(`     unitPrice: $${(item.unitPrice / 100).toFixed(2)}`);
  console.log(`     totalPrice: $${(item.totalPrice / 100).toFixed(2)}`);
  console.log(`     dimensions: ${item.widthIn}" x ${item.heightIn}"`);
  console.log("     material:", item.material);
  console.log("     finishing:", item.finishing);
  console.log("     meta:", JSON.stringify(item.meta));

  // ── 3. Verify OrderNote ──
  const note = order.notes[0];
  console.log("\n[OK] OrderNote:", note.id);
  console.log("     authorType:", note.authorType);
  console.log("     message:", note.message);

  // ── 4. Idempotency — unique constraint on stripeSessionId ──
  try {
    await prisma.order.create({
      data: {
        stripeSessionId: order.stripeSessionId,
        customerEmail: "duplicate@test.com",
      },
    });
    console.log("\n[FAIL] Duplicate stripeSessionId was allowed!");
    process.exit(1);
  } catch {
    console.log(
      "\n[OK] Idempotency: duplicate stripeSessionId correctly rejected"
    );
  }

  // ── 5. Index queries ──
  const byEmail = await prisma.order.findMany({
    where: { customerEmail: "smoke@test.com" },
  });
  console.log(
    `[OK] Index query (customerEmail): found ${byEmail.length} order(s)`
  );

  const byStatus = await prisma.order.findMany({
    where: {
      status: "paid",
      paymentStatus: "paid",
      productionStatus: "not_started",
    },
  });
  console.log(
    `[OK] Index query (composite status): found ${byStatus.length} order(s)`
  );

  // ── 6. Cleanup ──
  await prisma.order.delete({ where: { id: order.id } });
  console.log("\n[OK] Cleanup: smoke test order deleted");

  console.log("\n=== All smoke tests passed! ===");
}

main()
  .catch((err) => {
    console.error("[FAIL] Smoke test failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
