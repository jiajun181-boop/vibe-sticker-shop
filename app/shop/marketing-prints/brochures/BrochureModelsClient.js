"use client";

import Link from "next/link";
import { useTranslation } from "@/lib/i18n/useTranslation";
import Breadcrumbs from "@/components/Breadcrumbs";

function getBrochureModels(locale) {
  const zh = locale === "zh";
  return [
    {
      id: "bi-fold",
      title: zh ? "双折页" : "Bi-Fold Brochure",
      subtitle: zh ? "4面结构，信息清晰" : "4 panels, clean structure",
      useCase: zh ? "产品介绍 / 价目单 / 服务说明" : "Product intro / price sheet / service overview",
      fromPrice: "CA$0.22+",
    },
    {
      id: "tri-fold",
      title: zh ? "三折页" : "Tri-Fold Brochure",
      subtitle: zh ? "6面结构，营销转化常用" : "6 panels, marketing favorite",
      useCase: zh ? "门店推广 / 活动宣传 / 地推发放" : "Store promos / campaigns / handouts",
      fromPrice: "CA$0.26+",
    },
    {
      id: "z-fold",
      title: zh ? "四折页" : "Z-Fold Brochure",
      subtitle: zh ? "8面结构，信息容量更高" : "8 panels, higher content capacity",
      useCase: zh ? "品牌介绍 / 产品目录 / 路线导览" : "Brand story / catalog / guides",
      fromPrice: "CA$0.33+",
    },
  ];
}

export default function BrochureModelsClient() {
  const { t, locale } = useTranslation();
  const models = getBrochureModels(locale);

  return (
    <main className="bg-gray-50 pb-20 pt-10 text-gray-900">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Breadcrumbs
          items={[
            { label: t("product.shop"), href: "/shop" },
            { label: t("mp.landing.title"), href: "/shop/marketing-prints" },
            { label: t("mp.sub.brochures.title") },
          ]}
        />

        <header className="mt-6">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
            {t("mp.sub.brochures.title")}
          </h1>
          <p className="mt-2 text-sm sm:text-base text-gray-600">
            {locale === "zh"
              ? "先选折页类型，再进入对应产品页下单。"
              : "Choose your fold type first, then configure on a dedicated product page."}
          </p>
        </header>

        <section className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {models.map((item) => (
            <Link
              key={item.id}
              href={`/shop/marketing-prints/brochures/${item.id}`}
              className="group rounded-2xl border border-gray-200 bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-gray-400 hover:shadow-lg"
            >
              <p className="text-sm font-semibold text-gray-900">{item.title}</p>
              <p className="mt-1 text-xs text-gray-500">{item.subtitle}</p>
              <p className="mt-2 text-xs text-gray-600">{item.useCase}</p>
              <p className="mt-3 text-sm font-bold text-gray-900">{item.fromPrice}</p>
              <span className="mt-3 inline-block rounded-full bg-gray-100 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-gray-700 transition-colors group-hover:bg-gray-900 group-hover:text-white">
                {locale === "zh" ? "进入产品页" : "Open Product"}
              </span>
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}
