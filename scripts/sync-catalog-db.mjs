/**
 * One-time: Remove stale categoryMeta & departmentMeta from DB catalog.config.
 * After this, getCatalogConfig() falls back to code defaults in catalogConfig.js,
 * so any future code edits to names/ordering take effect immediately.
 *
 * Usage: node scripts/sync-catalog-db.mjs
 */
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const DEPARTMENTS = [
  { key: "marketing-business-print", categories: ["marketing-business-print"] },
  { key: "stickers-labels-decals", categories: ["stickers-labels-decals"] },
  { key: "signs-rigid-boards", categories: ["signs-rigid-boards"] },
  { key: "banners-displays", categories: ["banners-displays"] },
  { key: "canvas-prints", categories: ["canvas-prints"] },
  { key: "windows-walls-floors", categories: ["windows-walls-floors"] },
  { key: "vehicle-graphics-fleet", categories: ["vehicle-graphics-fleet"] },
];

const HOMEPAGE_CATEGORIES = [
  "marketing-business-print",
  "stickers-labels-decals",
  "signs-rigid-boards",
  "banners-displays",
  "canvas-prints",
  "windows-walls-floors",
  "vehicle-graphics-fleet",
];

async function main() {
  const row = await prisma.setting.findUnique({ where: { key: "catalog.config" } });
  if (!row) {
    console.log("No catalog.config in DB — code defaults already in effect.");
    return;
  }

  const old = row.value;
  console.log("Before:");
  console.log("  categoryMeta keys:", Object.keys(old.categoryMeta || {}));
  console.log("  departmentMeta keys:", Object.keys(old.departmentMeta || {}));

  // Keep structural config, remove meta overrides so code defaults take effect
  const cleaned = {
    departments: DEPARTMENTS,
    homepageCategories: HOMEPAGE_CATEGORIES,
    maxPerCategory: old.maxPerCategory ?? 6,
    hiddenCategories: old.hiddenCategories ?? [],
  };

  await prisma.setting.update({
    where: { key: "catalog.config" },
    data: { value: cleaned },
  });

  console.log("\nAfter: categoryMeta & departmentMeta REMOVED from DB.");
  console.log("Code defaults in lib/catalogConfig.js will now be used.");
  console.log("departments:", DEPARTMENTS.map(d => d.key));
  console.log("homepageCategories:", HOMEPAGE_CATEGORIES);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
