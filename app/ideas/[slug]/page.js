import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getProductImage } from "@/lib/product-image";
import { getServerT } from "@/lib/i18n/server";
import {
  USE_CASES,
  USE_CASE_SLUGS,
  USE_CASE_PRODUCTS,
  USE_CASE_META,
  SOLUTION_BUNDLES,
} from "@/lib/useCases";
import { INDUSTRY_LABELS } from "@/lib/industryTags";
import {
  CollectionPageSchema,
  BreadcrumbSchemaFromItems,
} from "@/components/JsonLd";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://lunarprint.ca";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  if (!USE_CASE_SLUGS.includes(slug)) return {};

  const t = await getServerT();
  const title = t(`ideas.${slug}.title`);
  const description = t(`ideas.${slug}.heroDescription`);

  return {
    title: `${title} \u2014 Custom Printing | La Lunar Printing`,
    description,
    alternates: { canonical: `${SITE_URL}/ideas/${slug}` },
    openGraph: {
      title: `${title} | La Lunar Printing`,
      description,
      url: `${SITE_URL}/ideas/${slug}`,
      siteName: "La Lunar Printing",
      type: "website",
    },
    twitter: { card: "summary_large_image" },
  };
}

export const revalidate = 3600;

const formatCad = (cents) =>
  new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
  }).format(cents / 100);

