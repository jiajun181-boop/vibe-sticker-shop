import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const code = "FREESHIP";

  const existing = await prisma.coupon.findUnique({ where: { code } });
  if (existing) {
    console.log(`Coupon "${code}" already exists (id: ${existing.id}). Skipping.`);
    return;
  }

  const coupon = await prisma.coupon.create({
    data: {
      code,
      type: "fixed",
      value: 1500, // $15.00 — covers standard shipping cost
      minAmount: null, // no minimum order
      maxUses: null, // unlimited uses
      validFrom: new Date("2026-01-01T00:00:00Z"),
      validTo: new Date("2099-12-31T23:59:59Z"), // effectively no expiry
      isActive: true,
      description: "Free shipping on your order — covers $15 standard shipping fee",
    },
  });

  console.log(`Created coupon "${code}" (id: ${coupon.id})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
