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
import HomeLandingHighlights from "@/components/home/HomeLandingHighlights";

export const revalidate = 60;

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

  const [products, totalCount, displayProducts, quoteProducts] = await Promise.all([
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
    // Quote calculator: popular products with real pricing
    prisma.product.findMany({
      where: {
        isActive: true,
        slug: {
          in: [
            "retractable-banner-stand-premium",
            "x-banner-stand-standard",
            "tabletop-banner-a3",
            "vinyl-banners",
            "business-cards-classic",
            "die-cut-stickers",
            "coroplast-yard-signs",
            "flyers",
            "floor-graphics",
            "full-vehicle-wrap-design-print",
          ],
        },
      },
      select: {
        slug: true,
        name: true,
        category: true,
        pricingUnit: true,
        basePrice: true,
        minPrice: true,
        displayFromPrice: true,
      },
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

        {/* 2. Entry Highlights */}
        <section className="bg-[linear-gradient(180deg,var(--color-paper-white),var(--color-gray-50))]">
          <HomeLandingHighlights />
        </section>

        {/* 3. Popular Products */}
        <section className="py-20 bg-[var(--color-gray-50)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <QuickOrderStrip products={serializedQuickProducts} />
          </div>
        </section>

        {/* 4. Reorder Strip (renders null for logged-out users) */}
        <ReorderStrip />

        {/* 5. Shop by Category */}
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
                    className="group overflow-hidden rounded-2xl border border-[var(--color-gray-200)] bg-white hover-lift"
                  >
                    <div className="aspect-[4/3] bg-[var(--color-gray-100)] overflow-hidden flex items-center justify-center">
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
                      <p className="label-xs text-[var(--color-gray-400)] mt-1 font-normal tracking-wide">
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

        {/* 6. Shop by Use Case */}
        <section className="py-20 bg-[var(--color-gray-50)] animate-on-scroll">
          <div className="max-w-7xl mx-auto px-6">
            <UseCaseSection />
          </div>
        </section>

        {/* 7. Trust Signals */}
        <section className="py-20 bg-white animate-on-scroll">
          <div className="max-w-7xl mx-auto px-6">
            <TrustSignals />
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
            <QuoteCalculator products={quoteProducts} />
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
