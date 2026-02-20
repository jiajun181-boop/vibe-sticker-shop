/**
 * One-time script to sync DB catalog.config with code defaults.
 * Fixes: departmentMeta titles, categoryMeta titles, homepageCategories order,
 * and removes stale slugs like "custom-stickers".
 *
 * Usage:  node scripts/fix-department-names.mjs
 */
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const CORRECT_DEPARTMENTS = [
  { key: "marketing-business-print", categories: ["marketing-business-print"] },
  { key: "stickers-labels-decals", categories: ["stickers-labels-decals"] },
  { key: "signs-rigid-boards", categories: ["signs-rigid-boards"] },
  { key: "banners-displays", categories: ["banners-displays"] },
  { key: "canvas-prints", categories: ["canvas-prints"] },
  { key: "windows-walls-floors", categories: ["windows-walls-floors"] },
  { key: "vehicle-graphics-fleet", categories: ["vehicle-graphics-fleet"] },
];

const CORRECT_HOMEPAGE_CATEGORIES = [
  "marketing-business-print",
  "stickers-labels-decals",
  "signs-rigid-boards",
  "banners-displays",
  "canvas-prints",
  "windows-walls-floors",
  "vehicle-graphics-fleet",
];

const CORRECT_DEPARTMENT_META = {
  "marketing-business-print": { title: "Marketing & Business Print" },
  "stickers-labels-decals": { title: "Stickers & Labels" },
  "signs-rigid-boards": { title: "Signs & Display Boards" },
  "banners-displays": { title: "Banners & Displays" },
  "canvas-prints": { title: "Canvas Prints" },
  "windows-walls-floors": { title: "Windows, Walls & Floors Decals" },
  "vehicle-graphics-fleet": { title: "Vehicle Graphics & Fleet Branding" },
};

async function main() {
  const row = await prisma.setting.findUnique({
    where: { key: "catalog.config" },
  });

  if (!row) {
    console.log("No catalog.config setting found in DB — code defaults will be used.");
    return;
  }

  const old = row.value;
  console.log("Current state:");
  console.log("  departments:", JSON.stringify(old.departments?.map(d => d.key)));
  console.log("  homepageCategories:", JSON.stringify(old.homepageCategories));
  console.log("  departmentMeta keys:", Object.keys(old.departmentMeta || {}));

  // Update categoryMeta titles (preserve subGroups etc.)
  const categoryMeta = old.categoryMeta || {};
  if (categoryMeta["signs-rigid-boards"]) categoryMeta["signs-rigid-boards"].title = "Signs & Display Boards";
  if (categoryMeta["stickers-labels-decals"]) categoryMeta["stickers-labels-decals"].title = "Stickers & Labels";
  if (categoryMeta["windows-walls-floors"]) categoryMeta["windows-walls-floors"].title = "Windows, Walls & Floors Decals";
  if (categoryMeta["vehicle-graphics-fleet"]) categoryMeta["vehicle-graphics-fleet"].title = "Vehicle Graphics & Fleet Branding";

  const updated = {
    ...old,
    departments: CORRECT_DEPARTMENTS,
    homepageCategories: CORRECT_HOMEPAGE_CATEGORIES,
    departmentMeta: CORRECT_DEPARTMENT_META,
    categoryMeta,
  };

  await prisma.setting.update({
    where: { key: "catalog.config" },
    data: { value: updated },
  });

  console.log("\nSynced DB catalog.config:");
  console.log("  departments:", CORRECT_DEPARTMENTS.map(d => d.key));
  console.log("  homepageCategories:", CORRECT_HOMEPAGE_CATEGORIES);
  console.log("  departmentMeta:", Object.entries(CORRECT_DEPARTMENT_META).map(([k, v]) => `${k}: ${v.title}`));
  console.log("\nDone!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
