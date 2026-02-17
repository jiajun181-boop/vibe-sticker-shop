"use client";

import { useTranslation } from "@/lib/i18n/useTranslation";

const STEP_ICONS = [
  <svg key="1" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
  </svg>,
  <svg key="2" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>,
  <svg key="3" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18.75 12h.008v.008h-.008V12zm-2.25 0h.008v.008H16.5V12z" />
  </svg>,
  <svg key="4" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
  </svg>,
];

const STEP_KEYS = [
  { titleKey: "howItWorks.step1.title", descKey: "howItWorks.step1.desc" },
  { titleKey: "howItWorks.step2.title", descKey: "howItWorks.step2.desc" },
  { titleKey: "howItWorks.step3.title", descKey: "howItWorks.step3.desc" },
  { titleKey: "howItWorks.step4.title", descKey: "howItWorks.step4.desc" },
];

export default function HowItWorks() {
  const { t } = useTranslation();

  return (
    <section className="bg-white rounded-3xl border border-[var(--color-gray-100)] p-8 md:p-12">
      <div className="text-center mb-10">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-ink-black)]" />
          <span className="label-xs text-[var(--color-gray-400)]">
            {t("howItWorks.badge")}
          </span>
        </div>
        <h2 className="heading-2">
          {t("howItWorks.title")}
        </h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
        {STEP_KEYS.map((step, i) => (
          <div key={i} className="text-center relative">
            {/* Connector line (desktop only) */}
            {i < STEP_KEYS.length - 1 && (
              <div className="hidden md:block absolute top-8 left-[60%] right-[-40%] h-px bg-gradient-to-r from-[var(--color-moon-gold)] to-transparent" />
            )}

            {/* Number badge */}
            <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[var(--color-gray-50)] border border-[var(--color-gray-100)] text-[var(--color-gray-800)] mb-4 mx-auto">
              {STEP_ICONS[i]}
              <span className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-[var(--color-moon-gold)] to-[var(--color-moon-gold-dark)] text-white rounded-full label-xs flex items-center justify-center tracking-normal font-black">
                {i + 1}
              </span>
            </div>

            <h3 className="font-bold body-sm mb-1.5">{t(step.titleKey)}</h3>
            <p className="body-sm text-[var(--color-gray-400)] leading-relaxed max-w-[180px] mx-auto">{t(step.descKey)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
