import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getServerT } from "@/lib/i18n/server";
import {
  INDUSTRY_TAGS,
  INDUSTRY_TAGS_SET,
  INDUSTRY_LABELS,
  INDUSTRY_RELATED,
} from "@/lib/industryTags";
import {
  CollectionPageSchema,
  BreadcrumbSchemaFromItems,
} from "@/components/JsonLd";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://lunarprint.ca";

export async function generateMetadata({ params }) {
  const { tag } = await params;
  if (!INDUSTRY_TAGS_SET.has(tag)) return {};

  const meta = INDUSTRY_LABELS[tag];
  const t = await getServerT();
  const extended = t(`industry.${tag}.extendedDescription`);

  return {
    title: `${meta.title} Printing Solutions | La Lunar Printing`,
    description: extended || meta.description,
    alternates: { canonical: `${SITE_URL}/shop/industry/${tag}` },
    openGraph: {
      title: `${meta.title} \u2014 Custom Print Solutions | La Lunar Printing`,
      description: extended || meta.description,
      url: `${SITE_URL}/shop/industry/${tag}`,
      siteName: "La Lunar Printing",
      type: "website",
    },
    twitter: { card: "summary_large_image" },
  };
}

export const revalidate = 300;

const formatCad = (cents) =>
  new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
  }).format(cents / 100);

export default async function IndustryPage({ params }) {
  const { tag } = await params;

  if (!INDUSTRY_TAGS_SET.has(tag)) notFound();

  const t = await getServerT();
  const meta = INDUSTRY_LABELS[tag];

  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      tags: { has: tag },
    },
    include: { images: { take: 1, orderBy: { sortOrder: "asc" } } },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  const extended = t(`industry.${tag}.extendedDescription`);
  const relatedTags = (INDUSTRY_RELATED[tag] || [])
    .map((t) => ({ tag: t, ...INDUSTRY_LABELS[t] }))
    .filter((r) => r.label);

  return (
    <div className="min-h-screen bg-[var(--color-gray-50)] pb-20">
      <CollectionPageSchema
        name={meta.title}
        description={extended || meta.description}
        url={`${SITE_URL}/shop/industry/${tag}`}
        products={products}
      />
      <BreadcrumbSchemaFromItems
        items={[
          { name: "Home", url: SITE_URL },
          { name: "Shop", url: `${SITE_URL}/shop` },
          { name: "Industry Solutions" },
          { name: meta.title },
        ]}
      />

      {/* Header */}
      <div className="bg-[var(--color-ink-black)] text-white pt-24 pb-14 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-xs text-[var(--color-gray-500)] mb-6">
            <Link href="/" className="hover:text-white transition-colors">{t("nav.home")}</Link>
            <span>/</span>
            <Link href="/shop" className="hover:text-white transition-colors">{t("nav.shop")}</Link>
            <span>/</span>
            <span>{t("shop.industry")}</span>
            <span>/</span>
            <span className="text-[var(--color-gray-300)]">{meta.title}</span>
          </nav>

          <div className="flex items-center gap-4">
            <span className="text-4xl">{meta.icon}</span>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--color-gray-500)] mb-1">
                {t("ideas.industrySolutions")}
              </p>
              <h1 className="text-4xl md:text-5xl font-black tracking-tighter">
                {meta.title}
              </h1>
              <p className="text-[var(--color-gray-400)] mt-2 max-w-2xl">{meta.description}</p>
            </div>
          </div>
          <div className="mt-4 text-xs text-[var(--color-gray-500)] font-bold">
            {t("industry.productCount", { count: products.length })}
            <span className="mx-2">&middot;</span>
            <span className="text-[var(--color-gray-600)]">{t("industry.builtForIndustry")}</span>
          </div>
        </div>
      </div>

      {/* Extended description */}
      {extended && extended !== `industry.${tag}.extendedDescription` && (
        <div className="max-w-7xl mx-auto px-6 mt-8 mb-4">
          <p className="text-sm text-[var(--color-gray-600)] leading-relaxed max-w-3xl">
            {extended}
          </p>
        </div>
      )}

      {/* Industry navigation chips */}
      <div className="max-w-7xl mx-auto px-6 mt-6 mb-8">
        <div className="flex flex-wrap gap-2">
          {INDUSTRY_TAGS.map((t) => {
            const m = INDUSTRY_LABELS[t];
            if (!m) return null;
            return (
              <Link
                key={t}
                href={`/shop/industry/${t}`}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                  t === tag
                    ? "bg-[var(--color-gray-900)] text-white"
                    : "bg-white border border-[var(--color-gray-200)] text-[var(--color-gray-600)] hover:border-[var(--color-gray-400)]"
                }`}
              >
                {m.icon} {m.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Products grid */}
      <div className="max-w-7xl mx-auto px-6">
        {products.length === 0 ? (
          <div className="text-center py-20 text-[var(--color-gray-400)]">
            <p className="text-lg font-semibold">
              No products found for this industry yet.
            </p>
            <Link
              href="/shop"
              className="mt-4 inline-block text-xs font-bold uppercase tracking-widest text-[var(--color-gray-600)] hover:text-black"
            >
              {t("common.browseAll")} &rarr;
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((product) => {
              const img = product.images?.[0]?.url;
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
                        <span className="text-4xl">{meta.icon}</span>
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
                    <div className="text-[10px] font-bold text-[var(--color-gray-400)] uppercase tracking-widest">
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
      {relatedTags.length > 0 && (
        <div className="max-w-7xl mx-auto px-6 mt-12 mb-8">
          <h2 className="text-lg font-bold tracking-tight mb-4">
            {t("ideas.relatedIndustries")}
          </h2>
          <div className="flex flex-wrap gap-3">
            {relatedTags.map((r) => (
              <Link
                key={r.tag}
                href={`/shop/industry/${r.tag}`}
                className="flex items-center gap-2 rounded-full border border-[var(--color-gray-200)] bg-white px-4 py-2 text-xs font-medium text-[var(--color-gray-700)] hover:border-[var(--color-gray-900)] hover:bg-[var(--color-gray-900)] hover:text-white transition-all"
              >
                <span>{r.icon}</span>
                {r.title}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="max-w-4xl mx-auto px-6 mt-10">
        <div className="rounded-3xl bg-[var(--color-gray-900)] text-white p-8 md:p-12 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--color-gray-500)] mb-3">
            {t("common.essentialBrand")}
          </p>
          <h2 className="text-2xl font-black tracking-tight">
            {t("common.needCustom", { category: meta.title })}
          </h2>
          <p className="mt-3 text-[var(--color-gray-400)] max-w-xl mx-auto text-sm">
            {t("industry.ctaDescription")}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/contact"
              className="bg-white text-black px-6 py-3 rounded-full text-xs font-black uppercase tracking-widest hover:bg-[var(--color-gray-200)] transition-colors"
            >
              {t("ideas.getQuote")}
            </Link>
            <Link
              href="/ideas"
              className="border border-white/30 text-white px-6 py-3 rounded-full text-xs font-black uppercase tracking-widest hover:border-white/70 transition-colors"
            >
              {t("industry.exploreIdeas")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

