import { prisma } from "@/lib/prisma";
import MarketingPrintsClient from "./MarketingPrintsClient";

export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://vibestickers.com";

export async function generateMetadata() {
  const url = `${SITE_URL}/shop/marketing-prints`;
  return {
    title: "Marketing Prints — Vibe Sticker Shop",
    description:
      "Professional printing for flyers, postcards, brochures, booklets, menus, business cards, stamps, and more. Serving Toronto, the GTA, and Ontario with fast turnaround.",
    alternates: { canonical: url },
    openGraph: {
      title: "Marketing Prints — Vibe Sticker Shop",
      description:
        "Full-colour marketing print products — flyers, postcards, brochures, booklets, menus, and 25+ more.",
      url,
      type: "website",
    },
  };
}

// Slug groups matching MarketingPrintsClient SUB_CATEGORIES
const SLUG_GROUPS = {
  flyers: ["flyers", "mp-flyers"],
  brochures: ["brochures", "mp-brochures"],
  postcards: ["postcards", "mp-postcards"],
  booklets: ["booklets", "catalog-booklets"],
  menus: ["menus", "mp-menus"],
  stationery: ["letterhead", "envelopes", "ncr-invoices", "order-forms-single", "release-forms", "notepads", "presentation-folders"],
  marketing: ["rack-cards", "door-hangers", "tags-hang-tags", "calendars", "product-inserts", "box-sleeves"],
  cards: ["invitation-cards", "certificates", "coupons", "bookmarks", "tickets", "greeting-cards", "table-display-cards"],
};

export default async function MarketingPrintsPage() {
  // Fetch all active marketing-prints slugs for counting
  const products = await prisma.product.findMany({
    where: { category: "marketing-prints", isActive: true },
    select: { slug: true },
  });

  const slugSet = new Set(products.map((p) => p.slug));

  // Count products per sub-category
  const counts = {};
  for (const [key, slugs] of Object.entries(SLUG_GROUPS)) {
    counts[key] = slugs.filter((s) => slugSet.has(s)).length;
  }

  // Business cards and stamps use prefix-based counting
  const [bcCount, stampsCount] = await Promise.all([
    prisma.product.count({ where: { isActive: true, slug: { startsWith: "business-cards-" } } }),
    prisma.product.count({ where: { isActive: true, slug: { startsWith: "stamps-" } } }),
  ]);
  counts.businessCards = bcCount;
  counts.stamps = stampsCount;

  return <MarketingPrintsClient counts={counts} />;
}
