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
import HomeScrollWrapper from "@/components/home/HomeScrollWrapper";

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

  const quickProducts = products.slice(0, 36);

  const grouped = [];
  for (const cat of homepageCategories) {
    const items = products
      .filter((p) => p.category === cat)
      .slice(0, maxPerCategory);
    if (items.length > 0) grouped.push([cat, items]);
  }

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
    <HomeScrollWrapper>
      <div className="min-h-screen pb-20 relative">
        <OrganizationSchema />
        <WebSiteSchema />

        {/* 1. Hero */}
        <DualEntryHero totalCount={totalCount} />

        {/* 2. Popular Products */}
        <section className="py-20 bg-[var(--color-gray-50)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <QuickOrderStrip products={serializedQuickProducts} />
          </div>
        </section>

        {/* 3. Reorder Strip */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
          <ReorderStrip />
        </div>

        {/* 4. Shop by Category */}
        <section className="py-20 bg-white animate-on-scroll">
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="heading-2 text-center mb-10">
              {t("home.shopByCategory")}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {grouped.map(([category, items]) => {
                const meta = categoryMeta[category] || { title: category, icon: "\u{1F9E9}" };
                const totalInCat = products.filter((p) => p.category === category).length;
                const previewImg = items[0]?.images?.[0]?.url;
                return (
                  <Link
                    key={category}
                    href={`/shop/${category}`}
                    className="group overflow-hidden rounded-2xl border border-gray-200 bg-white hover-lift"
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
                        <h3 className="font-bold body-sm leading-tight">{meta.title}</h3>
                      </div>
                      <p className="label-xs text-gray-400 mt-1 font-normal tracking-wide">
                        {t("home.categoryCount", { count: totalInCat })}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
            <div className="text-center pt-10">
              <Link
                href="/shop"
                className="btn-primary-pill btn-md inline-block font-black tracking-widest"
              >
                {t("home.browseAll", { count: totalCount })}
              </Link>
            </div>
          </div>
        </section>

        {/* 5. Shop by Use Case */}
        <section className="py-20 bg-[var(--color-gray-50)] animate-on-scroll">
          <div className="max-w-7xl mx-auto px-6">
            <UseCaseSection />
          </div>
        </section>

        {/* 6. Trust Signals */}
        <section className="py-20 bg-white animate-on-scroll">
          <div className="max-w-7xl mx-auto px-6">
            <TrustSignals />
          </div>
        </section>

        {/* 7. Why La Lunar */}
        <section className="py-20 bg-[var(--color-gray-50)] animate-on-scroll">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-10">
              <div className="flex items-center justify-center gap-2 mb-3">
                <Image src="/logo-lunarprint.png" alt="" width={20} height={20} className="h-5 w-5 opacity-60" />
                <span className="label-xs text-gray-400">
                  {t("home.whyBadge")}
                </span>
              </div>
              <h2 className="heading-2">
                {t("home.whyTitle")}
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { icon: "\u{1F3ED}", titleKey: "home.usp1Title", bodyKey: "home.usp1Body" },
                { icon: "\u26A1", titleKey: "home.usp2Title", bodyKey: "home.usp2Body" },
                { icon: "\u{1F4EC}", titleKey: "home.usp3Title", bodyKey: "home.usp3Body" },
                { icon: "\u{1F4CF}", titleKey: "home.usp4Title", bodyKey: "home.usp4Body" },
              ].map((usp, i) => (
                <div key={usp.titleKey} className={`animate-on-scroll delay-${i + 1} rounded-2xl border border-gray-100 bg-white p-6 hover-lift-subtle`}>
                  <span className="text-3xl">{usp.icon}</span>
                  <h3 className="mt-3 body-sm font-bold">{t(usp.titleKey)}</h3>
                  <p className="mt-2 body-sm text-gray-500 leading-relaxed">{t(usp.bodyKey)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 8. How It Works */}
        <section className="py-20 bg-white animate-on-scroll">
          <div className="max-w-7xl mx-auto px-6">
            <HowItWorks />
          </div>
        </section>

        {/* 9. Quote Calculator */}
        <section className="py-20 bg-[var(--color-gray-50)] animate-on-scroll">
          <div className="max-w-7xl mx-auto px-6">
            <QuoteCalculator />
          </div>
        </section>

        {/* 10. Featured Display Products */}
        {displayProducts.length > 0 && (
          <section className="py-20 bg-white animate-on-scroll">
            <div className="max-w-7xl mx-auto px-6">
              <FeaturedBanner products={displayProducts} />
            </div>
          </section>
        )}

        {/* 11. Bundles */}
        <section className="py-20 bg-[var(--color-gray-50)] animate-on-scroll">
          <div className="max-w-7xl mx-auto px-6">
            <BundlesSection />
          </div>
        </section>
      </div>
    </HomeScrollWrapper>
  );
}
