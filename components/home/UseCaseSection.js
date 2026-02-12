"use client";

import Link from "next/link";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { USE_CASES } from "@/lib/useCases";

export default function UseCaseSection() {
  const { t } = useTranslation();

  return (
    <section>
      <h2 className="text-2xl md:text-3xl font-black tracking-tight text-center mb-8">
        {t("home.shopByUseCase")}
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {USE_CASES.map((uc) => (
          <Link
            key={uc.slug}
            href={`/shop?useCase=${uc.slug}`}
            className="group overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 text-center hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
          >
            <span className="text-3xl block">{uc.icon}</span>
            <h3 className="mt-3 font-bold text-sm text-gray-900">
              {t(`useCase.${uc.slug}.title`)}
            </h3>
            <p className="mt-1 text-xs text-gray-400">
              {t(`useCase.${uc.slug}.subtitle`)}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
