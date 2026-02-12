/**
 * Ensures the "posters" product exists in the database.
 * Run: node scripts/ensure-posters.mjs
 * Then run: node prisma/backfill-marketing-prints-all.mjs
 * to populate its full optionsConfig.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.product.findUnique({
    where: { slug: "posters" },
  });

  if (existing) {
    if (!existing.isActive) {
      await prisma.product.update({
        where: { slug: "posters" },
        data: { isActive: true },
      });
      console.log("Posters product activated.");
    } else {
      console.log("Posters product already exists and is active.");
    }
    return;
  }

  await prisma.product.create({
    data: {
      slug: "posters",
      name: "Posters",
      category: "marketing-prints",
      description:
        "Large-format poster printing with vivid full-colour on premium gloss or matte paper. Sizes from 11\" × 17\" tabloid to 24\" × 36\". Ideal for retail signage, trade show displays, concert promotions, office décor, and event advertising.",
      type: "other",
      basePrice: 9900,
      pricingUnit: "per_piece",
      isActive: true,
      sortOrder: 5,
      acceptedFormats: ["ai", "pdf", "eps", "tiff", "jpg", "png"],
      minDpi: 150,
      requiresBleed: true,
      bleedIn: 0.125,
    },
  });

  console.log("Posters product created. Run backfill-marketing-prints-all.mjs to populate optionsConfig.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
