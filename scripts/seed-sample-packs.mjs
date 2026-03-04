/**
 * Seed script: Creates low-price sample pack products.
 *
 * Usage: node scripts/seed-sample-packs.mjs
 *
 * Creates 2 sample pack products:
 *   1. Sticker Material Sample Pack ($5) — assorted sticker materials
 *   2. Business Card Paper Sample Pack ($5) — assorted paper stocks
 *
 * These products let new customers experience print quality
 * at a very low cost, driving repeat business (StickerMule model).
 */

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const SAMPLE_PACKS = [
  {
    slug: "sticker-sample-pack",
    name: "Sticker Material Sample Pack",
    nameZh: "贴纸材料样品包",
    description: "Try before you buy! Get a selection of our most popular sticker materials — white vinyl, clear, holographic, and matte — so you can feel the quality before placing a large order. Each pack includes 4-5 sample stickers (2\" × 2\") on different materials.",
    descriptionZh: "先试后买！获取我们最受欢迎的贴纸材料精选 — 白色乙烯基、透明、全息和哑光 — 让您在大量订购前感受质量。每包含4-5张不同材料的样品贴纸（2\" × 2\"）。",
    category: "stickers-labels-decals",
    basePrice: 500, // $5.00
    pricingModel: "FIXED",
    pricingUnit: "pack",
    sortOrder: 999,
  },
  {
    slug: "business-card-sample-pack",
    name: "Business Card Paper Sample Pack",
    nameZh: "名片纸质样品包",
    description: "Feel the difference! Get sample business cards printed on each of our premium paper stocks — 16pt matte, 16pt gloss, 32pt ultra-thick, silk laminate, and uncoated. Each sample shows the same test design so you can compare side-by-side.",
    descriptionZh: "感受不同！获取我们各种高端纸张印刷的名片样品 — 16pt哑光、16pt亮面、32pt超厚、丝绸覆膜和无涂层。每张样品使用相同的测试设计，方便您对比。",
    category: "marketing-business-print",
    basePrice: 500, // $5.00
    pricingModel: "FIXED",
    pricingUnit: "pack",
    sortOrder: 999,
  },
];

async function main() {
  for (const pack of SAMPLE_PACKS) {
    const existing = await prisma.product.findUnique({ where: { slug: pack.slug } });

    if (existing) {
      console.log(`  [skip] ${pack.slug} already exists (id: ${existing.id})`);
      continue;
    }

    const product = await prisma.product.create({
      data: {
        slug: pack.slug,
        name: pack.name,
        description: pack.description,
        category: pack.category,
        basePrice: pack.basePrice,
        pricingModel: pack.pricingModel,
        pricingUnit: pack.pricingUnit,
        sortOrder: pack.sortOrder,
        isActive: true,
        metaTitle: pack.name,
        metaDescription: pack.description.slice(0, 160),
        nameZh: pack.nameZh,
        descriptionZh: pack.descriptionZh,
      },
    });

    console.log(`  [created] ${pack.slug} (id: ${product.id})`);
  }

  console.log("\nDone! Sample packs seeded.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
