/**
 * Fix placement tags on signs-rigid-boards products
 * and activate raw material sheet products.
 * Run: node scripts/fix-rigid-placement-tags.mjs
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Map each product slug to the correct subgroup placement tag
const SLUG_TO_SUBGROUP = {
  // yard-lawn-signs
  "yard-sign": "yard-lawn-signs",
  "yard-sign-h-frame": "yard-lawn-signs",
  "yard-signs-coroplast": "yard-lawn-signs",
  "yard-sign-panel-only": "yard-lawn-signs",
  "coroplast-signs": "yard-lawn-signs",
  "coroplast-yard-signs": "yard-lawn-signs",
  "lawn-signs-h-stake": "yard-lawn-signs",
  "double-sided-lawn-signs": "yard-lawn-signs",
  "directional-arrow-sign": "yard-lawn-signs",
  "directional-arrow-signs": "yard-lawn-signs",
  "election-campaign-sign": "yard-lawn-signs",
  "coroplast-sheet-4mm": "yard-lawn-signs",
  "coroplast-sheet-6mm": "yard-lawn-signs",
  "coroplast-sheet-10mm": "yard-lawn-signs",
  "h-stakes": "yard-lawn-signs",
  "h-stake-wire": "yard-lawn-signs",

  // real-estate-signs
  "real-estate-sign": "real-estate-signs",
  "real-estate-agent-sign": "real-estate-signs",
  "real-estate-riders": "real-estate-signs",
  "open-house-sign-kit": "real-estate-signs",
  "real-estate-frame": "real-estate-signs",

  // a-frames-signs
  "a-frame-stand": "a-frames-signs",
  "a-frame-sign-stand": "a-frames-signs",
  "a-frame-sandwich-board": "a-frames-signs",
  "a-frame-insert-prints": "a-frames-signs",
  "a-frame-double-sided": "a-frames-signs",
  "handheld-sign": "a-frames-signs",
  "handheld-signs": "a-frames-signs",

  // event-photo-boards
  "selfie-frame-board": "event-photo-boards",
  "life-size-cutout": "event-photo-boards",
  "giant-presentation-check": "event-photo-boards",
  "welcome-sign-board": "event-photo-boards",
  "seating-chart-board": "event-photo-boards",
  "event-celebration-board": "event-photo-boards",
  "memorial-tribute-board": "event-photo-boards",
  "photo-collage-board": "event-photo-boards",
  "event-photo-backdrop": "event-photo-boards",
  "handheld-prop-board": "event-photo-boards",
  "face-in-hole-board": "event-photo-boards",
  "photo-board": "event-photo-boards",

  // business-property
  "business-hours-sign": "business-property",
  "construction-site-signs": "business-property",
  "safety-signs": "business-property",
  "wayfinding-signs": "business-property",
  "parking-property-signs": "business-property",
  "qr-code-signs": "business-property",
  "address-house-number-signs": "business-property",
  "ada-braille-signs": "business-property",

  // display-tabletop
  "rigid-tabletop-signs": "display-tabletop",
  "tabletop-signs": "display-tabletop",
  "standoff-mounted-signs": "display-tabletop",
  "menu-boards": "display-tabletop",
  "tags-tickets-rigid": "display-tabletop",
  "floor-standup-display": "display-tabletop",
  "dry-erase-rigid-board": "display-tabletop",
  "tri-fold-presentation-board": "display-tabletop",

  // by-material
  "foam-board": "by-material",
  "custom-foam-board": "by-material",
  "foam-board-easel": "by-material",
  "foam-board-prints": "by-material",
  "rigid-foam-board-prints": "by-material",
  "foamboard-sheet-3-16": "by-material",
  "foamboard-sheet-1-2": "by-material",
  "acrylic-signs": "by-material",
  "clear-acrylic-signs": "by-material",
  "frosted-acrylic-signs": "by-material",
  "aluminum-signs": "by-material",
  "aluminum-composite": "by-material",
  "acm-dibond-signs": "by-material",
  "pvc-sintra-signs": "by-material",
  "pvc-sheet-3mm": "by-material",
  "gatorboard-signs": "by-material",
};

// Products that appear in multiple subgroups (display-tabletop shares some with a-frames-signs)
const MULTI_SUBGROUP = {
  "a-frame-sandwich-board": ["a-frames-signs", "display-tabletop"],
  "a-frame-insert-prints": ["a-frames-signs", "display-tabletop"],
  "handheld-sign": ["a-frames-signs", "display-tabletop"],
  "handheld-signs": ["a-frames-signs", "display-tabletop"],
};

// Raw material sheets to activate
const SHEETS_TO_ACTIVATE = [
  "coroplast-sheet-4mm", "coroplast-sheet-6mm", "coroplast-sheet-10mm",
  "foamboard-sheet-3-16", "foamboard-sheet-1-2", "pvc-sheet-3mm",
];

async function main() {
  // Fetch all signs-rigid-boards products (active AND inactive)
  const products = await prisma.product.findMany({
    where: { category: { in: ["signs-rigid-boards", "rigid-signs"] } },
    select: { id: true, slug: true, tags: true, isActive: true, category: true },
  });

  console.log(`Found ${products.length} total products (active + inactive)\n`);

  let updatedCount = 0;
  let activatedCount = 0;
  let recategorizedCount = 0;

  for (const product of products) {
    const updates = {};
    let newTags = [...product.tags];

    // 1. Fix category if still using old name
    if (product.category === "rigid-signs") {
      updates.category = "signs-rigid-boards";
      recategorizedCount++;
    }

    // 2. Fix placement tags
    const subgroup = SLUG_TO_SUBGROUP[product.slug];
    if (subgroup) {
      const correctTag = `placement:signs-rigid-boards:${subgroup}`;
      const multiGroups = MULTI_SUBGROUP[product.slug];

      // Remove all old placement tags for this category
      newTags = newTags.filter((t) => !t.startsWith("placement:signs-rigid-boards:"));

      // Add correct placement tag(s)
      newTags.push(correctTag);
      if (multiGroups) {
        for (const sg of multiGroups) {
          const tag = `placement:signs-rigid-boards:${sg}`;
          if (!newTags.includes(tag)) newTags.push(tag);
        }
      }

      // Check if tags actually changed
      const oldSet = new Set(product.tags);
      const newSet = new Set(newTags);
      if (oldSet.size !== newSet.size || [...newSet].some((t) => !oldSet.has(t))) {
        updates.tags = newTags;
      }
    }

    // 3. Activate raw material sheets
    if (SHEETS_TO_ACTIVATE.includes(product.slug) && !product.isActive) {
      updates.isActive = true;
      activatedCount++;
    }

    // Apply updates if any
    if (Object.keys(updates).length > 0) {
      await prisma.product.update({
        where: { id: product.id },
        data: updates,
      });
      updatedCount++;
      const changes = Object.keys(updates).join(", ");
      console.log(`  Updated ${product.slug}: ${changes}`);
    }
  }

  console.log(`\n=== Summary ===`);
  console.log(`  Products updated: ${updatedCount}`);
  console.log(`  Re-categorized (rigid-signs → signs-rigid-boards): ${recategorizedCount}`);
  console.log(`  Activated (raw sheets): ${activatedCount}`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
