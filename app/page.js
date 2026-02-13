import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { getCatalogConfig } from "@/lib/catalogConfig";
import { getServerT } from "@/lib/i18n/server";
import { OrganizationSchema } from "@/components/JsonLd";
import HowItWorks from "@/components/home/HowItWorks";
import FeaturedBanner from "@/components/home/FeaturedBanner";
import TrustSignals from "@/components/home/TrustSignals";
import BundlesSection from "@/components/home/BundlesSection";
import QuoteCalculator from "@/components/home/QuoteCalculator";
import UseCaseSection from "@/components/home/UseCaseSection";

export const dynamic = "force-dynamic";

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

  const grouped = [];
  for (const cat of homepageCategories) {
    const items = products
      .filter((p) => p.category === cat)
      .slice(0, maxPerCategory);
    if (items.length > 0) grouped.push([cat, items]);
  }

  // Pick first product from each of the first 4 categories for hero preview
  const heroProducts = grouped.slice(0, 4).map(([, items]) => items[0]).filter(Boolean);

  return (
    <div className="min-h-screen bg-[#fafafa] pb-20 relative">
      <OrganizationSchema />
      {/* Hero — dual column with product preview */}
      <div className="bg-black text-white pt-20 pb-16 px-6">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-10 items-center">
          {/* Left: text + CTAs */}
          <div className="space-y-6">
            <div className="inline-block bg-white/10 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase backdrop-blur-sm">
              {t("home.badge")}
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter">
              {t("home.headline")}
            </h1>
            <p className="text-gray-400 max-w-xl text-lg">
              {t("home.subheadline")}
            </p>
            {/* Inline product count */}
            <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-2 text-xs font-bold text-gray-300">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              {t("home.productsAvailable", { count: totalCount })}
            </div>
            <div className="flex gap-3 pt-2">
              <Link
                href="/shop"
                className="bg-white text-black px-6 py-3 rounded-full text-xs font-black uppercase tracking-widest hover:bg-gray-200 transition-colors"
              >
                {t("home.cta.shop")}
              </Link>
              <Link
                href="/contact"
                className="border border-white/30 text-white px-6 py-3 rounded-full text-xs font-black uppercase tracking-widest hover:border-white/70 transition-colors"
              >
                {t("home.cta.quote")}
              </Link>
            </div>
          </div>

          {/* Right: product preview grid (desktop only) */}
          <div className="hidden md:grid grid-cols-2 gap-3">
            {heroProducts.map((p) => (
              <Link
                key={p.id}
                href={`/shop/${p.category}/${p.slug}`}
                className="group relative aspect-square rounded-2xl overflow-hidden border border-white/10 bg-white/5"
              >
                {p.images?.[0]?.url ? (
                  <Image
                    src={p.images[0].url}
                    alt={p.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 768px) 50vw, 25vw"
                    unoptimized={p.images[0].url.endsWith(".svg")}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-3xl opacity-30">{categoryMeta[p.category]?.icon || "🧩"}</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <p className="absolute bottom-3 left-3 right-3 text-white text-xs font-bold truncate">
                  {p.name}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Shop by Use Case — quick entry */}
      <div className="max-w-7xl mx-auto px-6 mt-14 mb-10">
        <UseCaseSection />
      </div>

      {/* Popular Products — quick links */}
      <div className="max-w-7xl mx-auto px-6 mb-10">
        <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-400 text-center mb-4">
          {t("home.popularProducts")}
        </h3>
        <div className="flex flex-wrap justify-center gap-2">
          {[
            { label: "Marketing Prints", href: "/shop/marketing-prints" },
            { label: "Business Cards", href: "/shop/business-cards" },
            { label: "Stickers & Labels", href: "/shop/stickers-labels" },
            { label: "Banners & Displays", href: "/shop/banners-displays" },
            { label: "Signs & Boards", href: "/shop/rigid-signs" },
            { label: "Self-Inking Stamps", href: "/shop/stamps" },
          ].map((chip) => (
            <Link
              key={chip.href}
              href={chip.href}
              className="rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-medium text-gray-700 transition-all hover:border-gray-900 hover:bg-gray-900 hover:text-white"
            >
              {chip.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Shop by Category — visual cards */}
      <div className="max-w-7xl mx-auto px-6 mb-14">
        <h2 className="text-2xl md:text-3xl font-black tracking-tight text-center mb-8">
          {t("home.shopByCategory")}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {grouped.map(([category, items]) => {
            const meta = categoryMeta[category] || { title: category, icon: "🧩" };
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
            className="inline-block bg-gray-900 text-white px-8 py-3 rounded-full text-xs font-black uppercase tracking-widest hover:bg-black transition-colors"
          >
            {t("home.browseAll", { count: totalCount })}
          </Link>
        </div>
      </div>

      <SectionDivider />

      {/* Trust Signals — moved up for early social proof */}
      <div className="bg-white py-14">
        <div className="max-w-7xl mx-auto px-6">
          <TrustSignals />
        </div>
      </div>

      <SectionDivider />

      {/* How It Works */}
      <div className="max-w-7xl mx-auto px-6 my-14">
        <HowItWorks />
      </div>

      <SectionDivider />

      {/* Quote Calculator — moved up, key conversion tool */}
      <div className="max-w-7xl mx-auto px-6 mb-14">
        <QuoteCalculator />
      </div>

      <SectionDivider />

      {/* Featured Display Products */}
      {displayProducts.length > 0 && (
        <div className="max-w-7xl mx-auto px-6 mb-14">
          <FeaturedBanner products={displayProducts} />
        </div>
      )}

      {/* Bundles */}
      <div className="max-w-7xl mx-auto px-6 mb-14">
        <BundlesSection />
      </div>
    </div>
  );
}
