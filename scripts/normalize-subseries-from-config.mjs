import { PrismaClient } from "@prisma/client";
import { SUB_PRODUCT_CONFIG } from "../lib/subProductConfig.js";

const prisma = new PrismaClient();
const SUBSERIES_PREFIX = "subseries:";

function buildSlugMap() {
  const map = new Map();
  for (const [parentSlug, cfg] of Object.entries(SUB_PRODUCT_CONFIG)) {
    for (const slug of cfg.dbSlugs || []) {
      const key = `${cfg.category}::${slug}`;
      if (!map.has(key)) map.set(key, parentSlug);
    }
  }
  return map;
}

function getExistingSubseries(tags) {
  if (!Array.isArray(tags)) return null;
  const hit = tags.find((t) => typeof t === "string" && t.startsWith(SUBSERIES_PREFIX));
  return hit ? hit.slice(SUBSERIES_PREFIX.length) : null;
}

async function main() {
  const slugMap = buildSlugMap();
  const products = await prisma.product.findMany({
    select: { id: true, slug: true, category: true, tags: true },
  });

  let matched = 0;
  let updated = 0;
  let unchanged = 0;
  let notMapped = 0;
  const movedByParent = new Map();

  for (const p of products) {
    const key = `${p.category}::${p.slug}`;
    const targetParent = slugMap.get(key);
    if (!targetParent) {
      notMapped += 1;
      continue;
    }

    matched += 1;
    const oldParent = getExistingSubseries(p.tags);
    const cleaned = (p.tags || []).filter(
      (t) => !(typeof t === "string" && t.startsWith(SUBSERIES_PREFIX))
    );
    const nextTags = [...cleaned, `${SUBSERIES_PREFIX}${targetParent}`];

    const same =
      Array.isArray(p.tags) &&
      p.tags.length === nextTags.length &&
      p.tags.every((x, i) => x === nextTags[i]);

    if (same) {
      unchanged += 1;
      continue;
    }

    await prisma.product.update({
      where: { id: p.id },
      data: { tags: nextTags },
    });

    updated += 1;
    movedByParent.set(targetParent, (movedByParent.get(targetParent) || 0) + 1);
    if (oldParent && oldParent !== targetParent) {
      // no-op, tracked via updated count; kept for clarity
    }
  }

  const summary = [...movedByParent.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `${k}:${v}`)
    .join(", ");

  console.log("Normalize subseries complete.");
  console.log(`total products: ${products.length}`);
  console.log(`matched by config: ${matched}`);
  console.log(`updated: ${updated}`);
  console.log(`unchanged: ${unchanged}`);
  console.log(`not mapped: ${notMapped}`);
  console.log(`updated breakdown: ${summary || "none"}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

