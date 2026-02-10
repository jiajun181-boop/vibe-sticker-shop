import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { getCatalogConfig } from "@/lib/catalogConfig";
import { INDUSTRY_TAGS, INDUSTRY_LABELS } from "@/lib/industryTags";
import { getServerT } from "@/lib/i18n/server";
import { OrganizationSchema } from "@/components/JsonLd";
import HowItWorks from "@/components/home/HowItWorks";
import FeaturedBanner from "@/components/home/FeaturedBanner";
import TrustSignals from "@/components/home/TrustSignals";
import BundlesSection from "@/components/home/BundlesSection";
import QuoteCalculator from "@/components/home/QuoteCalculator";

export const dynamic = "force-dynamic";

const formatCad = (cents) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);

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

  return (
    <>
    <OrganizationSchema />
    <div className="min-h-screen bg-[#fafafa] pb-20 relative">
      {/* Hero */}
      <div className="bg-black text-white pt-24 pb-16 px-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="inline-block bg-white/10 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase backdrop-blur-sm">
            {t("home.badge")}
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter">
            {t("home.headline")}
          </h1>
          <p className="text-gray-400 max-w-xl text-lg">
            {t("home.subheadline")}
          </p>
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
      </div>

      {/* Product count badge */}
      <div className="max-w-7xl mx-auto px-6 -mt-5 mb-8">
        <div className="inline-flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-sm border border-gray-100 text-xs font-bold text-gray-500">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          {t("home.productsAvailable", { count: totalCount })}
        </div>
      </div>

      {/* Shop by Industry */}
      <div className="max-w-7xl mx-auto px-6 mb-10">
        <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">{t("home.shopByIndustry")}</p>
        <div className="flex flex-wrap gap-2">
          {INDUSTRY_TAGS.map((tag) => {
            const meta = INDUSTRY_LABELS[tag];
            if (!meta) return null;
            return (
              <Link
                key={tag}
                href={`/shop/industry/${tag}`}
                className="inline-flex items-center gap-1.5 bg-white border border-gray-200 rounded-full px-4 py-2 text-xs font-bold text-gray-700 hover:border-gray-400 hover:shadow-sm transition-all"
              >
                <span>{meta.icon}</span> {meta.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* How It Works */}
      <div className="max-w-7xl mx-auto px-6 mb-14">
        <HowItWorks />
      </div>

      {/* Featured categories — 8 categories, 4 products each */}
      <div className="max-w-7xl mx-auto px-6">
        {grouped.map(([category, items]) => {
          const meta = categoryMeta[category] || { title: category, icon: "🧩" };
          const totalInCat = products.filter((p) => p.category === category).length;

          return (
            <section key={category} className="mb-14">
              <div className="flex items-end gap-4 mb-6">
                <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
                  <span className="text-xl">{meta.icon}</span>
                  {meta.title}
                </h2>
                <div className="h-px bg-gray-200 flex-1 mb-1" />
                <Link
                  href={`/shop?category=${category}`}
                  className="text-xs font-bold text-gray-400 uppercase tracking-widest hover:text-black transition-colors whitespace-nowrap mb-1"
                >
                  {totalInCat > maxPerCategory ? t("home.allCount", { count: totalInCat }) : t("home.viewAll")} &rarr;
                </Link>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {items.map((product) => (
                  <ProductCard key={product.id} item={product} categoryMeta={categoryMeta} t={t} />
                ))}
              </div>
            </section>
          );
        })}

        {/* Browse all CTA */}
        <div className="text-center pt-4 pb-8">
          <Link
            href="/shop"
            className="inline-block bg-gray-900 text-white px-8 py-3 rounded-full text-xs font-black uppercase tracking-widest hover:bg-black transition-colors"
          >
            {t("home.browseAll", { count: totalCount })}
          </Link>
        </div>
      </div>

      {/* Featured Display Products */}
      {displayProducts.length > 0 && (
        <div className="max-w-7xl mx-auto px-6 mb-14">
          <FeaturedBanner products={displayProducts} />
        </div>
      )}

      {/* Trust Signals */}
      <div className="max-w-7xl mx-auto px-6 mb-14">
        <TrustSignals />
      </div>

      {/* Bundles */}
      <div className="max-w-7xl mx-auto px-6 mb-14">
        <BundlesSection />
      </div>

      {/* Quote Calculator */}
      <div className="max-w-7xl mx-auto px-6 mb-14">
        <QuoteCalculator />
      </div>
    </div>
    </>
  );
}

function ProductCard({ item, categoryMeta, t }) {
  const href = `/shop/${item.category}/${item.slug}`;
  const img = item.images?.[0]?.url;
  const icon = categoryMeta[item.category]?.icon || "🧩";

  return (
    <Link
      href={href}
      className="group bg-white rounded-3xl p-5 border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between h-full"
    >
      <div className="space-y-4">
        <div className="aspect-square bg-gray-50 rounded-2xl overflow-hidden flex items-center justify-center group-hover:scale-[1.02] transition-transform duration-500">
          {img ? (
            <Image
              src={img}
              alt={item.name}
              width={300}
              height={300}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-4xl">{icon}</span>
          )}
        </div>

        <div>
          <h3 className="font-bold text-base leading-tight mb-1 group-hover:text-blue-600 transition-colors line-clamp-2">
            {item.name}
          </h3>
          {item.description && (
            <p className="text-xs text-gray-400 line-clamp-2">{item.description}</p>
          )}
        </div>
      </div>

      <div className="mt-5 pt-4 border-t border-gray-50 flex justify-between items-center">
        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
          {item.basePrice > 0 ? t("home.from") : t("home.getQuote")}
        </div>
        <div className="text-sm font-black">
          {item.basePrice > 0 ? formatCad(item.basePrice) : t("home.custom")}
        </div>
      </div>
    </Link>
  );
}
