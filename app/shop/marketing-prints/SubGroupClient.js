"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/useTranslation";
import Breadcrumbs from "@/components/Breadcrumbs";

const formatCad = (cents) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(
    cents / 100
  );

function ProductCard({ product, t }) {
  const href = `/shop/${product.category}/${product.slug}`;
  const image = product.images?.[0];
  const sizeCount = product.optionsConfig?.sizes?.length || 0;

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
            <div className="text-center px-3">
              <svg className="mx-auto h-8 w-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
              <p className="mt-1 text-xs font-medium text-gray-400">{product.name}</p>
            </div>
          </div>
        )}
      </div>

      <div className="p-3 sm:p-4">
        <h3 className="text-sm font-semibold text-gray-900 leading-snug">{product.name}</h3>
        {product.description && (
          <p className="mt-1 text-[11px] text-gray-500 line-clamp-2">{product.description}</p>
        )}
        {sizeCount > 0 && (
          <p className="mt-1.5 text-[11px] text-gray-400">{sizeCount} {t("mp.landing.options")}</p>
        )}
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

export default function SubGroupClient({ products, groupKey }) {
  const { t } = useTranslation();

  return (
    <main className="bg-gray-50 pb-20 pt-10 text-gray-900">
      <div className="mx-auto max-w-6xl px-6">
        <Breadcrumbs
          items={[
            { label: t("product.shop"), href: "/shop" },
            { label: t("mp.landing.title"), href: "/shop/marketing-prints" },
            { label: t(`mp.sub.${groupKey}.title`) },
          ]}
        />

        <header className="mt-6">
          <h1 className="text-3xl font-semibold tracking-tight">
            {t(`mp.sub.${groupKey}.title`)}
          </h1>
          <p className="mt-2 text-base text-gray-600">
            {t(`mp.sub.${groupKey}.subtitle`)}
          </p>
        </header>

        <div className="mt-8 grid gap-4 grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} t={t} />
          ))}
        </div>

        {products.length === 0 && (
          <p className="mt-8 text-center text-sm text-gray-500">
            No products available in this category yet.
          </p>
        )}

        <div className="mt-10 text-center">
          <Link
            href="/shop/marketing-prints"
            className="inline-flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg className="h-4 w-4 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
            {t("mp.landing.title")}
          </Link>
        </div>
      </div>
    </main>
  );
}
