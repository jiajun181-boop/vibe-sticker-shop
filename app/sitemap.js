import { prisma } from "@/lib/prisma";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://vibestickers.com";

export default async function sitemap() {
  const staticPages = [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/shop`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/contact`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/faq`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
  ];

  const categories = [
    "display-stands",
    "fleet-compliance-id",
    "vehicle-branding-advertising",
    "safety-warning-decals",
    "facility-asset-labels",
  ];

  const categoryPages = categories.map((cat) => ({
    url: `${SITE_URL}/shop?category=${cat}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

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

  return [...staticPages, ...categoryPages, ...productPages];
}
