"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useCartStore } from "@/lib/store";
import { showSuccessToast } from "@/components/Toast";

const PAGE_SIZE_OPTIONS = [12, 24, 36];

const CATEGORY_LABELS = {
  all: "All Products",
  "stickers-labels": "Stickers & Labels",
  "rigid-signs": "Signs & Boards",
  "banners-displays": "Banners & Displays",
  "marketing-prints": "Marketing Prints",
  displays: "Display Hardware",
  "vehicle-branding-advertising": "Vehicle Branding",
  "safety-warning-decals": "Safety & Warning Decals",
  "fleet-compliance-id": "Fleet Compliance & ID",
  "facility-asset-labels": "Facility & Asset Labels",
  "retail-promo": "Retail Promo",
  packaging: "Packaging Inserts",
  "business-forms": "Business Forms",
  "large-format-graphics": "Large Format Graphics",
  "window-graphics": "Window & Wall Graphics",
};

const formatCad = (cents) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);

function sortProducts(list, sortBy) {
  const arr = [...list];
  if (sortBy === "price-asc") arr.sort((a, b) => a.basePrice - b.basePrice);
  if (sortBy === "price-desc") arr.sort((a, b) => b.basePrice - a.basePrice);
  if (sortBy === "name") arr.sort((a, b) => a.name.localeCompare(b.name));
  if (sortBy === "popular") arr.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  return arr;
}

export default function ShopClient({ products, initialCategory }) {
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openCart);

  const [category, setCategory] = useState(initialCategory || "all");
  const [sortBy, setSortBy] = useState("popular");
  const [view, setView] = useState("grid");
  const [pageSize, setPageSize] = useState(12);
  const [page, setPage] = useState(1);

  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category));
    return ["all", ...Array.from(set)];
  }, [products]);

  const filtered = useMemo(() => {
    const base = category === "all" ? products : products.filter((p) => p.category === category);
    return sortProducts(base, sortBy);
  }, [products, category, sortBy]);

  const visible = useMemo(() => filtered.slice(0, page * pageSize), [filtered, page, pageSize]);
  const hasMore = visible.length < filtered.length;

  function quickAdd(product) {
    addItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      unitAmount: product.basePrice,
      quantity: 1,
      image: product.images[0]?.url || null,
      meta: { pricingUnit: product.pricingUnit },
      id: product.id,
      price: product.basePrice,
      options: { pricingUnit: product.pricingUnit },
    });
    openCart();
    showSuccessToast("Added to cart!");
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 pb-16 pt-10 text-gray-900">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8">
          <p className="text-xs uppercase tracking-[0.25em] text-gray-500">Shop</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight">Product Catalog</h1>
        </header>

        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          <aside className="space-y-4 rounded-3xl border border-gray-200 bg-white p-5 lg:sticky lg:top-24 lg:h-fit">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Categories</p>
            <div className="space-y-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setCategory(cat);
                    setPage(1);
                  }}
                  className={`w-full rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                    category === cat ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {CATEGORY_LABELS[cat] || cat}
                </button>
              ))}
            </div>
          </aside>

          <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white p-4">
              <div className="flex items-center gap-3">
                <label className="text-xs uppercase tracking-[0.2em] text-gray-500">Sort</label>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="rounded-lg border border-gray-300 px-2 py-1 text-sm">
                  <option value="popular">Popularity</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="name">Name</option>
                </select>
              </div>

              <div className="flex items-center gap-3">
                <label className="text-xs uppercase tracking-[0.2em] text-gray-500">Per Page</label>
                <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }} className="rounded-lg border border-gray-300 px-2 py-1 text-sm">
                  {PAGE_SIZE_OPTIONS.map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>

                <div className="rounded-full border border-gray-300 p-1 text-xs">
                  <button onClick={() => setView("grid")} className={`rounded-full px-3 py-1 ${view === "grid" ? "bg-gray-900 text-white" : "text-gray-600"}`}>Grid</button>
                  <button onClick={() => setView("list")} className={`rounded-full px-3 py-1 ${view === "list" ? "bg-gray-900 text-white" : "text-gray-600"}`}>List</button>
                </div>
              </div>
            </div>

            <div className={view === "grid" ? "grid gap-4 sm:grid-cols-2 xl:grid-cols-3" : "space-y-3"}>
              {visible.map((product) => {
                const href = `/shop/${product.category}/${product.slug}`;
                const isOutOfStock = !product.isActive;
                const rangeText = product.pricingUnit === "per_sqft" ? `${formatCad(product.basePrice)} - ${formatCad(Math.round(product.basePrice * 3.5))}` : `${formatCad(product.basePrice)} - ${formatCad(Math.round(product.basePrice * 2.2))}`;

                return (
                  <article key={product.id} className={`group overflow-hidden rounded-2xl border border-gray-200 bg-white transition-all duration-200 hover:shadow-lg ${view === "list" ? "flex" : ""}`}>
                    <Link href={href} className={`relative block bg-gray-100 ${view === "list" ? "h-44 w-52 flex-shrink-0" : "aspect-[4/3]"}`}>
                      {product.images[0]?.url ? (
                        <Image src={product.images[0].url} alt={product.name} fill className="object-cover transition-transform duration-300 group-hover:scale-105" sizes="(max-width: 1280px) 50vw, 25vw" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-gray-500">No image</div>
                      )}
                      {isOutOfStock && <span className="absolute left-2 top-2 rounded-full bg-red-600 px-2 py-1 text-[10px] font-semibold text-white">Out of stock</span>}
                    </Link>

                    <div className="flex flex-1 flex-col p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-gray-500">{CATEGORY_LABELS[product.category] || product.category}</p>
                      <h3 className="mt-2 text-base font-semibold text-gray-900">{product.name}</h3>
                      <p className="mt-1 text-sm text-gray-600">{rangeText}</p>
                      <p className="mt-1 text-xs text-gray-500">{product.pricingUnit === "per_sqft" ? "Per sqft pricing" : "Per piece pricing"}</p>

                      <div className="mt-4 flex gap-2">
                        <Link href={href} className="rounded-full border border-gray-300 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-gray-700 transition-colors hover:border-gray-900 hover:text-gray-900">
                          View
                        </Link>
                        <button onClick={() => quickAdd(product)} className="rounded-full bg-gray-900 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white transition-colors hover:bg-black">
                          Quick Add
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            {hasMore && (
              <div className="pt-2">
                <button onClick={() => setPage((p) => p + 1)} className="rounded-full border border-gray-300 px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-gray-700 hover:border-gray-900 hover:text-gray-900">
                  Load More
                </button>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