export default async function UseCasePage({ params }) {
  const { slug } = await params;

  if (!USE_CASE_SLUGS.includes(slug)) notFound();

  const t = await getServerT();
  const currentUseCase = USE_CASES.find((u) => u.slug === slug);
  const productSlugs = USE_CASE_PRODUCTS[slug] || [];
  const meta = USE_CASE_META[slug] || {};

  // Fetch products matching this use case
  const products = await prisma.product.findMany({
    where: { slug: { in: productSlugs }, isActive: true },
    include: { images: { take: 1, orderBy: { sortOrder: "asc" } } },
  });

  // Sort products to match USE_CASE_PRODUCTS order
  const productMap = new Map(products.map((p) => [p.slug, p]));
  const sortedProducts = productSlugs
    .map((s) => productMap.get(s))
    .filter(Boolean);

  // Build tips array from i18n (up to 4)
  const tips = [];
  for (let i = 1; i <= 4; i++) {
    const titleKey = `ideas.${slug}.tip${i}Title`;
    const bodyKey = `ideas.${slug}.tip${i}`;
    const titleVal = t(titleKey);
    if (titleVal && titleVal !== titleKey) {
      tips.push({ title: titleVal, body: t(bodyKey) });
    }
  }

  // Related industries
  const relatedIndustries = (meta.relatedIndustries || [])
    .map((tag) => ({ tag, ...INDUSTRY_LABELS[tag] }))
    .filter((r) => r.label);

  // Other use cases
  const otherUseCases = USE_CASES.filter((u) => u.slug !== slug);

  return (
    <div className="min-h-screen bg-[var(--color-gray-50)] pb-20">
      <CollectionPageSchema
        name={t(`ideas.${slug}.title`)}
        description={t(`ideas.${slug}.heroDescription`)}
        url={`${SITE_URL}/ideas/${slug}`}
        products={sortedProducts}
      />
      <BreadcrumbSchemaFromItems
        items={[
          { name: "Home", url: SITE_URL },
          { name: "Ideas", url: `${SITE_URL}/ideas` },
          { name: t(`ideas.${slug}.title`) },
        ]}
      />

      {/* Hero */}
      <div className="bg-[var(--color-ink-black)] text-white pt-24 pb-16 px-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none flex items-center justify-center">
          <span className="text-[250px] select-none">{currentUseCase.icon}</span>
        </div>
        <div className="max-w-5xl mx-auto relative">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-xs text-[var(--color-gray-500)] mb-6">
            <Link href="/" className="hover:text-white transition-colors">{t("nav.home")}</Link>
            <span>/</span>
            <Link href="/ideas" className="hover:text-white transition-colors">{t("nav.ideas")}</Link>
            <span>/</span>
            <span className="text-[var(--color-gray-300)]">{t(`ideas.${slug}.title`)}</span>
          </nav>

          <div className="flex items-center gap-4 mb-4">
            <span className="text-5xl">{currentUseCase.icon}</span>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--color-gray-500)] mb-1">
                {t("common.essentialBrand")}
              </p>
              <h1 className="text-4xl md:text-5xl font-black tracking-tighter">
                {t(`ideas.${slug}.title`)}
              </h1>
            </div>
          </div>
          <p className="text-[var(--color-gray-400)] max-w-2xl text-lg mt-4">
            {t(`ideas.${slug}.heroDescription`)}
          </p>
          <div className="mt-4 inline-flex items-center gap-2 bg-white/10 rounded-xl px-4 py-2 text-xs font-bold text-[var(--color-gray-300)]">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            {t("ideas.productsCurated", { count: sortedProducts.length })}
          </div>
        </div>
      </div>

      {/* Use-case chip nav */}
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 2xl:px-4 mt-6 mb-8">
        <div className="flex flex-wrap gap-2">
          {USE_CASES.map((uc) => (
            <Link
              key={uc.slug}
              href={`/ideas/${uc.slug}`}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                uc.slug === slug
                  ? "bg-[var(--color-gray-900)] text-white"
                  : "bg-white border border-[var(--color-gray-200)] text-[var(--color-gray-600)] hover:border-[var(--color-gray-400)]"
              }`}
            >
              {uc.icon} {t(`ideas.${uc.slug}.title`)}
            </Link>
          ))}
        </div>
      </div>

      {/* Tips & Ideas */}
      {tips.length > 0 && (
        <div className="mx-auto max-w-[1600px] px-4 sm:px-6 2xl:px-4 mb-12">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-ink-black)]" />
            <h2 className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--color-gray-400)]">
              {t("ideas.tipsTitle")}
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {tips.map((tip, i) => (
              <div
                key={i}
                className="rounded-2xl border border-[var(--color-gray-200)] bg-white p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
              >
                <div className="w-8 h-8 rounded-full bg-[var(--color-gray-900)] text-white text-xs font-black flex items-center justify-center mb-3">
                  {i + 1}
                </div>
                <h3 className="font-bold text-sm mb-2">{tip.title}</h3>
                <p className="text-xs text-[var(--color-gray-500)] leading-relaxed">{tip.body}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Solution Bundles */}
      {(SOLUTION_BUNDLES[slug] || []).length > 0 && (
        <div className="mx-auto max-w-[1600px] px-4 sm:px-6 2xl:px-4 mb-12">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-ink-black)]" />
            <h2 className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--color-gray-400)]">
              {t("solutions.bundlesTitle")}
            </h2>
          </div>
          <p className="text-xs text-[var(--color-gray-500)] mb-4">{t("solutions.bundlesSubtitle")}</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SOLUTION_BUNDLES[slug].map((bundle) => (
              <div key={bundle.id} className="rounded-2xl border border-[var(--color-gray-200)] bg-white p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-sm">{bundle.name}</h3>
                  <span className="text-sm font-black text-[var(--color-gray-900)]">{bundle.priceHint}</span>
                </div>
                <ul className="space-y-1.5 mb-4">
                  {bundle.items.map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-xs text-[var(--color-gray-600)]">
                      <svg className="h-3.5 w-3.5 flex-shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
                <Link
                  href={`/quote?sku=${encodeURIComponent(bundle.id)}`}
                  className="block w-full rounded-xl bg-[var(--color-gray-900)] py-2 text-center text-xs font-semibold uppercase tracking-[0.1em] text-white transition-colors hover:bg-black"
                >
                  {t("solutions.getPackage")}
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Products grid */}
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 2xl:px-4 mb-14">
        <div className="text-center mb-8">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--color-gray-400)] mb-2">
            {t("ideas.handpicked")}
          </p>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight">
            {t("ideas.productsTitle")}
          </h2>
        </div>
        {sortedProducts.length === 0 ? (
          <div className="text-center py-20 text-[var(--color-gray-400)]">
            <p className="text-lg font-semibold">{t("ideas.noProducts")}</p>
            <Link
              href="/shop"
              className="mt-4 inline-block text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-gray-600)] hover:text-black"
            >
              {t("common.browseAll")} &rarr;
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {sortedProducts.map((product) => {
              const img = getProductImage(product, product.category);
              return (
                <Link
                  key={product.id}
                  href={`/shop/${product.category}/${product.slug}`}
                  className="group bg-white rounded-3xl p-5 border border-[var(--color-gray-100)] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between h-full"
                >
                  <div className="space-y-4">
                    <div className="aspect-square bg-[var(--color-gray-50)] rounded-2xl overflow-hidden flex items-center justify-center group-hover:scale-[1.02] transition-transform duration-500">
                      {img ? (
                        <Image
                          src={img}
                          alt={product.name}
                          width={300}
                          height={300}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-4xl opacity-30">
                          {currentUseCase.icon}
                        </span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-base leading-tight mb-1 group-hover:text-[var(--color-moon-gold)] transition-colors line-clamp-2">
                        {product.name}
                      </h3>
                      {product.description && (
                        <p className="text-xs text-[var(--color-gray-400)] line-clamp-2">
                          {product.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="mt-5 pt-4 border-t border-[var(--color-gray-50)] flex justify-between items-center">
                    <div className="text-[10px] font-bold text-[var(--color-gray-400)] uppercase tracking-[0.14em]">
                      {product.basePrice > 0 ? t("shop.fromLabel") : t("shop.getQuote")}
                    </div>
                    <div className="text-sm font-black">
                      {product.basePrice > 0
                        ? formatCad(product.basePrice)
                        : t("shop.custom")}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Related Industries */}
      {relatedIndustries.length > 0 && (
        <div className="mx-auto max-w-[1600px] px-4 sm:px-6 2xl:px-4 mb-12">
          <h2 className="text-lg font-bold tracking-tight mb-4">
            {t("ideas.relatedIndustries")}
          </h2>
          <div className="flex flex-wrap gap-3">
            {relatedIndustries.map((r) => (
              <Link
                key={r.tag}
                href={`/shop/industry/${r.tag}`}
                className="flex items-center gap-2 rounded-xl border border-[var(--color-gray-200)] bg-white px-4 py-2 text-xs font-medium text-[var(--color-gray-700)] hover:border-[var(--color-gray-900)] hover:bg-[var(--color-gray-900)] hover:text-white transition-all"
              >
                <span>{r.icon}</span>
                {r.title}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Other Use Cases */}
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 2xl:px-4 mb-14">
        <h2 className="text-lg font-bold tracking-tight mb-4">
          {t("ideas.otherIdeas")}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {otherUseCases.map((uc) => (
            <Link
              key={uc.slug}
              href={`/ideas/${uc.slug}`}
              className="group rounded-2xl border border-[var(--color-gray-200)] bg-white p-5 text-center hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
            >
              <span className="text-3xl block">{uc.icon}</span>
              <h3 className="mt-2 font-bold text-sm">{t(`ideas.${uc.slug}.title`)}</h3>
            </Link>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="max-w-4xl mx-auto px-6">
        <div className="rounded-3xl bg-[var(--color-gray-900)] text-white p-8 md:p-12 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--color-gray-500)] mb-3">
            {t("common.printPartner")}
          </p>
          <h2 className="text-2xl font-black tracking-tight">
            {t(`ideas.${slug}.cta`)}
          </h2>
          <p className="mt-3 text-[var(--color-gray-400)] max-w-xl mx-auto text-sm">
            {t("ideas.ctaSubDescription")}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/quote"
              className="bg-white text-black px-6 py-3 rounded-xl text-xs font-black uppercase tracking-[0.14em] hover:bg-[var(--color-gray-200)] transition-colors"
            >
              {t("ideas.getQuote")}
            </Link>
            <Link
              href="/shop"
              className="border border-white/30 text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-[0.14em] hover:border-white/70 transition-colors"
            >
              {t("common.browseAll")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

