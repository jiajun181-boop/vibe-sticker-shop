/**
 * One-time: fix stale categoryMeta titles in DB catalog.config setting.
 */
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const row = await prisma.setting.findUnique({ where: { key: "catalog.config" } });
  if (!row?.value?.categoryMeta) {
    console.log("No categoryMeta in DB — nothing to fix.");
    return;
  }
  const cm = row.value.categoryMeta;
  if (cm["stickers-labels-decals"]) cm["stickers-labels-decals"].title = "Stickers & Labels";
  if (cm["windows-walls-floors"]) cm["windows-walls-floors"].title = "Windows, Walls & Floors Decals";
  if (cm["vehicle-graphics-fleet"]) cm["vehicle-graphics-fleet"].title = "Vehicle Graphics & Fleet Branding";

  await prisma.setting.update({
    where: { key: "catalog.config" },
    data: { value: { ...row.value, categoryMeta: cm } },
  });

  console.log("categoryMeta titles updated:");
  for (const [k, v] of Object.entries(cm)) {
    console.log(`  ${k}: ${v.title}`);
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
