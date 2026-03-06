"use client";

import { useTranslation } from "@/lib/i18n/useTranslation";

const STEP_ICONS = [
  <svg key="1" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" /></svg>,
  <svg key="2" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>,
  <svg key="3" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" /></svg>,
  <svg key="4" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m0 0a48.159 48.159 0 0110.5 0m-10.5 0V4.875c0-.621.504-1.125 1.125-1.125h8.25c.621 0 1.125.504 1.125 1.125v3.659" /></svg>,
  <svg key="5" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" /></svg>,
];

const STEPS = [
  { num: "01", i18n: 1, icon: STEP_ICONS[0] },
  { num: "02", i18n: 2, icon: STEP_ICONS[1] },
  { num: "03", i18n: 3, icon: STEP_ICONS[2], highlight: true },
  { num: "04", i18n: 4, icon: STEP_ICONS[3] },
  { num: "05", i18n: 5, icon: STEP_ICONS[4] },
];

export default function HowItWorksClient() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-[var(--color-gray-50)]">
      {/* Hero */}
      <section className="bg-white border-b border-[var(--color-gray-200)]">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:py-20">
          <h1 className="text-3xl font-bold tracking-tight text-[var(--color-gray-900)] sm:text-4xl">
            {t("howItWorks.title")}
          </h1>
          <p
            className="mx-auto mt-4 max-w-2xl text-base text-[var(--color-gray-500)] leading-relaxed [&_strong]:text-[var(--color-gray-900)]"
            dangerouslySetInnerHTML={{ __html: t("howItWorks.subtitle") }}
          />
        </div>
      </section>

      {/* Steps */}
      <section className="mx-auto max-w-4xl px-4 py-16">
        <div className="space-y-6">
          {STEPS.map((step) => (
            <div
              key={step.num}
              className={`relative rounded-2xl border bg-white p-6 md:p-8 shadow-[var(--shadow-card)] ${
                step.highlight
                  ? "border-[var(--color-brand)] ring-1 ring-[var(--color-brand)]/20"
                  : "border-[var(--color-gray-200)]"
              }`}
            >
              {step.highlight && (
                <span className="absolute -top-3 left-6 rounded-full bg-[var(--color-brand)] px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#fff]">
                  {t("howItWorks.keyStep")}
                </span>
              )}
              <div className="flex gap-5">
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                    step.highlight
                      ? "bg-[var(--color-brand)] text-[#fff]"
                      : "bg-[var(--color-gray-100)] text-[var(--color-gray-600)]"
                  }`}
                >
                  {step.icon}
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-[var(--color-gray-400)]">{t("howItWorks.stepLabel")} {step.num}</span>
                  </div>
                  <h2 className="mt-1 text-lg font-bold text-[var(--color-gray-900)]">{t(`howItWorks.step${step.i18n}.title`)}</h2>
                  <p className="mt-2 text-sm text-[var(--color-gray-600)] leading-relaxed">{t(`howItWorks.step${step.i18n}.desc`)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Proof FAQ */}
      <section className="border-t border-[var(--color-gray-200)] bg-white">
        <div className="mx-auto max-w-4xl px-4 py-16">
          <h2 className="text-center text-2xl font-bold text-[var(--color-gray-900)]">
            {t("howItWorks.proofFaq")}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-sm text-[var(--color-gray-500)]">
            {t("howItWorks.proofFaqSubtitle")}
          </p>

          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="rounded-xl border border-[var(--color-gray-200)] bg-[var(--color-gray-50)] p-5">
                <h3 className="text-sm font-bold text-[var(--color-gray-900)]">{t(`howItWorks.faq${i}.q`)}</h3>
                <p className="mt-2 text-sm text-[var(--color-gray-600)] leading-relaxed">{t(`howItWorks.faq${i}.a`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-[var(--color-gray-200)] bg-[var(--color-brand)]">
        <div className="mx-auto max-w-2xl px-4 py-12 text-center">
          <h2 className="text-xl font-bold text-[#fff] sm:text-2xl">{t("howItWorks.ctaTitle")}</h2>
          <p className="mt-2 text-sm text-[#fff]/80">
            {t("howItWorks.ctaDesc")}
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
            <a
              href="/shop"
              className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-[var(--color-brand)] transition-colors hover:bg-gray-100"
            >
              {t("howItWorks.ctaBrowse")}
            </a>
            <a
              href="/quote"
              className="rounded-full border-2 border-white px-6 py-3 text-sm font-semibold text-[#fff] transition-colors hover:bg-white/10"
            >
              {t("howItWorks.ctaQuote")}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
