"use client";

import Link from "next/link";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { USE_CASES } from "@/lib/useCases";

export default function UseCaseSection() {
  const { t } = useTranslation();

  return (
    <section>
      <h2 className="heading-2 text-center mb-10">
        {t("home.shopByUseCase")}
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {USE_CASES.map((uc) => (
          <Link
            key={uc.slug}
            href={`/ideas/${uc.slug}`}
            className="group overflow-hidden rounded-2xl border border-[var(--color-gray-200)] bg-white p-6 text-center hover-lift"
          >
            <span className="text-4xl block">{uc.icon}</span>
            <h3 className="mt-3 font-bold body-sm text-gray-900">
              {t(`useCase.${uc.slug}.title`)}
            </h3>
            <p className="mt-1 body-sm text-gray-400">
              {t(`useCase.${uc.slug}.subtitle`)}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
