"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/useTranslation";

const STORAGE_KEY = "lunarprint_welcome_dismissed";

export default function WelcomeBanner() {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) {
        setVisible(true);
      }
    } catch {
      // localStorage unavailable (SSR / private browsing)
    }
  }, []);

  const dismiss = () => {
    setVisible(false);
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore
    }
  };

  if (!visible) return null;

  const links = [
    { label: t("home.welcomeBrowse"), href: "/shop" },
    { label: t("home.welcomeQuote"), href: "/quote" },
    { label: t("home.welcomeDesign"), href: "/design-services" },
    { label: t("home.welcomeHowItWorks"), href: "#how-it-works" },
  ];

  return (
    <div className="relative bg-gradient-to-r from-[var(--color-brand-50)] to-blue-50 border-b border-[var(--color-gray-200)]">
      <div className="mx-auto max-w-[1600px] px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex items-start gap-3 pr-8 sm:items-center">
          {/* Icon */}
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand)] text-white sm:mt-0">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
            </svg>
          </span>

          <div className="flex-1 min-w-0">
            {/* Message */}
            <p className="text-sm font-medium text-[var(--color-gray-700)] leading-snug">
              {t("home.welcomeMessage")}
            </p>

            {/* Quick links */}
            <div className="mt-2 flex flex-wrap gap-2">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-semibold text-[var(--color-brand)] shadow-sm border border-[var(--color-gray-200)] transition-colors hover:bg-[var(--color-brand)] hover:text-white hover:border-[var(--color-brand)]"
                >
                  {link.label}
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Dismiss button */}
        <button
          type="button"
          onClick={dismiss}
          className="absolute right-3 top-3 rounded-full p-1 text-[var(--color-gray-400)] transition-colors hover:bg-[var(--color-gray-200)] hover:text-[var(--color-gray-600)] sm:right-4 sm:top-4"
          aria-label="Dismiss welcome banner"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
