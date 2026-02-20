/**
 * Signs & Display Boards cleanup script.
 * 1. Lists all products in signs-rigid-boards
 * 2. Keeps only the 11 canonical products (by slug matching)
 * 3. Deactivates (isActive=false) all others
 * 4. Renames specified products
 *
 * Usage:
 *   node scripts/cleanup-signs.mjs --dry-run   # Preview only
 *   node scripts/cleanup-signs.mjs             # Execute
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const DRY_RUN = process.argv.includes("--dry-run");

// ── The 11 canonical product slugs to KEEP ──
// Each entry: [slug(s) to match, canonical name, sub-group]
const KEEP_SLUGS = {
  // Coroplast Signs (4)
  "yard-sign":                  { name: "Yard & Lawn Signs", group: "Coroplast Signs" },
  "yard-signs-coroplast":       { name: "Yard & Lawn Signs", group: "Coroplast Signs", alt: true },
  "coroplast-yard-signs":       { name: "Yard & Lawn Signs", group: "Coroplast Signs", alt: true },
  "lawn-signs-h-stake":         { name: "Yard & Lawn Signs", group: "Coroplast Signs", alt: true },
  "real-estate-sign":           { name: "Real Estate Signs", group: "Coroplast Signs" },
  "real-estate-agent-sign":     { name: "Real Estate Signs", group: "Coroplast Signs", alt: true },
  "construction-site-signs":    { name: "Construction Signs", group: "Coroplast Signs" },
  "safety-signs":               { name: "Construction Signs", group: "Coroplast Signs", alt: true },
  "coroplast-signs":            { name: "Custom Coroplast", group: "Coroplast Signs" },
  // Foam Board Displays (4)
  "selfie-frame-board":         { name: "Photo Boards & Selfie Frames", group: "Foam Board" },
  "photo-board":                { name: "Photo Boards & Selfie Frames", group: "Foam Board", alt: true },
  "welcome-sign-board":         { name: "Welcome & Directional Signs", group: "Foam Board" },
  "tri-fold-presentation-board":{ name: "Presentation Boards", group: "Foam Board" },
  "foam-board":                 { name: "Custom Foam Board", group: "Foam Board" },
  "custom-foam-board":          { name: "Custom Foam Board", group: "Foam Board", alt: true },
  "foam-board-prints":          { name: "Custom Foam Board", group: "Foam Board", alt: true },
  // Accessories (3)
  "a-frame-sign-stand":         { name: "A-Frame Signs", group: "Accessories" },
  "a-frame-sandwich-board":     { name: "A-Frame Signs", group: "Accessories", alt: true },
  "h-stakes":                   { name: "H-Wire Stakes", group: "Accessories" },
  "h-stake-wire":               { name: "H-Wire Stakes", group: "Accessories", alt: true },
  "real-estate-frame":          { name: "Real Estate Frames", group: "Accessories" },
};

// Products that need renaming
const RENAMES = {
  "selfie-frame-board": "Photo Boards & Selfie Frames",
  "photo-board": "Photo Boards & Selfie Frames",
  "welcome-sign-board": "Welcome & Directional Signs",
  "h-stakes": "H-Wire Stakes",
  "h-stake-wire": "H-Wire Stakes",
  "a-frame-sign-stand": "A-Frame Signs",
  "a-frame-sandwich-board": "A-Frame Signs",
};

async function main() {
  console.log(`\n🪧  Signs & Display Boards Cleanup ${DRY_RUN ? "(DRY RUN)" : "(LIVE)"}\n`);

  // 1. Fetch all products in signs-rigid-boards
  const allProducts = await prisma.product.findMany({
    where: { category: "signs-rigid-boards" },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, slug: true, name: true, isActive: true, basePrice: true, displayFromPrice: true, minPrice: true },
  });

  console.log(`Total products in signs-rigid-boards: ${allProducts.length}\n`);

  // 2. Categorize
  const toKeep = [];
  const toDeactivate = [];

  for (const p of allProducts) {
    const match = KEEP_SLUGS[p.slug];
    if (match && !match.alt) {
      toKeep.push({ ...p, canonicalName: match.name, group: match.group });
    } else if (match && match.alt) {
      // Alternative slug for same product — deactivate (main slug is canonical)
      toDeactivate.push({ ...p, reason: `Alt slug for "${match.name}"` });
    } else {
      toDeactivate.push({ ...p, reason: "Not in keep list" });
    }
  }

  console.log(`✅ KEEP (${toKeep.length} products):`);
  for (const p of toKeep) {
    const rename = RENAMES[p.slug];
    console.log(`   ${p.slug} → "${rename || p.name}" [${p.group}] ${p.isActive ? "" : "(currently inactive)"}`);
  }

  console.log(`\n❌ DEACTIVATE (${toDeactivate.length} products):`);
  for (const p of toDeactivate) {
    console.log(`   ${p.slug} — "${p.name}" ${p.isActive ? "ACTIVE" : "(already inactive)"} — ${p.reason}`);
  }

  if (DRY_RUN) {
    console.log(`\n🔍 Dry run complete. Run without --dry-run to execute.\n`);
    await prisma.$disconnect();
    return;
  }

  // 3. Deactivate non-canonical products
  const deactivateIds = toDeactivate.filter(p => p.isActive).map(p => p.id);
  if (deactivateIds.length > 0) {
    const result = await prisma.product.updateMany({
      where: { id: { in: deactivateIds } },
      data: { isActive: false },
    });
    console.log(`\n⏬ Deactivated ${result.count} products`);
  }

  // 4. Rename products
  let renameCount = 0;
  for (const p of toKeep) {
    const newName = RENAMES[p.slug];
    if (newName && newName !== p.name) {
      await prisma.product.update({
        where: { id: p.id },
        data: { name: newName },
      });
      console.log(`📝 Renamed: "${p.name}" → "${newName}"`);
      renameCount++;
    }
  }

  // 5. Ensure kept products are active
  const keepIds = toKeep.map(p => p.id);
  await prisma.product.updateMany({
    where: { id: { in: keepIds } },
    data: { isActive: true },
  });

  console.log(`\n✅ Done! Kept ${toKeep.length} products, deactivated ${deactivateIds.length}, renamed ${renameCount}`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
