import Link from "next/link";
import Image from "next/image";
import { getServerT } from "@/lib/i18n/server";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.lunarprint.ca";
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
    <main className="min-h-screen bg-[var(--color-gray-50)] px-6 py-14 text-[var(--color-gray-800)]">
      <div className="mx-auto max-w-5xl space-y-10">
        {/* Hero with logo */}
        <header className="rounded-3xl border border-[var(--color-gray-200)] bg-white p-8 md:p-12">
          <div className="flex items-start gap-5">
            <Image src="/logo-lunarprint.png" alt="La Lunar Printing" width={64} height={64} className="h-16 w-16 shrink-0" />
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-[var(--color-gray-500)]">{t("about.badge")}</p>
              <h1 className="mt-3 text-3xl md:text-4xl font-semibold tracking-tight">{t("about.title")}</h1>
              <p className="mt-1 text-[10px] font-black uppercase tracking-[0.25em] text-[var(--color-gray-400)]">{t("about.tagline")}</p>
            </div>
          </div>
          <p className="mt-6 text-sm text-[var(--color-gray-600)] leading-relaxed max-w-3xl">{t("about.body")}</p>
          <p className="mt-4 text-sm text-[var(--color-gray-600)] leading-relaxed max-w-3xl">{t("about.bodyExtended")}</p>
        </header>

        {/* Why Work With Us */}
        <section className="rounded-3xl border border-[var(--color-gray-200)] bg-white p-8 md:p-12">
          <h2 className="text-2xl font-semibold tracking-tight mb-6">{t("about.whyTitle")}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {whyUs.map((usp) => (
              <article key={usp.titleKey} className="rounded-2xl border border-[var(--color-gray-100)] bg-[var(--color-gray-50)] p-5">
                <span className="text-2xl">{usp.icon}</span>
                <h3 className="mt-3 text-sm font-bold">{t(usp.titleKey)}</h3>
                <p className="mt-2 text-xs text-[var(--color-gray-500)] leading-relaxed">{t(usp.bodyKey)}</p>
              </article>
            ))}
          </div>
        </section>

        {/* Our Commitment */}
        <section className="rounded-3xl border border-[var(--color-gray-200)] bg-white p-8 md:p-12">
          <h2 className="text-2xl font-semibold tracking-tight">{t("about.commitmentTitle")}</h2>
          <p className="mt-4 text-sm text-[var(--color-gray-600)] leading-relaxed max-w-3xl">{t("about.commitmentBody")}</p>
          <p className="mt-4 text-sm font-semibold text-[var(--color-gray-800)]">
            {"\uD83D\uDC49"} {t("about.commitmentCta")}
          </p>
        </section>

        {/* Company Story / Founding */}
        <section className="rounded-3xl border border-[var(--color-gray-200)] bg-white p-8 md:p-12">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-ink-black)]" />
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--color-gray-400)]">{t("about.storyBadge")}</span>
          </div>
          <h2 className="text-2xl font-semibold tracking-tight">{t("about.storyTitle")}</h2>
          <p className="mt-4 text-sm text-[var(--color-gray-600)] leading-relaxed max-w-3xl">{t("about.storyBody1")}</p>
          <p className="mt-3 text-sm text-[var(--color-gray-600)] leading-relaxed max-w-3xl">{t("about.storyBody2")}</p>

          {/* Key stats */}
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { value: "2018", label: t("about.statFounded") },
              { value: "15,000+", label: t("about.statOrders") },
              { value: "500+", label: t("about.statClients") },
              { value: "GTA", label: t("about.statRegion") },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl border border-[var(--color-gray-100)] bg-[var(--color-gray-50)] p-4 text-center">
                <p className="text-2xl font-black tracking-tight">{stat.value}</p>
                <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--color-gray-400)]">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Timeline / Milestones */}
        <section className="rounded-3xl border border-[var(--color-gray-200)] bg-white p-8 md:p-12">
          <h2 className="text-2xl font-semibold tracking-tight mb-8">{t("about.milestonesTitle")}</h2>
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-px bg-[var(--color-gray-200)]" />
            <div className="space-y-6">
              {milestones.map((m) => (
                <div key={m.year} className="relative pl-12">
                  <div className="absolute left-2 top-1 w-5 h-5 rounded-full bg-[var(--color-gray-900)] text-[#fff] label-xs font-bold flex items-center justify-center">
                    {"\u2713"}
                  </div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--color-gray-400)]">{m.year}</p>
                  <p className="mt-1 text-sm text-[var(--color-gray-700)]">{t(m.key)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Equipment & Capabilities */}
        <section className="rounded-3xl border border-[var(--color-gray-200)] bg-white p-8 md:p-12">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-ink-black)]" />
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--color-gray-400)]">{t("about.equipBadge")}</span>
          </div>
          <h2 className="text-2xl font-semibold tracking-tight">{t("about.equipTitle")}</h2>
          <p className="mt-3 text-sm text-[var(--color-gray-600)] max-w-3xl">{t("about.equipBody")}</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {equipment.map((eq) => (
              <div key={eq.key} className="flex items-start gap-3 rounded-xl border border-[var(--color-gray-100)] bg-[var(--color-gray-50)] p-4">
                <span className="text-2xl">{eq.icon}</span>
                <p className="text-sm text-[var(--color-gray-700)]">{t(eq.key)}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Capabilities at a glance */}
        <section className="rounded-3xl border border-[var(--color-gray-200)] bg-white p-8 md:p-12">
          <h2 className="text-2xl font-semibold tracking-tight">{t("about.galleryTitle")}</h2>
          <p className="mt-2 text-sm text-[var(--color-gray-500)]">{t("about.gallerySubtitle")}</p>
          <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { n: 1, icon: <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m0 0a48.159 48.159 0 0110.5 0m-10.5 0V4.875c0-.621.504-1.125 1.125-1.125h8.25c.621 0 1.125.504 1.125 1.125v3.659" /></svg> },
              { n: 2, icon: <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" /></svg> },
              { n: 3, icon: <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M7.848 8.25l1.536.887M7.848 8.25a3 3 0 11-5.196-3 3 3 0 015.196 3zm1.536.887a2.165 2.165 0 011.083 1.839c.005.351.054.695.14 1.024M9.384 9.137l2.077 1.199M7.848 15.75l1.536-.887m-1.536.887a3 3 0 11-5.196 3 3 3 0 015.196-3zm1.536-.887a2.165 2.165 0 001.083-1.838c.005-.352.054-.696.14-1.025m-1.223 2.863l2.077-1.199m0-3.328a4.323 4.323 0 012.068-1.379l5.325-1.628a4.5 4.5 0 012.48 0l.136.046" /></svg> },
              { n: 4, icon: <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
              { n: 5, icon: <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg> },
              { n: 6, icon: <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" /></svg> },
            ].map(({ n, icon }) => (
              <div key={n} className="rounded-xl border border-[var(--color-gray-200)] bg-[var(--color-gray-50)] p-4">
                <div className="mb-2 text-[var(--color-brand)]">{icon}</div>
                <p className="text-sm font-semibold text-[var(--color-gray-800)]">{t(`about.gallery${n}Label`)}</p>
                <p className="mt-1 text-xs text-[var(--color-gray-500)] leading-relaxed">{t(`about.gallery${n}Desc`)}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Certifications & Compliance */}
        <section className="rounded-3xl border border-[var(--color-gray-200)] bg-white p-8">
          <h2 className="text-2xl font-semibold tracking-tight">{t("about.certTitle")}</h2>
          <p className="mt-3 text-sm text-[var(--color-gray-600)]">{t("about.certBody")}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            {certifications.map((c) => (
              <span key={c} className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--color-gray-200)] bg-[var(--color-gray-50)] px-4 py-2 text-xs font-medium text-[var(--color-gray-700)]">
                <svg className="h-3.5 w-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {t(c)}
              </span>
            ))}
          </div>
        </section>

        {/* Quality Commitment */}
        <section className="rounded-3xl border border-[var(--color-gray-200)] bg-white p-8">
          <h2 className="text-2xl font-semibold">{t("about.qualityTitle")}</h2>
          <p className="mt-3 text-sm text-[var(--color-gray-600)] leading-relaxed">{t("about.qualityBody")}</p>
        </section>

        {/* CTA */}
        <section className="rounded-3xl border border-[var(--color-gray-200)] bg-[var(--color-gray-900)] p-8 text-[#fff] relative overflow-hidden">
          {/* Subtle brand watermark */}
          <div className="absolute top-4 right-4 opacity-[0.04]">
            <Image src="/logo-lunarprint.png" alt="" width={120} height={120} className="opacity-20" />
          </div>
          <h2 className="text-2xl font-semibold relative">{t("about.ctaTitle")}</h2>
          <p className="mt-3 text-sm text-[var(--color-gray-200)] relative">{t("about.ctaBody")}</p>
          <div className="mt-5 flex flex-wrap gap-3 relative">
            <Link
              href="/shop"
              className="inline-block rounded-xl bg-white px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-gray-900)] hover:bg-[var(--color-gray-100)] transition-colors"
            >
              {t("about.ctaButton")}
            </Link>
            <Link
              href="/contact"
              className="inline-block rounded-xl border border-white/30 px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#fff] hover:border-white/70 transition-colors"
            >
              {t("about.ctaContact")}
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
