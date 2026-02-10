// scripts/add-paper-materials.mjs
// Adds paper materials + finishing options to business_cards_default preset,
// and creates ncr_forms_default preset for NCR products.
// Safe to re-run — uses upsert.

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// ─── Paper materials for business_cards_default ─────────

const PAPER_MATERIALS = [
  { id: "12pt_c2s", name: "12pt C2S", multiplier: 1.0 },
  { id: "14pt_c2s", name: "14pt C2S", multiplier: 1.15 },
  { id: "100lb_c2s", name: "100lb C2S", multiplier: 0.85 },
];

const PAPER_FINISHINGS = [
  { id: "lam_gloss", name: "Gloss Lamination", type: "per_unit", price: 0.03 },
  { id: "lam_matte", name: "Matte Lamination", type: "per_unit", price: 0.03 },
  { id: "lam_soft_touch", name: "Soft Touch Lamination", type: "per_unit", price: 0.05 },
  { id: "hole_punch_125", name: 'Hole Punch 0.125"', type: "per_unit", price: 0.02 },
  { id: "hole_punch_250", name: 'Hole Punch 0.25"', type: "per_unit", price: 0.02 },
  { id: "staple_binding", name: "Staple Binding", type: "per_unit", price: 0.15 },
  { id: "perfect_binding", name: "Perfect Binding", type: "per_unit", price: 0.50 },
  { id: "foil_stamping", name: "Foil Stamping", type: "flat", price: 15.00 },
  { id: "scoring", name: "Score", type: "per_unit", price: 0.03 },
  { id: "perforation", name: "Perforation", type: "per_unit", price: 0.05 },
  { id: "die_cut", name: "Die Cut", type: "flat", price: 35.00 },
  { id: "numbering", name: "Sequential Numbering", type: "per_unit", price: 0.10 },
  { id: "folding", name: "Folding", type: "per_unit", price: 0.03 },
];

// ─── NCR Forms preset ───────────────────────────────────

const NCR_PRESET = {
  key: "ncr_forms_default",
  name: "NCR Forms — Default",
  model: "QTY_OPTIONS",
  config: {
    sizes: [
      {
        label: '8.5×11"',
        widthIn: 8.5,
        heightIn: 11,
        tiers: [
          { qty: 25, unitPrice: 3.50 },
          { qty: 50, unitPrice: 2.80 },
          { qty: 100, unitPrice: 2.20 },
          { qty: 250, unitPrice: 1.80 },
          { qty: 500, unitPrice: 1.50 },
        ],
      },
      {
        label: '11×17"',
        widthIn: 11,
        heightIn: 17,
        tiers: [
          { qty: 25, unitPrice: 5.00 },
          { qty: 50, unitPrice: 4.00 },
          { qty: 100, unitPrice: 3.20 },
          { qty: 250, unitPrice: 2.60 },
          { qty: 500, unitPrice: 2.20 },
        ],
      },
    ],
    addons: [
      { id: "numbering", name: "Sequential Numbering", price: 0.10, type: "per_unit" },
      { id: "perforation", name: "Perforation", price: 0.08, type: "per_unit" },
    ],
    materials: [
      { id: "ncr_2pt", name: "NCR 2-Part (White/Yellow)", multiplier: 1.0 },
      { id: "ncr_3pt", name: "NCR 3-Part (White/Yellow/Pink)", multiplier: 1.35 },
      { id: "ncr_4pt", name: "NCR 4-Part (White/Yellow/Pink/Gold)", multiplier: 1.7 },
    ],
    finishings: [
      { id: "staple_binding", name: "Staple Binding (Book)", type: "per_unit", price: 0.15 },
      { id: "padding", name: "Padding (Glue Edge)", type: "flat", price: 5.00 },
    ],
    fileFee: 10.0,
    minimumPrice: 40.0,
  },
};

// ─── Main ───────────────────────────────────────────────

async function main() {
  console.log("── Adding paper materials & finishings ──\n");

  // 1. Update business_cards_default preset — add materials + finishings
  const bcPreset = await prisma.pricingPreset.findUnique({
    where: { key: "business_cards_default" },
  });

  if (bcPreset) {
    const config = bcPreset.config || {};
    // Always set materials to latest list
    config.materials = PAPER_MATERIALS;
    console.log(`  Set ${PAPER_MATERIALS.length} materials on business_cards_default`);
    // Always set finishings to latest list
    config.finishings = PAPER_FINISHINGS;
    console.log(`  Set ${PAPER_FINISHINGS.length} finishings on business_cards_default`);

    await prisma.pricingPreset.update({
      where: { key: "business_cards_default" },
      data: { name: "Paper Prints — Default", config },
    });
    console.log(`  ✅ business_cards_default updated → "Paper Prints — Default" (id: ${bcPreset.id})\n`);
  } else {
    console.log("  ⚠ business_cards_default not found — run seed-pricing-presets first\n");
  }

  // 2. Upsert NCR forms preset
  const ncrPreset = await prisma.pricingPreset.upsert({
    where: { key: NCR_PRESET.key },
    create: {
      key: NCR_PRESET.key,
      name: NCR_PRESET.name,
      model: NCR_PRESET.model,
      config: NCR_PRESET.config,
    },
    update: {
      name: NCR_PRESET.name,
      model: NCR_PRESET.model,
      config: NCR_PRESET.config,
    },
  });
  console.log(`  ✅ NCR preset: ${NCR_PRESET.key} → ${ncrPreset.id}`);

  // 3. Assign NCR preset to NCR products (if they exist and have no preset)
  const ncrAssigned = await prisma.product.updateMany({
    where: {
      slug: {
        in: [
          "ncr-invoices",
          "ncr-invoice-books",
          "release-forms",
          "release-waiver-forms",
          "order-forms-single",
          "order-form-pads",
        ],
      },
      pricingPresetId: null,
    },
    data: { pricingPresetId: ncrPreset.id },
  });
  if (ncrAssigned.count > 0) {
    console.log(`  Assigned NCR preset to ${ncrAssigned.count} products`);
  }

  // 4. Also update seed file preset in DB (if config changed)
  // Re-seed the business_cards_default with the updated sizes that include paper sheet sizes
  if (bcPreset) {
    const updatedConfig = bcPreset.config || {};
    // Add 12×18 and 13×19 sheet sizes if not already present
    const existingSizes = Array.isArray(updatedConfig.sizes)
      ? updatedConfig.sizes
      : [];
    const hasLargeFormats = existingSizes.some(
      (s) => s.label === '12×18"' || s.label === '13×19"'
    );
    if (!hasLargeFormats) {
      existingSizes.push(
        {
          label: '12×18"',
          widthIn: 12,
          heightIn: 18,
          tiers: [
            { qty: 100, unitPrice: 0.45 },
            { qty: 250, unitPrice: 0.35 },
            { qty: 500, unitPrice: 0.28 },
            { qty: 1000, unitPrice: 0.22 },
          ],
        },
        {
          label: '13×19"',
          widthIn: 13,
          heightIn: 19,
          tiers: [
            { qty: 100, unitPrice: 0.55 },
            { qty: 250, unitPrice: 0.42 },
            { qty: 500, unitPrice: 0.35 },
            { qty: 1000, unitPrice: 0.28 },
          ],
        }
      );
      updatedConfig.sizes = existingSizes;
      await prisma.pricingPreset.update({
        where: { key: "business_cards_default" },
        data: { config: updatedConfig },
      });
      console.log(`\n  Added 12×18" and 13×19" sizes to business_cards_default`);
    }
  }

  console.log("\n── Done ──");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
