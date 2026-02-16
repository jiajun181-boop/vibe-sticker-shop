import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const LEGACY_TAG = "subseries:greeting-cards";
const TAG_CERT = "subseries:certificates";
const TAG_GREET = "subseries:greeting-cards";
const TAG_INVITE = "subseries:invitation-cards";
const TAG_LOYALTY = "subseries:loyalty-cards";

const CERT_SLUGS = new Set(["certificates", "bf-certificates", "gift-certificates"]);
const INVITE_SLUGS = new Set(["invitation-cards", "invitations-flat"]);
const GREET_SLUGS = new Set(["greeting-cards"]);
const LOYALTY_SLUGS = new Set(["loyalty-cards"]);

function decideTargetTag(slugValue) {
  const slug = String(slugValue || "").toLowerCase();
  if (CERT_SLUGS.has(slug) || slug.includes("certificate")) return TAG_CERT;
  if (INVITE_SLUGS.has(slug) || slug.includes("invitation")) return TAG_INVITE;
  if (GREET_SLUGS.has(slug) || slug.includes("greeting-card")) return TAG_GREET;
  if (LOYALTY_SLUGS.has(slug) || slug.includes("loyalty")) return TAG_LOYALTY;
  return null;
}

function splitMarketingPrintSubGroups(categoryMeta = {}) {
  const next = { ...categoryMeta };
  const mp = next["marketing-prints"];
  if (!mp || !Array.isArray(mp.subGroups)) return next;

  const hasCert = mp.subGroups.some((g) => g.slug === "certificates");
  const hasGreet = mp.subGroups.some((g) => g.slug === "greeting-cards");
  const hasInvite = mp.subGroups.some((g) => g.slug === "invitation-cards");
  const hasLoyalty = mp.subGroups.some((g) => g.slug === "loyalty-cards");

  const out = [];
  for (const g of mp.subGroups) {
    if (g.slug === "greeting-cards") {
      if (!hasCert) {
        out.push({ slug: "certificates", title: "Certificates", href: "/shop/marketing-prints/certificates" });
      }
      if (!hasGreet) {
        out.push({ slug: "greeting-cards", title: "Greeting Cards", href: "/shop/marketing-prints/greeting-cards" });
      }
      if (!hasInvite) {
        out.push({ slug: "invitation-cards", title: "Invitation Cards", href: "/shop/marketing-prints/invitation-cards" });
      }
      if (!hasLoyalty) {
        out.push({ slug: "loyalty-cards", title: "Loyalty Cards", href: "/shop/marketing-prints/loyalty-cards" });
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
    where: { category: "marketing-prints", tags: { has: LEGACY_TAG } },
    select: { id: true, slug: true, tags: true },
  });

  let cert = 0;
  let greet = 0;
  let invite = 0;
  let loyalty = 0;
  let unresolved = 0;

  for (const p of rows) {
    const targetTag = decideTargetTag(p.slug);
    if (!targetTag) {
      unresolved += 1;
      continue;
    }
    const cleaned = (p.tags || []).filter((t) => ![TAG_CERT, TAG_GREET, TAG_INVITE, TAG_LOYALTY].includes(t));
    cleaned.push(targetTag);
    await prisma.product.update({ where: { id: p.id }, data: { tags: cleaned } });
    if (targetTag === TAG_CERT) cert += 1;
    if (targetTag === TAG_GREET) greet += 1;
    if (targetTag === TAG_INVITE) invite += 1;
    if (targetTag === TAG_LOYALTY) loyalty += 1;
  }

  const setting = await prisma.setting.findUnique({ where: { key: "catalog.config" } });
  let settingUpdated = false;
  if (setting?.value && typeof setting.value === "object") {
    const value = { ...setting.value };
    value.categoryMeta = splitMarketingPrintSubGroups(value.categoryMeta || {});
    await prisma.setting.update({ where: { key: "catalog.config" }, data: { value } });
    settingUpdated = true;
  }

  console.log("Split complete.");
  console.log(`legacy tagged products found: ${rows.length}`);
  console.log(`certificates: ${cert}`);
  console.log(`greeting-cards: ${greet}`);
  console.log(`invitation-cards: ${invite}`);
  console.log(`loyalty-cards: ${loyalty}`);
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

