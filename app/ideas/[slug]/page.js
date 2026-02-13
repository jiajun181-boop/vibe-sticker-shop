import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getServerT } from "@/lib/i18n/server";
import {
  USE_CASES,
  USE_CASE_SLUGS,
  USE_CASE_PRODUCTS,
  USE_CASE_META,
} from "@/lib/useCases";
import { INDUSTRY_LABELS } from "@/lib/industryTags";
import {
  CollectionPageSchema,
  BreadcrumbSchemaFromItems,
} from "@/components/JsonLd";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://vibestickers.com";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  if (!USE_CASE_SLUGS.includes(slug)) return {};

  const t = await getServerT();
  const title = t(`ideas.${slug}.title`);
  const description = t(`ideas.${slug}.heroDescription`);

  return {
    title: `${title} — Custom Printing | La Lunar Printing`,
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

export const dynamic = "force-dynamic";

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
    <div className="min-h-screen bg-[#fafafa] pb-20">
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
      <div className="bg-black text-white pt-24 pb-16 px-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none flex items-center justify-center">
          <span className="text-[250px] select-none">{currentUseCase.icon}</span>
        </div>
        <div className="max-w-5xl mx-auto relative">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-xs text-gray-500 mb-6">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span>/</span>
            <Link href="/ideas" className="hover:text-white transition-colors">Ideas</Link>
            <span>/</span>
            <span className="text-gray-300">{t(`ideas.${slug}.title`)}</span>
          </nav>

          <div className="flex items-center gap-4 mb-4">
            <span className="text-5xl">{currentUseCase.icon}</span>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 mb-1">
                Essential to Your Brand
              </p>
              <h1 className="text-4xl md:text-5xl font-black tracking-tighter">
                {t(`ideas.${slug}.title`)}
              </h1>
            </div>
          </div>
          <p className="text-gray-400 max-w-2xl text-lg mt-4">
            {t(`ideas.${slug}.heroDescription`)}
          </p>
          <div className="mt-4 inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-2 text-xs font-bold text-gray-300">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            {sortedProducts.length} product{sortedProducts.length !== 1 ? "s" : ""} curated
          </div>
        </div>
      </div>

      {/* Use-case chip nav */}
      <div className="max-w-7xl mx-auto px-6 mt-6 mb-8">
        <div className="flex flex-wrap gap-2">
          {USE_CASES.map((uc) => (
            <Link
              key={uc.slug}
              href={`/ideas/${uc.slug}`}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                uc.slug === slug
                  ? "bg-gray-900 text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:border-gray-400"
              }`}
            >
              {uc.icon} {t(`ideas.${uc.slug}.title`)}
            </Link>
          ))}
        </div>
      </div>

      {/* Tips & Ideas */}
      {tips.length > 0 && (
        <div className="max-w-7xl mx-auto px-6 mb-12">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-1.5 h-1.5 rounded-full bg-black" />
            <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">
              {t("ideas.tipsTitle")}
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {tips.map((tip, i) => (
              <div
                key={i}
                className="rounded-2xl border border-gray-200 bg-white p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
              >
                <div className="w-8 h-8 rounded-full bg-gray-900 text-white text-xs font-black flex items-center justify-center mb-3">
                  {i + 1}
                </div>
                <h3 className="font-bold text-sm mb-2">{tip.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{tip.body}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Products grid */}
      <div className="max-w-7xl mx-auto px-6 mb-14">
        <div className="text-center mb-8">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-2">
            Handpicked for You
          </p>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight">
            {t("ideas.productsTitle")}
          </h2>
        </div>
        {sortedProducts.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-lg font-semibold">No products found.</p>
            <Link
              href="/shop"
              className="mt-4 inline-block text-xs font-bold uppercase tracking-widest text-gray-600 hover:text-black"
            >
              Browse All Products &rarr;
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {sortedProducts.map((product) => {
              const img = product.images?.[0]?.url;
              return (
                <Link
                  key={product.id}
                  href={`/shop/${product.category}/${product.slug}`}
                  className="group bg-white rounded-3xl p-5 border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between h-full"
                >
                  <div className="space-y-4">
                    <div className="aspect-square bg-gray-50 rounded-2xl overflow-hidden flex items-center justify-center group-hover:scale-[1.02] transition-transform duration-500">
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
                      <h3 className="font-bold text-base leading-tight mb-1 group-hover:text-blue-600 transition-colors line-clamp-2">
                        {product.name}
                      </h3>
                      {product.description && (
                        <p className="text-xs text-gray-400 line-clamp-2">
                          {product.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="mt-5 pt-4 border-t border-gray-50 flex justify-between items-center">
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      {product.basePrice > 0 ? "From" : "Get Quote"}
                    </div>
                    <div className="text-sm font-black">
                      {product.basePrice > 0
                        ? formatCad(product.basePrice)
                        : "Custom"}
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
        <div className="max-w-7xl mx-auto px-6 mb-12">
          <h2 className="text-lg font-bold tracking-tight mb-4">
            {t("ideas.relatedIndustries")}
          </h2>
          <div className="flex flex-wrap gap-3">
            {relatedIndustries.map((r) => (
              <Link
                key={r.tag}
                href={`/shop/industry/${r.tag}`}
                className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-medium text-gray-700 hover:border-gray-900 hover:bg-gray-900 hover:text-white transition-all"
              >
                <span>{r.icon}</span>
                {r.title}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Other Use Cases */}
      <div className="max-w-7xl mx-auto px-6 mb-14">
        <h2 className="text-lg font-bold tracking-tight mb-4">
          {t("ideas.otherIdeas")}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {otherUseCases.map((uc) => (
            <Link
              key={uc.slug}
              href={`/ideas/${uc.slug}`}
              className="group rounded-2xl border border-gray-200 bg-white p-5 text-center hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
            >
              <span className="text-3xl block">{uc.icon}</span>
              <h3 className="mt-2 font-bold text-sm">{t(`ideas.${uc.slug}.title`)}</h3>
            </Link>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="max-w-4xl mx-auto px-6">
        <div className="rounded-3xl bg-gray-900 text-white p-8 md:p-12 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 mb-3">
            Your Print Partner
          </p>
          <h2 className="text-2xl font-black tracking-tight">
            {t(`ideas.${slug}.cta`)}
          </h2>
          <p className="mt-3 text-gray-400 max-w-xl mx-auto text-sm">
            Professional quality, fast turnaround &mdash; everything your brand needs to stand out.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/contact"
              className="bg-white text-black px-6 py-3 rounded-full text-xs font-black uppercase tracking-widest hover:bg-gray-200 transition-colors"
            >
              Get a Free Quote
            </Link>
            <Link
              href="/shop"
              className="border border-white/30 text-white px-6 py-3 rounded-full text-xs font-black uppercase tracking-widest hover:border-white/70 transition-colors"
            >
              Browse All Products
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
