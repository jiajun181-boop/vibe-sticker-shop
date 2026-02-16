import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const LEGACY_TAG = "subseries:flyers";
const TAG_FLYERS = "subseries:flyers";
const TAG_RACK = "subseries:rack-cards";
const TAG_DOOR = "subseries:door-hangers";

const FLYER_SLUGS = new Set(["flyers", "flyers-small", "flyers-standard", "flyers-large"]);
const RACK_SLUGS = new Set(["rack-cards", "rack-cards-standard", "rack-cards-tear-off", "rack-cards-folded"]);
const DOOR_SLUGS = new Set(["door-hangers", "door-hangers-standard", "door-hangers-large", "door-hangers-perforated"]);

function decideTargetTag(slugValue) {
  const slug = String(slugValue || "").toLowerCase();
  if (RACK_SLUGS.has(slug) || slug.includes("rack-card")) return TAG_RACK;
  if (DOOR_SLUGS.has(slug) || slug.includes("door-hanger")) return TAG_DOOR;
  if (FLYER_SLUGS.has(slug) || slug.includes("flyer")) return TAG_FLYERS;
  return null;
}

function splitMarketingPrintSubGroups(categoryMeta = {}) {
  const next = { ...categoryMeta };
  const mp = next["marketing-prints"];
  if (!mp || !Array.isArray(mp.subGroups)) return next;

  const hasRack = mp.subGroups.some((g) => g.slug === "rack-cards");
  const hasDoor = mp.subGroups.some((g) => g.slug === "door-hangers");
  const out = [];

  for (const g of mp.subGroups) {
    out.push(g);
    if (g.slug === "flyers") {
      if (!hasRack) {
        out.push({
          slug: "rack-cards",
          title: "Rack Cards",
          href: "/shop/marketing-prints/rack-cards",
        });
      }
      if (!hasDoor) {
        out.push({
          slug: "door-hangers",
          title: "Door Hangers",
          href: "/shop/marketing-prints/door-hangers",
        });
      }
    }
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

  let flyers = 0;
  let rack = 0;
  let door = 0;
  let unresolved = 0;

  for (const p of rows) {
    const targetTag = decideTargetTag(p.slug);
    if (!targetTag) {
      unresolved += 1;
      continue;
    }
    const cleaned = (p.tags || []).filter((t) => t !== TAG_FLYERS && t !== TAG_RACK && t !== TAG_DOOR);
    cleaned.push(targetTag);
    await prisma.product.update({
      where: { id: p.id },
      data: { tags: cleaned },
    });
    if (targetTag === TAG_FLYERS) flyers += 1;
    if (targetTag === TAG_RACK) rack += 1;
    if (targetTag === TAG_DOOR) door += 1;
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
  console.log(`flyers: ${flyers}`);
  console.log(`rack-cards: ${rack}`);
  console.log(`door-hangers: ${door}`);
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

