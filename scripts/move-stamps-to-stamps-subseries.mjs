import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const FROM_TAG = "subseries:letterhead-stationery";
const TO_TAG = "subseries:stamps";

const STAMP_SLUGS = new Set([
  "self-inking-stamps",
  "stamps-s827",
  "stamps-s510",
  "stamps-s520",
  "stamps-s542",
  "stamps-r512",
  "stamps-r524",
  "stamps-r532",
  "stamps-r552",
]);

function patchMarketingPrintSubGroups(categoryMeta = {}) {
  const next = { ...categoryMeta };
  const mp = next["marketing-prints"];
  if (!mp || !Array.isArray(mp.subGroups)) return next;

  const hasStamps = mp.subGroups.some((g) => g.slug === "stamps");
  if (hasStamps) return next;

  const idx = mp.subGroups.findIndex((g) => g.slug === "letterhead-stationery");
  const insertAt = idx >= 0 ? idx + 1 : mp.subGroups.length;
  const subGroups = [...mp.subGroups];
  subGroups.splice(insertAt, 0, {
    slug: "stamps",
    title: "Stamps",
    href: "/shop/marketing-prints/stamps",
  });
  next["marketing-prints"] = { ...mp, subGroups };
  return next;
}

async function main() {
  const rows = await prisma.product.findMany({
    where: { category: "marketing-prints", slug: { in: Array.from(STAMP_SLUGS) } },
    select: { id: true, slug: true, tags: true },
  });

  let moved = 0;
  for (const p of rows) {
    const cleaned = (p.tags || []).filter((t) => t !== FROM_TAG && t !== TO_TAG);
    cleaned.push(TO_TAG);
    await prisma.product.update({
      where: { id: p.id },
      data: { tags: cleaned },
    });
    moved += 1;
  }

  const setting = await prisma.setting.findUnique({ where: { key: "catalog.config" } });
  let settingUpdated = false;
  if (setting?.value && typeof setting.value === "object") {
    const value = { ...setting.value };
    value.categoryMeta = patchMarketingPrintSubGroups(value.categoryMeta || {});
    await prisma.setting.update({
      where: { key: "catalog.config" },
      data: { value },
    });
    settingUpdated = true;
  }

  console.log("Done.");
  console.log(`stamp products found: ${rows.length}`);
  console.log(`moved to subseries:stamps: ${moved}`);
  console.log(`catalog.config updated: ${settingUpdated ? "yes" : "no (using code defaults or missing setting)"}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

