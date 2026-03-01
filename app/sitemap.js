import { prisma } from "@/lib/prisma";
import { ALL_CATEGORIES } from "@/lib/catalogConfig";
import { USE_CASE_SLUGS } from "@/lib/useCases";
import { INDUSTRY_TAGS } from "@/lib/industryTags";
import { SEO_NOINDEX_SLUGS } from "@/lib/seo-noindex-slugs";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.lunarprint.ca";

export default async function sitemap() {
  const now = new Date();

  // High-priority pages — daily crawl
  const corePages = [
    { url: SITE_URL, lastModified: now, changeFrequency: "daily", priority: 1.0 },
    { url: `${SITE_URL}/shop`, lastModified: now, changeFrequency: "daily", priority: 1.0 },
  ];

  // Content pages
  const contentPages = [
    { url: `${SITE_URL}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/ideas`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/quote`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/design-services`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/artwork-guidelines`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/pricing`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/wholesale`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/partner`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
  ];

  // Configurator order pages — all routes with app/order/*/page.js
  const orderPages = [
    // Stickers & Labels
    "decals", "safety-labels", "industrial-labels", "vinyl-lettering", "roll-labels",
    "magnets-business-card",
    // Signs
    "foam-board-signs", "aluminum-signs", "pvc-signs", "a-frame-signs",
    "magnetic-signs", "yard-signs",
    // Banners & Displays
    "vinyl-banners", "mesh-banners", "fabric-banners",
    "retractable-stands", "x-banner-stands", "backdrops", "flags",
    // Canvas
    "canvas", "canvas-prints",
    // Windows, Walls & Floors
    "window-films", "wall-floor-graphics",
    // Vehicle
    "vehicle-wraps", "vehicle-decals",
    // Marketing & Business Print
    "marketing-print", "ncr", "booklets",
    "business-cards", "business-cards-classic", "business-cards-gloss",
    "business-cards-matte", "business-cards-pearl", "business-cards-soft-touch",
    "business-cards-gold-foil", "business-cards-linen", "business-cards-thick",
    "brochures", "flyers", "postcards", "posters", "door-hangers", "menus",
    "bookmarks", "calendars", "certificates", "coupons", "envelopes",
    "greeting-cards", "invitation-cards", "letterhead", "loyalty-cards",
    "notepads", "stamps", "tags", "tickets",
    "rack-cards", "table-tents", "tabletop-displays", "shelf-displays",
    "presentation-folders", "retail-tags",
    "inserts-packaging", "order-forms", "waivers-releases",
  ].map((slug) => ({
    url: `${SITE_URL}/order/${slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  // Legal pages — yearly crawl, low priority
  const legalPages = [
    { url: `${SITE_URL}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/returns`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/refund-policy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/faq`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];

  // Category pages — /shop/{category} — priority 0.9
  const categoryPages = ALL_CATEGORIES.map((cat) => ({
    url: `${SITE_URL}/shop/${cat}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.9,
  }));

  // Ideas / use case pages — /ideas/{slug}
  const ideaPages = USE_CASE_SLUGS.map((slug) => ({
    url: `${SITE_URL}/ideas/${slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  // Industry pages — /shop/industry/{tag}
  const industryPages = INDUSTRY_TAGS.map((tag) => ({
    url: `${SITE_URL}/shop/industry/${tag}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  // Product pages — /shop/{category}/{slug} — exclude noindex slugs
  const products = await prisma.product.findMany({
    where: { isActive: true },
    select: { slug: true, category: true, updatedAt: true },
  });

  const productPages = products
    .filter((p) => !SEO_NOINDEX_SLUGS.has(p.slug))
    .map((p) => ({
      url: `${SITE_URL}/shop/${p.category}/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "monthly",
      priority: 0.7,
    }));

  const allPages = [
    ...corePages,
    ...contentPages,
    ...orderPages,
    ...legalPages,
    ...categoryPages,
    ...ideaPages,
    ...industryPages,
    ...productPages,
  ];

  // zh variants temporarily excluded — Chinese content is still being built out.
  // Re-enable once all pages are fully translated.
  return allPages;
}
