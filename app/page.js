import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { getCatalogConfig } from "@/lib/catalogConfig";
import { getServerT } from "@/lib/i18n/server";
import { OrganizationSchema, WebSiteSchema } from "@/components/JsonLd";
import HowItWorks from "@/components/home/HowItWorks";
import FeaturedBanner from "@/components/home/FeaturedBanner";
import TrustSignals from "@/components/home/TrustSignals";
import BundlesSection from "@/components/home/BundlesSection";
import QuoteCalculator from "@/components/home/QuoteCalculator";
import UseCaseSection from "@/components/home/UseCaseSection";
import DualEntryHero from "@/components/home/DualEntryHero";
import QuickOrderStrip from "@/components/home/QuickOrderStrip";
import ReorderStrip from "@/components/home/ReorderStrip";

export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://lunarprint.ca";
const BRAND = "La Lunar Printing Inc.";

export async function generateMetadata() {
  const title = "Custom Stickers, Labels & Signs | La Lunar Printing";
  const description = "Toronto's trusted custom printing shop. Stickers, labels, banners, vehicle wraps, business cards & more. Fast turnaround, free shipping on orders $150+.";

  return {
    title,
    description,
    alternates: { canonical: SITE_URL },
    openGraph: {
      title: "Custom Stickers, Labels & Signs | La Lunar Printing",
      description: "Toronto's trusted custom printing shop. Stickers, labels, banners, vehicle wraps, business cards & more.",
      url: SITE_URL,
      siteName: BRAND,
      type: "website",
      images: [{ url: `${SITE_URL}/logo-social.png`, width: 1200, height: 630, alt: BRAND }],
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

function SectionDivider() {
  return (
    <div className="max-w-7xl mx-auto px-6 my-2">
      <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
    </div>
  );
}

export default async function HomePage() {
  const t = await getServerT();
  const config = await getCatalogConfig();
  const { homepageCategories, maxPerCategory, categoryMeta } = config;

  const [products, totalCount, displayProducts] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true, category: { in: homepageCategories } },
      include: { images: { take: 1, orderBy: { sortOrder: "asc" } } },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
    prisma.product.count({ where: { isActive: true } }),
    prisma.product.findMany({
      where: { isActive: true, category: "display-stands" },
      include: { images: { take: 1, orderBy: { sortOrder: "asc" } } },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      take: 6,
    }),
  ]);

  // More products for a long continuous popular strip
  const quickProducts = products.slice(0, 36);

  const grouped = [];
  for (const cat of homepageCategories) {
    const items = products
      .filter((p) => p.category === cat)
      .slice(0, maxPerCategory);
    if (items.length > 0) grouped.push([cat, items]);
  }

  // Serialize dates for client components
  const serializedQuickProducts = quickProducts.map((p) => ({
    ...p,
    createdAt: p.createdAt?.toISOString?.() || p.createdAt,
    updatedAt: p.updatedAt?.toISOString?.() || p.updatedAt,
    images: p.images?.map((img) => ({
      ...img,
      createdAt: img.createdAt?.toISOString?.() || img.createdAt,
    })),
  }));

  return (
    <div className="min-h-screen bg-[var(--color-gray-50)] pb-20 relative">
      <OrganizationSchema />
      <WebSiteSchema />

      {/* 1. Dual-Entry Hero */}
      <DualEntryHero totalCount={totalCount} />

      {/* 2. Popular Products (moved up) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-8 mb-10">
        <QuickOrderStrip products={serializedQuickProducts} />
      </div>

      {/* 3. Reorder Strip (logged-in users only, client-fetched) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-10">
        <ReorderStrip />
      </div>

      {/* 4. Shop by Category (moved up) */}
      <div className="max-w-7xl mx-auto px-6 my-12">
        <h2 className="text-2xl md:text-3xl font-black tracking-tight text-center mb-8">
          {t("home.shopByCategory")}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {grouped.map(([category, items]) => {
            const meta = categoryMeta[category] || { title: category, icon: "ðŸ§©" };
            const totalInCat = products.filter((p) => p.category === category).length;
            const previewImg = items[0]?.images?.[0]?.url;
            return (
              <Link
                key={category}
                href={`/shop/${category}`}
                className="group overflow-hidden rounded-2xl border border-gray-200 bg-white hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                <div className="aspect-[4/3] bg-gray-100 overflow-hidden flex items-center justify-center">
                  {previewImg ? (
                    <Image
                      src={previewImg}
                      alt={meta.title}
                      width={400}
                      height={300}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <span className="text-4xl">{meta.icon}</span>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{meta.icon}</span>
                    <h3 className="font-bold text-sm leading-tight">{meta.title}</h3>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {t("home.categoryCount", { count: totalInCat })}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
        <div className="text-center pt-8">
          <Link
            href="/shop"
            className="btn-primary-pill inline-block px-8 py-3 text-xs font-black tracking-widest"
          >
            {t("home.browseAll", { count: totalCount })}
          </Link>
        </div>
      </div>

      {/* 5. Shop by Use Case */}
      <div className="max-w-7xl mx-auto px-6 mb-10">
        <UseCaseSection />
      </div>

      <SectionDivider />

      {/* 5. Trust Signals â€” early social proof */}
      <div className="bg-white py-14">
        <div className="max-w-7xl mx-auto px-6">
          <TrustSignals />
        </div>
      </div>

      <SectionDivider />
      {/* 7. Why La Lunar â€” USP differentiators */}
      <div className="max-w-7xl mx-auto px-6 my-14">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Image src="/logo-lunarprint.png" alt="" width={20} height={20} className="h-5 w-5 opacity-60" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
              {t("home.whyBadge")}
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight">
            {t("home.whyTitle")}
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: "ðŸ­", titleKey: "home.usp1Title", bodyKey: "home.usp1Body" },
            { icon: "âš¡", titleKey: "home.usp2Title", bodyKey: "home.usp2Body" },
            { icon: "ðŸ”¬", titleKey: "home.usp3Title", bodyKey: "home.usp3Body" },
            { icon: "ðŸ“", titleKey: "home.usp4Title", bodyKey: "home.usp4Body" },
          ].map((usp) => (
            <div key={usp.titleKey} className="rounded-2xl border border-gray-100 bg-white p-5">
              <span className="text-2xl">{usp.icon}</span>
              <h3 className="mt-3 text-sm font-bold">{t(usp.titleKey)}</h3>
              <p className="mt-2 text-xs text-gray-500 leading-relaxed">{t(usp.bodyKey)}</p>
            </div>
          ))}
        </div>
      </div>

      <SectionDivider />

      {/* 8. How It Works */}
      <div className="max-w-7xl mx-auto px-6 my-14">
        <HowItWorks />
      </div>

      <SectionDivider />

      {/* 9. Quote Calculator */}
      <div className="max-w-7xl mx-auto px-6 mb-14">
        <QuoteCalculator />
      </div>

      <SectionDivider />

      {/* 10. Featured Display Products */}
      {displayProducts.length > 0 && (
        <div className="max-w-7xl mx-auto px-6 mb-14">
          <FeaturedBanner products={displayProducts} />
        </div>
      )}

      {/* 11. Bundles */}
      <div className="max-w-7xl mx-auto px-6 mb-14">
        <BundlesSection />
      </div>
    </div>
  );
}


