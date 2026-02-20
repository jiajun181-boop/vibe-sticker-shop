import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const row = await prisma.setting.findUnique({ where: { key: "catalog.config" } });
  if (!row?.value?.categoryMeta) {
    console.log("No categoryMeta in DB");
    return;
  }
  const cm = row.value.categoryMeta;
  for (const [cat, meta] of Object.entries(cm)) {
    console.log(`\n=== ${cat} (title: ${meta.title}) ===`);
    if (meta.subGroups?.length > 0) {
      meta.subGroups.forEach((sg, i) => console.log(`  ${i + 1}. ${sg.slug} — ${sg.title}`));
    } else {
      console.log("  (no subGroups)");
    }
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
