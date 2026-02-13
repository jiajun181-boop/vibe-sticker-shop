"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/useTranslation";
import Breadcrumbs from "@/components/Breadcrumbs";

const formatCad = (cents) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(
    cents / 100
  );

function SubGroupCard({ group, t }) {
  return (
    <Link
      href={group.href}
      className="group flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:border-gray-400"
    >
      {/* Preview images or placeholder */}
      <div className="relative aspect-[4/3] bg-gray-100">
        {group.previews?.length > 0 ? (
          <div className="grid h-full w-full grid-cols-3">
            {group.previews.slice(0, 3).map((url, i) => (
              <div key={i} className="relative overflow-hidden">
                <Image
                  src={url}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 33vw, 15vw"
                  unoptimized={url.endsWith(".svg")}
                />
              </div>
            ))}
            {group.previews.length < 3 &&
              Array.from({ length: 3 - group.previews.length }).map((_, i) => (
                <div key={`empty-${i}`} className="bg-gray-50" />
              ))}
          </div>
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
            <svg
              className="h-10 w-10 text-gray-200"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <h3 className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
          {group.title}
        </h3>
        {group.count > 0 && (
          <p className="mt-1 text-[11px] text-gray-400">
            {group.count} {t("mp.landing.products")}
          </p>
        )}
        <span className="mt-auto pt-3 inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-gray-500 group-hover:text-gray-900 transition-colors">
          {t("mp.landing.browse")}
          <svg className="h-3 w-3 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </span>
      </div>
    </Link>
  );
}

function OrphanProductCard({ product, t }) {
  const href = `/shop/${product.category}/${product.slug}`;
  const image = product.images?.[0];

  return (
    <Link
      href={href}
      className="group overflow-hidden rounded-2xl border border-gray-200 bg-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="relative aspect-[4/3] bg-gray-100">
        {image?.url ? (
          <Image
            src={image.url}
            alt={image.alt || product.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
            unoptimized={image.url.endsWith(".svg")}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
            <svg className="h-8 w-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </div>
        )}
      </div>
      <div className="p-3 sm:p-4">
        <h3 className="text-sm font-semibold text-gray-900 leading-snug">{product.name}</h3>
        {product.basePrice > 0 && (
          <p className="mt-2 text-sm font-bold text-gray-900">
            {t("product.from", { price: formatCad(product.basePrice) })}
          </p>
        )}
        <span className="mt-2 inline-block rounded-full bg-gray-900 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-white transition-colors group-hover:bg-black">
          {t("mp.landing.viewOrder")}
        </span>
      </div>
    </Link>
  );
}

export default function SubGroupLandingClient({
  category,
  categoryTitle,
  categoryIcon,
  subGroups,
  orphanProducts = [],
  totalCount,
}) {
  const { t } = useTranslation();

  return (
    <main className="bg-gray-50 pb-20 pt-10 text-gray-900">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Breadcrumbs
          items={[
            { label: t("product.shop"), href: "/shop" },
            { label: categoryTitle },
          ]}
        />

        {/* Header */}
        <header className="mt-6">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
            {categoryIcon && <span className="mr-2">{categoryIcon}</span>}
            {categoryTitle}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {totalCount} {t("mp.landing.products")}
          </p>
        </header>

        {/* Sub-group card grid */}
        <div className="mt-8 grid gap-3 grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          {subGroups.map((group) => (
            <SubGroupCard key={group.slug} group={group} t={t} />
          ))}
        </div>

        {/* Orphan products — products not in any sub-group */}
        {orphanProducts.length > 0 && (
          <section className="mt-12">
            <h2 className="text-lg font-semibold tracking-tight text-gray-900">
              {t("shop.more") || "More"}
            </h2>
            <div className="mt-4 grid gap-3 grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
              {orphanProducts.map((product) => (
                <OrphanProductCard key={product.id} product={product} t={t} />
              ))}
            </div>
          </section>
        )}

        {/* Back to shop */}
        <div className="mt-12 text-center">
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 rounded-full border border-gray-300 px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.15em] text-gray-600 transition-colors hover:border-gray-900 hover:text-gray-900"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            {t("shop.backToCategories")}
          </Link>
        </div>

        {/* Info Footer */}
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-600">
              {t("mp.landing.qualityTitle")}
            </h3>
            <ul className="mt-3 space-y-2 text-sm text-gray-700">
              {["quality1", "quality2", "quality3", "quality4"].map((k) => (
                <li key={k} className="flex items-start gap-2">
                  <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {t(`mp.landing.${k}`)}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-600">
              {t("mp.landing.turnaroundTitle")}
            </h3>
            <p className="mt-3 text-sm text-gray-700">{t("mp.landing.turnaroundText")}</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-600">
              {t("mp.landing.customTitle")}
            </h3>
            <p className="mt-3 text-sm text-gray-700">{t("mp.landing.customText")}</p>
            <Link href="/quote" className="mt-3 inline-block rounded-full bg-gray-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-white hover:bg-black">
              {t("home.cta.quote")}
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
