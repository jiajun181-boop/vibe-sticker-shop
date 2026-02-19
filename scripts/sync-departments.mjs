/**
 * Sync the catalog.config Setting row to use the flat 6-department structure.
 *
 * Usage:  node scripts/sync-departments.mjs
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const NEW_DEPARTMENTS = [
  { key: "marketing-business-print", categories: ["marketing-business-print"] },
  { key: "stickers-labels-decals", categories: ["stickers-labels-decals"] },
  { key: "signs-rigid-boards", categories: ["signs-rigid-boards"] },
  { key: "banners-displays", categories: ["banners-displays"] },
  { key: "windows-walls-floors", categories: ["windows-walls-floors"] },
  { key: "vehicle-graphics-fleet", categories: ["vehicle-graphics-fleet"] },
];

const NEW_DEPARTMENT_META = {
  "marketing-business-print": { title: "Marketing & Business Print" },
  "stickers-labels-decals": { title: "Stickers & Labels" },
  "signs-rigid-boards": { title: "Signs & Rigid Boards" },
  "banners-displays": { title: "Banners & Displays" },
  "windows-walls-floors": { title: "Windows, Walls & Floors Decals" },
  "vehicle-graphics-fleet": { title: "Vehicle & Fleet Graphics" },
};

async function main() {
  const row = await prisma.setting.findUnique({
    where: { key: "catalog.config" },
  });

  if (!row) {
    console.log("No catalog.config row in DB — DEFAULTS will be used. Nothing to update.");
    return;
  }

  const current = row.value;
  const updated = {
    ...current,
    departments: NEW_DEPARTMENTS,
    departmentMeta: NEW_DEPARTMENT_META,
  };

  await prisma.setting.update({
    where: { key: "catalog.config" },
    data: { value: updated },
  });

  console.log("✓ Updated catalog.config → 6 flat departments");
  console.log("  departments:", JSON.stringify(updated.departments.map((d) => d.key)));
}

main()
  .catch((e) => {
    console.error("Error:", e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
