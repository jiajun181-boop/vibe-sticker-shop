import { prisma } from "@/lib/prisma";
import { ALL_CATEGORIES } from "@/lib/catalogConfig";
import { USE_CASE_SLUGS } from "@/lib/useCases";
import { INDUSTRY_TAGS } from "@/lib/industryTags";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://vibestickers.com";

export default async function sitemap() {
  const now = new Date();

  // Static pages
  const staticPages = [
    { url: SITE_URL, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/shop`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/faq`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/ideas`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
  ];

  // Category pages — /shop/{category}
  const categoryPages = ALL_CATEGORIES.map((cat) => ({
    url: `${SITE_URL}/shop/${cat}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8,
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

  // Product pages — /shop/{category}/{slug}
  const products = await prisma.product.findMany({
    where: { isActive: true },
    select: { slug: true, category: true, updatedAt: true },
  });

  const productPages = products.map((p) => ({
    url: `${SITE_URL}/shop/${p.category}/${p.slug}`,
    lastModified: p.updatedAt,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [
    ...staticPages,
    ...categoryPages,
    ...ideaPages,
    ...industryPages,
    ...productPages,
  ];
}
