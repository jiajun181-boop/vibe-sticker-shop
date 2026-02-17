import { prisma } from "@/lib/prisma";
import { getServerT, getServerLocale } from "@/lib/i18n/server";
import { CATALOG_DEFAULTS } from "@/lib/catalogConfig";
import PricingClient from "./PricingClient";

export const revalidate = 3600;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://lunarprint.ca";

export async function generateMetadata() {
  const locale = await getServerLocale();
  const title = locale === "zh"
    ? "透明定价 | La Lunar Printing Inc."
    : "Transparent Pricing | La Lunar Printing Inc.";
  const description = locale === "zh"
    ? "查看所有印刷产品的批量定价。从名片到车辆贴花，享受透明的阶梯价格。"
    : "View volume pricing for all print products. From business cards to vehicle decals, enjoy transparent tiered pricing.";

  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/pricing` },
  };
}

export default async function PricingPage() {
  const t = await getServerT();

  // Fetch all active products with their pricing presets
  const products = await prisma.product.findMany({
    where: { isActive: true },
    select: {
      id: true,
      slug: true,
      name: true,
      category: true,
      basePrice: true,
      pricingUnit: true,
      tags: true,
      pricingPreset: {
        select: {
          key: true,
          name: true,
          model: true,
          config: true,
        },
      },
      images: {
        take: 1,
        orderBy: { sortOrder: "asc" },
        select: { url: true, alt: true },
      },
    },
    orderBy: [{ category: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
  });

  // Build department data using catalog config
  const { categoryMeta, departmentMeta } = CATALOG_DEFAULTS;
  const departments = [];

  for (const deptKey of Object.keys(categoryMeta)) {
    const meta = categoryMeta[deptKey];
    const deptTitle = departmentMeta[deptKey]?.title || meta.title;

    // Get products for this department
    const deptProducts = products.filter((p) => p.category === deptKey);

    // Group products by sub-group
    const subGroups = [];
    for (const sg of meta.subGroups) {
      // Find products matching this sub-group via tags or slug pattern
      const sgProducts = deptProducts.filter((p) => {
        if (p.tags?.includes(sg.slug)) return true;
        if (p.slug === sg.slug) return true;
        if (p.slug.startsWith(sg.slug + "-")) return true;
        return false;
      });

      // Even if no products matched, show sub-group if there's a preset with pricing data
      // Find the first product that has a preset with tiers for this group
      const representativeProduct = sgProducts.find((p) => p.pricingPreset?.config?.tiers?.length > 0);

      // Extract tier data from the representative product's preset
      let tiers = null;
      let pricingModel = null;
      if (representativeProduct?.pricingPreset) {
        const preset = representativeProduct.pricingPreset;
        pricingModel = preset.model;
        tiers = preset.config?.tiers || null;
      }

      subGroups.push({
        slug: sg.slug,
        title: sg.title,
        href: sg.href,
        productCount: sgProducts.length,
        pricingModel,
        tiers,
      });
    }

    departments.push({
      key: deptKey,
      title: deptTitle,
      icon: meta.icon,
      subGroups,
      productCount: deptProducts.length,
    });
  }

  return (
    <main className="min-h-screen bg-[var(--color-gray-50)]">
      <PricingClient departments={departments} />
    </main>
  );
}
