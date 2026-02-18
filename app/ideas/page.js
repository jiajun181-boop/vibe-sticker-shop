import Link from "next/link";
import { getServerT } from "@/lib/i18n/server";
import { USE_CASES } from "@/lib/useCases";
import { INDUSTRY_TAGS, INDUSTRY_LABELS } from "@/lib/industryTags";
import { BreadcrumbSchemaFromItems } from "@/components/JsonLd";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://lunarprint.ca";

export async function generateMetadata() {
  return {
    title: "Ideas & Inspiration \u2014 Custom Print Projects | La Lunar Printing",
    description:
      "Explore print ideas for gifting, weddings, corporate events, campus life, and more. Find the perfect products for your industry \u2014 essential to your brand.",
    alternates: { canonical: `${SITE_URL}/ideas` },
    openGraph: {
      title: "Ideas & Inspiration | La Lunar Printing",
      description:
        "Custom print solutions for every occasion and industry. Business essential \u2014 from concept to delivery.",
      url: `${SITE_URL}/ideas`,
      siteName: "La Lunar Printing",
      type: "website",
    },
    twitter: { card: "summary_large_image" },
  };
}

export const revalidate = 3600;

export default async function IdeasPage() {
  const t = await getServerT();

  return (
    <div className="min-h-screen bg-[var(--color-gray-50)] pb-20">
      <BreadcrumbSchemaFromItems
        items={[
          { name: "Home", url: SITE_URL },
          { name: "Ideas & Inspiration" },
        ]}
      />

      {/* Hero */}
      <div className="bg-[var(--color-ink-black)] text-white pt-24 pb-16 px-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none flex items-center justify-center">
          <span className="text-[300px] font-black tracking-tighter select-none">IDEAS</span>
        </div>
        <div className="max-w-5xl mx-auto text-center relative">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--color-gray-500)] mb-4">
            {t("common.essentialBrand")}
          </p>
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter">
            {t("ideas.title")}
          </h1>
          <p className="mt-4 text-[var(--color-gray-400)] max-w-2xl mx-auto text-lg">
            {t("ideas.subtitle")}
          </p>
          <p className="mt-3 text-xs font-bold uppercase tracking-[0.16em] text-[var(--color-gray-600)]">
            {t("ideas.heroTagline")}
          </p>
        </div>
      </div>

      {/* Use Cases section */}
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 2xl:px-4 mt-14">
        <div className="text-center mb-8">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--color-gray-400)] mb-2">
            {t("ideas.curatedCollections")}
          </p>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight">
            {t("ideas.useCasesTitle")}
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {USE_CASES.map((uc) => (
            <Link
              key={uc.slug}
              href={`/ideas/${uc.slug}`}
              className="group rounded-2xl border border-[var(--color-gray-200)] bg-white p-6 text-center hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              <span className="text-4xl block">{uc.icon}</span>
              <h3 className="mt-3 font-bold text-sm text-[var(--color-gray-900)]">
                {t(`ideas.${uc.slug}.title`)}
              </h3>
              <p className="mt-1 text-xs text-[var(--color-gray-400)]">
                {t(`useCase.${uc.slug}.subtitle`)}
              </p>
              <span className="mt-3 inline-block text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--color-gray-500)] group-hover:text-black transition-colors">
                {t("ideas.browseProducts")} &rarr;
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Tagline divider */}
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 2xl:px-4 my-10">
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-[var(--color-gray-400)]">
            {t("ideas.qualityTagline")}
          </p>
        </div>
      </div>

      {/* Industries section */}
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 2xl:px-4 mb-14">
        <div className="text-center mb-8">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--color-gray-400)] mb-2">
            {t("ideas.industrySolutions")}
          </p>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight">
            {t("ideas.industriesTitle")}
          </h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {INDUSTRY_TAGS.map((tag) => {
            const meta = INDUSTRY_LABELS[tag];
            if (!meta) return null;
            return (
              <Link
                key={tag}
                href={`/shop/industry/${tag}`}
                className="group rounded-2xl border border-[var(--color-gray-200)] bg-white p-5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                <span className="text-3xl block">{meta.icon}</span>
                <h3 className="mt-2 font-bold text-sm text-[var(--color-gray-900)] leading-tight">
                  {meta.title}
                </h3>
                <p className="mt-1 text-xs text-[var(--color-gray-400)] line-clamp-2">
                  {meta.description}
                </p>
                <span className="mt-2 inline-block text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--color-gray-500)] group-hover:text-black transition-colors">
                  {t("ideas.exploreIndustry")} &rarr;
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* CTA */}
      <div className="max-w-4xl mx-auto px-6">
        <div className="rounded-3xl bg-[var(--color-gray-900)] text-white p-8 md:p-12 text-center relative overflow-hidden">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--color-gray-500)] mb-3">
            {t("ideas.ctaBadge")}
          </p>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight">
            {t("ideas.ctaTitle")}
          </h2>
          <p className="mt-3 text-[var(--color-gray-400)] max-w-xl mx-auto">
            {t("ideas.ctaDescription")}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/contact"
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

