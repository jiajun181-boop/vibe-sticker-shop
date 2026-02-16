import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const LEGACY_TAG = "subseries:brochures-booklets";
const TAG_BROCHURES = "subseries:brochures";
const TAG_BOOKLETS = "subseries:booklets";

const BROCHURE_SLUGS = new Set([
  "brochures",
  "brochures-bi-fold",
  "brochures-tri-fold",
  "brochures-z-fold",
]);

const BOOKLET_SLUGS = new Set([
  "booklets",
  "booklets-saddle-stitch",
  "booklets-perfect-bound",
  "booklets-wire-o",
]);

function decideTargetTag(product) {
  const slug = String(product.slug || "").toLowerCase();
  if (BROCHURE_SLUGS.has(slug) || slug.includes("brochure")) return TAG_BROCHURES;
  if (BOOKLET_SLUGS.has(slug) || slug.includes("booklet")) return TAG_BOOKLETS;
  return null;
}

function splitMarketingPrintSubGroups(categoryMeta = {}) {
  const next = { ...categoryMeta };
  const mp = next["marketing-prints"];
  if (!mp || !Array.isArray(mp.subGroups)) return next;

  const hasBrochures = mp.subGroups.some((g) => g.slug === "brochures");
  const hasBooklets = mp.subGroups.some((g) => g.slug === "booklets");

  const out = [];
  for (const g of mp.subGroups) {
    if (g.slug === "brochures-booklets") {
      if (!hasBrochures) {
        out.push({
          slug: "brochures",
          title: "Brochures",
          href: "/shop/marketing-prints/brochures",
        });
      }
      if (!hasBooklets) {
        out.push({
          slug: "booklets",
          title: "Booklets",
          href: "/shop/marketing-prints/booklets",
        });
      }
      continue;
    }
    out.push(g);
  }

  next["marketing-prints"] = { ...mp, subGroups: out };
  return next;
}

async function main() {
  const rows = await prisma.product.findMany({
    where: {
      category: "marketing-prints",
      tags: { has: LEGACY_TAG },
    },
    select: { id: true, slug: true, tags: true },
  });

  let movedToBrochures = 0;
  let movedToBooklets = 0;
  let unresolved = 0;

  for (const p of rows) {
    const targetTag = decideTargetTag(p);
    if (!targetTag) {
      unresolved += 1;
      continue;
    }
    const cleaned = (p.tags || []).filter((t) => t !== LEGACY_TAG && t !== TAG_BROCHURES && t !== TAG_BOOKLETS);
    cleaned.push(targetTag);
    await prisma.product.update({
      where: { id: p.id },
      data: { tags: cleaned },
    });
    if (targetTag === TAG_BROCHURES) movedToBrochures += 1;
    if (targetTag === TAG_BOOKLETS) movedToBooklets += 1;
  }

  const setting = await prisma.setting.findUnique({ where: { key: "catalog.config" } });
  let settingUpdated = false;
  if (setting?.value && typeof setting.value === "object") {
    const value = { ...setting.value };
    value.categoryMeta = splitMarketingPrintSubGroups(value.categoryMeta || {});
    await prisma.setting.update({
      where: { key: "catalog.config" },
      data: { value },
    });
    settingUpdated = true;
  }

  console.log("Split complete.");
  console.log(`legacy tagged products found: ${rows.length}`);
  console.log(`moved to brochures: ${movedToBrochures}`);
  console.log(`moved to booklets: ${movedToBooklets}`);
  console.log(`unresolved (left unchanged): ${unresolved}`);
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

