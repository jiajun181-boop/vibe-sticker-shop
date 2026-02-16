"use client";

import Image from "next/image";
import Link from "next/link";
import { useFavoritesStore } from "@/lib/favorites";
import { useCartStore } from "@/lib/store";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { showSuccessToast } from "@/components/Toast";
import { getProductImage, isSvgImage } from "@/lib/product-image";

const formatCad = (cents) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);

export default function FavoritesPage() {
  const favorites = useFavoritesStore((s) => s.favorites);
  const removeFavorite = useFavoritesStore((s) => s.removeFavorite);
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openCart);
  const { t } = useTranslation();

  function quickAdd(fav) {
    addItem({
      productId: fav.slug,
      slug: fav.slug,
      name: fav.name,
      unitAmount: fav.basePrice,
      quantity: 1,
      image: fav.image,
      meta: {},
      id: fav.slug,
      price: fav.basePrice,
      options: {},
    });
    openCart();
    showSuccessToast(t("shop.addedToCart"));
  }

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold tracking-[0.15em] text-gray-900">
        {t("favorites.title")}
      </h1>

      {favorites.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 p-12 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
          </svg>
          <p className="mt-4 text-sm text-gray-500">{t("favorites.empty")}</p>
          <Link
            href="/shop"
            className="mt-4 inline-block rounded-full border border-gray-300 px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-gray-700 hover:border-indigo-700 hover:text-indigo-700 transition-colors"
          >
            {t("favorites.browseCta")}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
          {favorites.map((fav) => {
            const href = `/shop/${fav.category}/${fav.slug}`;
            const imageSrc = fav.image || "/products/placeholder.png";
            const priceText = fav.basePrice > 0 ? formatCad(fav.basePrice) : "";

            return (
              <article
                key={fav.slug}
                className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white transition-all duration-200 hover:-translate-y-0.5 hover:border-gray-400 hover:shadow-lg"
              >
                <Link href={href} className="relative block aspect-[4/3] bg-gray-100">
                  <Image
                    src={imageSrc}
                    alt={fav.name}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 1024px) 50vw, 33vw"
                    unoptimized={isSvgImage(imageSrc)}
                  />
                </Link>

                {/* Remove favorite button */}
                <button
                  type="button"
                  onClick={() => {
                    removeFavorite(fav.slug);
                    showSuccessToast(t("favorites.removed"));
                  }}
                  className="absolute top-2 left-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 backdrop-blur-sm transition-colors hover:bg-white"
                >
                  <svg className="h-4 w-4 fill-red-500 text-red-500" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                  </svg>
                </button>

                <div className="p-3 sm:p-4">
                  <h3 className="min-h-[2.5rem] text-sm font-semibold leading-5 text-gray-900">
                    {fav.name}
                  </h3>
                  {priceText && (
                    <p className="mt-1 text-sm font-semibold text-gray-900">{priceText}</p>
                  )}
                  <div className="mt-3 flex gap-2">
                    <Link
                      href={href}
                      className="flex-1 rounded-full bg-indigo-700 px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-[0.15em] text-white transition-colors hover:bg-indigo-800"
                    >
                      {t("shop.viewDetails")}
                    </Link>
                    <button
                      type="button"
                      onClick={() => quickAdd(fav)}
                      className="rounded-full border border-gray-300 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-gray-700 transition-colors hover:border-indigo-700 hover:text-indigo-700"
                    >
                      {t("shop.quickAdd")}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
