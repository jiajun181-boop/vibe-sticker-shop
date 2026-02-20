"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState, useEffect } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { getTurnaround, turnaroundI18nKey, turnaroundColor } from "@/lib/turnaroundConfig";
import { getProductImage, isSvgImage } from "@/lib/product-image";
import Breadcrumbs from "@/components/Breadcrumbs";
import QuickAddButton from "@/components/product/QuickAddButton";

const formatCad = (cents) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(
    cents / 100
  );

// Badge config per product slug
const PRODUCT_BADGES = {
  "real-estate-sign": { label: "Best Seller", color: "bg-orange-100 text-orange-700" },
  "yard-sign": { label: "Same Day Available", color: "bg-emerald-100 text-emerald-700" },
};

// Products that use "Add to Cart" instead of "Configure"
const SIMPLE_ADD_SLUGS = new Set(["h-stakes", "real-estate-frame"]);

function SignProductCard({ product, section, category }) {
  const { t } = useTranslation();
  const imageSrc = getProductImage(product, category);
  const price = product.fromPrice || product.basePrice;
  const tk = getTurnaround(product);
  const badge = PRODUCT_BADGES[product.slug];
  const isSimpleAdd = SIMPLE_ADD_SLUGS.has(product.slug);
  const href = `/shop/${category}/${product.slug}`;

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-[var(--color-gray-200)] bg-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
      <Link href={href} className="block">
        <div className="relative aspect-[4/3] overflow-hidden">
          {imageSrc ? (
            <Image
              src={imageSrc}
              alt={product.images?.[0]?.alt || product.name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              unoptimized={isSvgImage(imageSrc)}
            />
          ) : (
            <div className={`flex h-full w-full flex-col items-center justify-center bg-gradient-to-br ${section.noImageGradient}`}>
              <span className="text-4xl">{section.noImageIcon}</span>
              <p className="mt-2 px-3 text-center text-sm font-semibold text-white drop-shadow-sm">
                {product.name}
              </p>
            </div>
          )}
          {/* Badge overlay */}
          {badge && (
            <span className={`absolute top-2 left-2 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${badge.color}`}>
              {badge.label}
            </span>
          )}
        </div>
      </Link>
      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <span className={`inline-block w-fit rounded-full px-2 py-0.5 text-[10px] font-semibold mb-1.5 ${turnaroundColor(tk)}`}>
          {t(turnaroundI18nKey(tk))}
        </span>
        <h3 className="text-sm font-semibold text-[var(--color-gray-900)] leading-snug">
          {product.name}
        </h3>
        {product.description && (
          <p className="mt-1 text-[11px] text-[var(--color-gray-500)] line-clamp-2">
            {product.description}
          </p>
        )}
        <div className="mt-auto pt-3">
          {price > 0 && (
            <p className="text-sm font-bold text-[var(--color-gray-900)] mb-2">
              From {formatCad(price)}
            </p>
          )}
          <div className="flex items-center gap-2">
            {isSimpleAdd ? (
              <QuickAddButton product={product} />
            ) : null}
            <Link
              href={href}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--color-gray-900)] px-3.5 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-white transition-colors hover:bg-black"
            >
              {isSimpleAdd ? "Add to Cart" : "Configure"}
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function SignsCategoryClient({
  category,
  categoryTitle,
  sections,
  totalCount,
}) {
  const { t } = useTranslation();
  const sectionRefs = useRef({});
  const [activeSection, setActiveSection] = useState(sections[0]?.key || "");

  // IntersectionObserver for scroll-based active tab
  useEffect(() => {
    const observers = [];
    for (const section of sections) {
      const el = sectionRefs.current[section.key];
      if (!el) continue;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setActiveSection(section.key);
          }
        },
        { rootMargin: "-20% 0px -60% 0px" }
      );
      observer.observe(el);
      observers.push(observer);
    }
    return () => observers.forEach((o) => o.disconnect());
  }, [sections]);

  const scrollToSection = (key) => {
    const el = sectionRefs.current[key];
    if (el) {
      const offset = 120; // account for sticky header + tab bar
      const top = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: "smooth" });
    }
  };

  const allProducts = sections.flatMap((s) => s.products);

  return (
    <main className="bg-[var(--color-gray-50)] pb-20 pt-10 text-[var(--color-gray-900)]">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 2xl:px-4">
        <Breadcrumbs
          items={[
            { label: t("product.shop"), href: "/shop" },
            { label: categoryTitle },
          ]}
        />

        {/* Header */}
        <header className="mt-6">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
            {categoryTitle}
          </h1>
          {totalCount > 0 && totalCount <= 20 ? null : (
            <p className="mt-2 text-xs text-[var(--color-gray-400)]">
              {totalCount} {t("mp.landing.products")}
            </p>
          )}
        </header>

        {/* Filter tab bar */}
        <div className="sticky top-[var(--nav-offset,64px)] z-20 -mx-4 sm:-mx-6 2xl:-mx-4 mt-4 border-b border-[var(--color-gray-200)] bg-[var(--color-gray-50)]/95 backdrop-blur-sm px-4 sm:px-6 2xl:px-4">
          <div className="flex gap-1 overflow-x-auto scrollbar-hide py-2">
            {sections.map((section) => (
              <button
                key={section.key}
                onClick={() => scrollToSection(section.key)}
                className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
                  activeSection === section.key
                    ? "bg-[var(--color-gray-900)] text-white"
                    : "bg-white border border-[var(--color-gray-200)] text-[var(--color-gray-600)] hover:bg-[var(--color-gray-100)] hover:text-[var(--color-gray-800)]"
                }`}
              >
                {section.title}
              </button>
            ))}
          </div>
        </div>

        {/* Sections */}
        {sections.map((section) => (
          <section
            key={section.key}
            ref={(el) => { sectionRefs.current[section.key] = el; }}
            className="mt-10"
          >
            <div className="mb-4">
              <h2 className="text-xl font-semibold tracking-tight text-[var(--color-gray-900)]">
                {section.title}
              </h2>
              {section.description && (
                <p className="mt-1 text-sm text-[var(--color-gray-500)]">
                  {section.description}
                </p>
              )}
            </div>

            <div className="grid gap-3 grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
              {section.products.map((product) => (
                <SignProductCard
                  key={product.id}
                  product={product}
                  section={section}
                  category={category}
                />
              ))}
            </div>

            {/* Divider between sections (except last) */}
            {section !== sections[sections.length - 1] && (
              <hr className="mt-10 border-[var(--color-gray-200)]" />
            )}
          </section>
        ))}

        {allProducts.length === 0 && (
          <p className="mt-12 text-center text-sm text-[var(--color-gray-500)]">
            No products available yet.
          </p>
        )}

        {/* Back to shop */}
        <div className="mt-12 text-center">
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-gray-300)] px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-gray-600)] transition-colors hover:border-[var(--color-gray-900)] hover:text-[var(--color-gray-900)]"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            All Categories
          </Link>
        </div>

        {/* Info Footer — signs-specific */}
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-[var(--color-gray-200)] bg-white p-5">
            <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--color-gray-600)]">
              Made for Outdoors & Events
            </h3>
            <p className="mt-3 text-sm text-[var(--color-gray-700)]">
              Our Coroplast signs are weatherproof, UV resistant, and built
              to withstand Canadian weather for 2-3 years. Foam boards are
              lightweight and perfect for indoor events and presentations.
            </p>
          </div>

          <div className="rounded-2xl border border-[var(--color-gray-200)] bg-white p-5">
            <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--color-gray-600)]">
              Same Day Production
            </h3>
            <p className="mt-3 text-sm text-[var(--color-gray-700)]">
              Need signs urgently? We offer same day production for most
              Coroplast and foam board products. Order before 12pm for
              same day GTA pickup or next day delivery.
            </p>
          </div>

          <div className="rounded-2xl border border-[var(--color-gray-200)] bg-white p-5">
            <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--color-gray-600)]">
              Accessories Included
            </h3>
            <p className="mt-3 text-sm text-[var(--color-gray-700)]">
              Don&apos;t forget the hardware! Add H-Wire stakes, A-Frame stands,
              or metal sign frames to your order. Everything ships together
              so you&apos;re ready to install on arrival.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
