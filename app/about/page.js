import Link from "next/link";
import Image from "next/image";
import { getServerT } from "@/lib/i18n/server";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://vibestickers.com";
const BRAND = "La Lunar Printing Inc.";

export async function generateMetadata() {
  return {
    title: `About Us | ${BRAND}`,
    description: "Toronto's leading printing service provider. 30+ years of experience, competitive prices, fast turnaround (1-2 days), official invoices, one-stop printing solutions. Serving North America.",
    alternates: { canonical: `${SITE_URL}/about` },
    openGraph: {
      title: `About ${BRAND} — Toronto's Trusted Printing Partner`,
      description: "30+ years of professional printing experience. Competitive prices, fast turnaround, high quality. Stickers, labels, banners, signs & more. Serving North America.",
      url: `${SITE_URL}/about`,
      siteName: BRAND,
      type: "website",
    },
    twitter: { card: "summary_large_image" },
  };
}

export default async function AboutPage() {
  const t = await getServerT();

  const milestones = [
    { year: "2018", key: "about.milestone1" },
    { year: "2020", key: "about.milestone2" },
    { year: "2022", key: "about.milestone3" },
    { year: "2024", key: "about.milestone4" },
  ];

  const equipment = [
    { key: "about.equip1", icon: "\uD83D\uDDA8\uFE0F" },
    { key: "about.equip2", icon: "\uD83D\uDD2A" },
    { key: "about.equip3", icon: "\uD83C\uDFA8" },
    { key: "about.equip4", icon: "\uD83D\uDCD0" },
  ];

  const certifications = [
    "about.cert1",
    "about.cert2",
    "about.cert3",
  ];

  const whyUs = [
    { icon: "\u2728", titleKey: "about.usp1Title", bodyKey: "about.usp1Body" },
    { icon: "\u26A1", titleKey: "about.usp2Title", bodyKey: "about.usp2Body" },
    { icon: "\uD83C\uDFA8", titleKey: "about.usp3Title", bodyKey: "about.usp3Body" },
    { icon: "\uD83D\uDEE0\uFE0F", titleKey: "about.usp4Title", bodyKey: "about.usp4Body" },
    { icon: "\uD83D\uDD0D", titleKey: "about.usp5Title", bodyKey: "about.usp5Body" },
    { icon: "\uD83D\uDCCD", titleKey: "about.usp6Title", bodyKey: "about.usp6Body" },
  ];

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-14 text-gray-900">
      <div className="mx-auto max-w-5xl space-y-10">
        {/* Hero with logo */}
        <header className="rounded-3xl border border-gray-200 bg-white p-8 md:p-12">
          <div className="flex items-start gap-5">
            <Image src="/logo.svg" alt="La Lunar Printing" width={64} height={64} className="h-16 w-16 shrink-0" />
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-gray-500">{t("about.badge")}</p>
              <h1 className="mt-3 text-3xl md:text-4xl font-semibold tracking-tight">{t("about.title")}</h1>
              <p className="mt-1 text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">Essential to Your Brand &mdash; Since 2018</p>
            </div>
          </div>
          <p className="mt-6 text-sm text-gray-600 leading-relaxed max-w-3xl">{t("about.body")}</p>
          <p className="mt-4 text-sm text-gray-600 leading-relaxed max-w-3xl">{t("about.bodyExtended")}</p>
        </header>

        {/* Why Work With Us */}
        <section className="rounded-3xl border border-gray-200 bg-white p-8 md:p-12">
          <h2 className="text-2xl font-semibold tracking-tight mb-6">{t("about.whyTitle")}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {whyUs.map((usp) => (
              <article key={usp.titleKey} className="rounded-2xl border border-gray-100 bg-gray-50 p-5">
                <span className="text-2xl">{usp.icon}</span>
                <h3 className="mt-3 text-sm font-bold">{t(usp.titleKey)}</h3>
                <p className="mt-2 text-xs text-gray-500 leading-relaxed">{t(usp.bodyKey)}</p>
              </article>
            ))}
          </div>
        </section>

        {/* Our Commitment */}
        <section className="rounded-3xl border border-gray-200 bg-white p-8 md:p-12">
          <h2 className="text-2xl font-semibold tracking-tight">{t("about.commitmentTitle")}</h2>
          <p className="mt-4 text-sm text-gray-600 leading-relaxed max-w-3xl">{t("about.commitmentBody")}</p>
          <p className="mt-4 text-sm font-semibold text-gray-800">
            {"\uD83D\uDC49"} Let&apos;s create something amazing together &mdash; with La Lunar Printing Inc., your trusted printing partner in Toronto &amp; beyond.
          </p>
        </section>

        {/* Company Story / Founding */}
        <section className="rounded-3xl border border-gray-200 bg-white p-8 md:p-12">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-1.5 rounded-full bg-black" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">{t("about.storyBadge")}</span>
          </div>
          <h2 className="text-2xl font-semibold tracking-tight">{t("about.storyTitle")}</h2>
          <p className="mt-4 text-sm text-gray-600 leading-relaxed max-w-3xl">{t("about.storyBody1")}</p>
          <p className="mt-3 text-sm text-gray-600 leading-relaxed max-w-3xl">{t("about.storyBody2")}</p>

          {/* Key stats */}
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { value: "2018", label: t("about.statFounded") },
              { value: "15,000+", label: t("about.statOrders") },
              { value: "500+", label: t("about.statClients") },
              { value: "GTA", label: t("about.statRegion") },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl border border-gray-100 bg-gray-50 p-4 text-center">
                <p className="text-2xl font-black tracking-tight">{stat.value}</p>
                <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-gray-400">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Timeline / Milestones */}
        <section className="rounded-3xl border border-gray-200 bg-white p-8 md:p-12">
          <h2 className="text-2xl font-semibold tracking-tight mb-8">{t("about.milestonesTitle")}</h2>
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-200" />
            <div className="space-y-6">
              {milestones.map((m) => (
                <div key={m.year} className="relative pl-12">
                  <div className="absolute left-2 top-1 w-5 h-5 rounded-full bg-gray-900 text-white text-[8px] font-bold flex items-center justify-center">
                    {"\u2713"}
                  </div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">{m.year}</p>
                  <p className="mt-1 text-sm text-gray-700">{t(m.key)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Equipment & Capabilities */}
        <section className="rounded-3xl border border-gray-200 bg-white p-8 md:p-12">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-1.5 rounded-full bg-black" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">{t("about.equipBadge")}</span>
          </div>
          <h2 className="text-2xl font-semibold tracking-tight">{t("about.equipTitle")}</h2>
          <p className="mt-3 text-sm text-gray-600 max-w-3xl">{t("about.equipBody")}</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {equipment.map((eq) => (
              <div key={eq.key} className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50 p-4">
                <span className="text-2xl">{eq.icon}</span>
                <p className="text-sm text-gray-700">{t(eq.key)}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Gallery */}
        <section className="rounded-3xl border border-gray-200 bg-white p-8 md:p-12">
          <h2 className="text-2xl font-semibold tracking-tight">{t("about.galleryTitle")}</h2>
          <p className="mt-2 text-sm text-gray-500">{t("about.gallerySubtitle")}</p>
          <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { label: "Production Floor", icon: "\uD83C\uDFED" },
              { label: "Wide-Format Printers", icon: "\uD83D\uDDA8\uFE0F" },
              { label: "Cutting Equipment", icon: "\u2702\uFE0F" },
              { label: "Quality Inspection", icon: "\uD83D\uDD0D" },
              { label: "Finished Products", icon: "\uD83D\uDCE6" },
              { label: "Our Team", icon: "\uD83D\uDC4B" },
            ].map((item, i) => (
              <div key={i} className="aspect-[4/3] rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden border border-gray-200 flex flex-col items-center justify-center gap-2">
                <span className="text-3xl">{item.icon}</span>
                <span className="text-xs font-medium text-gray-400">{item.label}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-gray-400 text-center italic">Photos coming soon</p>
        </section>

        {/* Certifications & Compliance */}
        <section className="rounded-3xl border border-gray-200 bg-white p-8">
          <h2 className="text-2xl font-semibold tracking-tight">{t("about.certTitle")}</h2>
          <p className="mt-3 text-sm text-gray-600">{t("about.certBody")}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            {certifications.map((c) => (
              <span key={c} className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-xs font-medium text-gray-700">
                <svg className="h-3.5 w-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {t(c)}
              </span>
            ))}
          </div>
        </section>

        {/* Quality Commitment */}
        <section className="rounded-3xl border border-gray-200 bg-white p-8">
          <h2 className="text-2xl font-semibold">{t("about.qualityTitle")}</h2>
          <p className="mt-3 text-sm text-gray-600 leading-relaxed">{t("about.qualityBody")}</p>
        </section>

        {/* CTA */}
        <section className="rounded-3xl border border-gray-200 bg-gray-900 p-8 text-white relative overflow-hidden">
          {/* Subtle brand watermark */}
          <div className="absolute top-4 right-4 opacity-[0.04]">
            <Image src="/logo.svg" alt="" width={120} height={120} className="invert" />
          </div>
          <h2 className="text-2xl font-semibold relative">{t("about.ctaTitle")}</h2>
          <p className="mt-3 text-sm text-gray-200 relative">{t("about.ctaBody")}</p>
          <div className="mt-5 flex flex-wrap gap-3 relative">
            <Link
              href="/shop"
              className="inline-block rounded-full bg-white px-5 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-gray-900 hover:bg-gray-100 transition-colors"
            >
              {t("about.ctaButton")}
            </Link>
            <Link
              href="/contact"
              className="inline-block rounded-full border border-white/30 px-5 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white hover:border-white/70 transition-colors"
            >
              {t("about.ctaContact")}
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
