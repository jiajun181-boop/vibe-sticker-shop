// prisma/seed-hardware.mjs
// Seed HardwareItem table from hardcoded config prices.
// Usage: node prisma/seed-hardware.mjs

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const items = [
  // ── Banner Stand ──
  { sortOrder: 1,  category: "Banner Stand",   slug: "retractable-stand-economy",     name: "Retractable Stand — Economy",        priceCents: 0,    unit: "per_unit" },
  { sortOrder: 2,  category: "Banner Stand",   slug: "retractable-stand-standard",    name: "Retractable Stand — Standard",       priceCents: 1500, unit: "per_unit" },
  { sortOrder: 3,  category: "Banner Stand",   slug: "retractable-stand-premium",     name: "Retractable Stand — Premium",        priceCents: 3000, unit: "per_unit" },
  { sortOrder: 4,  category: "Banner Stand",   slug: "retractable-stand-fabric",      name: "Retractable Stand — Fabric Upgrade", priceCents: 500,  unit: "per_unit" },
  { sortOrder: 5,  category: "Banner Stand",   slug: "retractable-stand-padded-case", name: "Retractable Stand — Padded Case",    priceCents: 500,  unit: "per_unit" },
  { sortOrder: 6,  category: "Banner Stand",   slug: "x-banner-stand-base",           name: "X-Banner Stand — Base",              priceCents: 0,    unit: "per_unit" },
  { sortOrder: 7,  category: "Banner Stand",   slug: "x-banner-stand-premium",        name: "X-Banner Stand — Premium",           priceCents: 800,  unit: "per_unit" },
  { sortOrder: 8,  category: "Banner Stand",   slug: "x-banner-stand-fabric",         name: "X-Banner Stand — Fabric Upgrade",    priceCents: 300,  unit: "per_unit" },
  { sortOrder: 9,  category: "Banner Stand",   slug: "tabletop-stand-base",           name: "Tabletop Stand — Base",              priceCents: 0,    unit: "per_unit" },
  { sortOrder: 10, category: "Banner Stand",   slug: "tabletop-stand-premium",        name: "Tabletop Stand — Premium",           priceCents: 1000, unit: "per_unit" },

  // ── Sign Accessory ──
  { sortOrder: 1,  category: "Sign Accessory", slug: "h-stake",                       name: "H-Stakes",                           priceCents: 150,  unit: "per_unit" },
  { sortOrder: 2,  category: "Sign Accessory", slug: "wire-stake",                    name: "Wire Stakes",                        priceCents: 100,  unit: "per_unit" },
  { sortOrder: 3,  category: "Sign Accessory", slug: "a-frame-stand",                 name: "A-Frame Stand (included)",           priceCents: 0,    unit: "included" },
  { sortOrder: 4,  category: "Sign Accessory", slug: "easel-back",                    name: "Easel Back",                         priceCents: 75,   unit: "per_unit" },
  { sortOrder: 5,  category: "Sign Accessory", slug: "standoffs",                     name: "Standoff Mounts",                    priceCents: 400,  unit: "per_unit" },
  { sortOrder: 6,  category: "Sign Accessory", slug: "wall-spacers",                  name: "Wall Spacers",                       priceCents: 200,  unit: "per_unit" },
  { sortOrder: 7,  category: "Sign Accessory", slug: "drilled-holes",                 name: "Pre-Drilled Holes (included)",       priceCents: 0,    unit: "included" },
  { sortOrder: 8,  category: "Sign Accessory", slug: "post-mount",                    name: "Post-Mount Holes (included)",        priceCents: 0,    unit: "included" },
  { sortOrder: 9,  category: "Sign Accessory", slug: "real-estate-frame",             name: "Metal Frame",                        priceCents: 1200, unit: "per_unit" },
  { sortOrder: 10, category: "Sign Accessory", slug: "rider-clips",                   name: "Rider Sign Clips",                   priceCents: 150,  unit: "per_unit" },
  { sortOrder: 11, category: "Sign Accessory", slug: "a-frame-metal-frame",           name: "A-Frame Metal Frame Upgrade",        priceCents: 2000, unit: "per_unit" },
  { sortOrder: 12, category: "Sign Accessory", slug: "a-frame-aluminum-insert",       name: "A-Frame Aluminum Insert Upgrade",    priceCents: 500,  unit: "per_unit" },
  { sortOrder: 13, category: "Sign Accessory", slug: "a-frame-pvc-insert",            name: "A-Frame PVC Insert Upgrade",         priceCents: 300,  unit: "per_unit" },

  // ── Finishing ──
  { sortOrder: 1,  category: "Finishing",       slug: "hems",                          name: "Heat-Welded Hems (included)",        priceCents: 0,    unit: "included" },
  { sortOrder: 2,  category: "Finishing",       slug: "grommets",                      name: "Grommets — every 2ft (included)",    priceCents: 0,    unit: "included" },
  { sortOrder: 3,  category: "Finishing",       slug: "pole-pockets",                  name: "Pole Pockets",                       priceCents: 50,   unit: "per_unit" },
  { sortOrder: 4,  category: "Finishing",       slug: "wind-slits",                    name: "Wind Slits",                         priceCents: 25,   unit: "per_unit" },
];

async function main() {
  console.log(`Seeding ${items.length} hardware items...`);

  for (const item of items) {
    await prisma.hardwareItem.upsert({
      where: { slug: item.slug },
      update: {
        sortOrder: item.sortOrder,
        category: item.category,
        name: item.name,
        priceCents: item.priceCents,
        unit: item.unit,
      },
      create: item,
    });
    console.log(`  ✓ ${item.slug} ($${(item.priceCents / 100).toFixed(2)})`);
  }

  console.log("Done!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
