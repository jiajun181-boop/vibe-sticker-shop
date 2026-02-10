import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const envelopeOptions = {
  quantityRange: { min: 100, max: 5000, step: 1 },
  sizes: [
    // 1) Standard business envelopes (#10)
    {
      label: "#10 No Window (4.125\" x 9.5\") - Black Ink",
      widthIn: 4.125,
      heightIn: 9.5,
      quantityChoices: [100, 500, 1000, 2000, 2500, 3000, 3500, 4000, 4500, 5000],
      priceByQty: {
        100: 4500,
        500: 9500,
        1000: 14500,
        2000: 26000,
        2500: 31500,
        3000: 37000,
        3500: 42500,
        4000: 48000,
        4500: 53000,
        5000: 58000,
      },
    },
    {
      label: "#10 No Window (4.125\" x 9.5\") - Color",
      widthIn: 4.125,
      heightIn: 9.5,
      quantityChoices: [100, 500, 1000, 2000, 2500, 3000, 3500, 4000, 4500, 5000],
      priceByQty: {
        100: 6500,
        500: 16500,
        1000: 25500,
        2000: 42000,
        2500: 51000,
        3000: 59500,
        3500: 68000,
        4000: 76000,
        4500: 84000,
        5000: 91500,
      },
    },
    {
      label: "Security #10 Window (4.125\" x 9.5\") - Black Ink",
      widthIn: 4.125,
      heightIn: 9.5,
      notes: "Security tint + window.",
      quantityChoices: [100, 500, 1000, 2000, 2500, 3000, 3500, 4000, 4500, 5000],
      priceByQty: {
        100: 5500,
        500: 11500,
        1000: 17500,
        2000: 31000,
        2500: 37500,
        3000: 44000,
        3500: 50500,
        4000: 57000,
        4500: 63000,
        5000: 69000,
      },
    },
    {
      label: "Security #10 Window (4.125\" x 9.5\") - Color",
      widthIn: 4.125,
      heightIn: 9.5,
      notes: "Security tint + window.",
      quantityChoices: [100, 500, 1000, 2000, 2500, 3000, 3500, 4000, 4500, 5000],
      priceByQty: {
        100: 7500,
        500: 18500,
        1000: 28500,
        2000: 48000,
        2500: 58000,
        3000: 67500,
        3500: 77000,
        4000: 86000,
        4500: 95000,
        5000: 103500,
      },
    },

    // 2) Invitation + small sizes (A2 & A7)
    {
      label: "A2 (4.375\" x 5.75\") - Black Ink",
      widthIn: 4.375,
      heightIn: 5.75,
      notes: "Fits 4x5 cards.",
      quantityChoices: [100, 500, 1000, 2000, 2500, 3000, 5000],
      priceByQty: {
        100: 5000,
        500: 13000,
        1000: 21000,
        2000: 39000,
        2500: 47000,
        3000: 55000,
        5000: 88000,
      },
    },
    {
      label: "A2 (4.375\" x 5.75\") - Color",
      widthIn: 4.375,
      heightIn: 5.75,
      notes: "Fits 4x5 cards.",
      quantityChoices: [100, 500, 1000, 2000, 2500, 3000, 5000],
      priceByQty: {
        100: 7500,
        500: 21000,
        1000: 34000,
        2000: 62000,
        2500: 75000,
        3000: 88000,
        5000: 140000,
      },
    },
    {
      label: "A7 (5.25\" x 7.25\") - Black Ink",
      widthIn: 5.25,
      heightIn: 7.25,
      notes: "Fits 5x7 cards.",
      quantityChoices: [100, 500, 1000, 2000, 2500, 3000, 5000],
      priceByQty: {
        100: 6000,
        500: 15000,
        1000: 24000,
        2000: 44000,
        2500: 53000,
        3000: 62000,
        5000: 99000,
      },
    },
    {
      label: "A7 (5.25\" x 7.25\") - Color",
      widthIn: 5.25,
      heightIn: 7.25,
      notes: "Fits 5x7 cards.",
      quantityChoices: [100, 500, 1000, 2000, 2500, 3000, 5000],
      priceByQty: {
        100: 8500,
        500: 23000,
        1000: 37000,
        2000: 68000,
        2500: 82000,
        3000: 96000,
        5000: 155000,
      },
    },

    // 3) Booklet & Catalog (color only)
    {
      label: "5.875\" x 9\" - Color",
      widthIn: 5.875,
      heightIn: 9.0,
      quantityChoices: [100, 500, 1000, 2000, 3000, 4000, 5000],
      priceByQty: {
        100: 14000,
        500: 22000,
        1000: 33000,
        2000: 62000,
        3000: 89000,
        4000: 115000,
        5000: 140000,
      },
    },
    {
      label: "9\" x 12\" - Color",
      widthIn: 9.0,
      heightIn: 12.0,
      quantityChoices: [100, 500, 1000, 2000, 3000, 4000, 5000],
      priceByQty: {
        100: 17000,
        500: 42000,
        1000: 71500,
        2000: 115000,
        3000: 165000,
        4000: 210000,
        5000: 255000,
      },
    },
    {
      label: "10\" x 13\" - Color",
      widthIn: 10.0,
      heightIn: 13.0,
      quantityChoices: [100, 500, 1000, 2000, 3000, 4000, 5000],
      priceByQty: {
        100: 19500,
        500: 46000,
        1000: 79500,
        2000: 132000,
        3000: 188000,
        4000: 242000,
        5000: 295000,
      },
    },
  ],
};

async function main() {
  const slug = "envelopes";
  const product = await prisma.product.findUnique({
    where: { slug },
    select: { id: true, slug: true, basePrice: true, pricingUnit: true },
  });

  if (!product) {
    throw new Error(`Product not found: ${slug}`);
  }

  await prisma.product.update({
    where: { slug },
    data: {
      pricingUnit: "per_piece",
      basePrice: product.basePrice > 0 ? product.basePrice : 55,
      optionsConfig: envelopeOptions,
    },
  });

  console.log(`Updated ${slug} with quantity/sizes/options.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
