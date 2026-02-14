"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTranslation } from "@/lib/i18n/useTranslation";

const QUICK_PICKS = [
  { label: "Business Cards", href: "/shop/marketing-prints/business-cards", icon: "💳" },
  { label: "Stickers", href: "/shop/stickers-labels", icon: "✨" },
  { label: "Banners", href: "/shop/banners-displays", icon: "🏳️" },
  { label: "Signs", href: "/shop/rigid-signs", icon: "🪧" },
  { label: "Vehicle Decals", href: "/shop/vehicle-branding-advertising", icon: "🚐" },
  { label: "Stamps", href: "/shop/marketing-prints/stamps", icon: "🔖" },
];

const SCENARIOS = [
  { label: "Corporate", href: "/ideas/corporate", icon: "🏢" },
  { label: "Events", href: "/ideas/events", icon: "🎪" },
  { label: "Weddings", href: "/ideas/wedding", icon: "💍" },
  { label: "Trade Show", href: "/ideas/trade-show", icon: "🎪" },
  { label: "Fleet Setup", href: "/ideas/fleet-setup", icon: "🚛" },
  { label: "Opening Store", href: "/ideas/opening-store", icon: "🏪" },
  { label: "Campus", href: "/ideas/campus", icon: "🎓" },
  { label: "Gifting", href: "/ideas/gifting", icon: "🎁" },
];

export default function DualEntryHero({ totalCount }) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (query.length < 2) { setResults([]); setShowResults(false); return; }
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=5`);
        const data = await res.json();
        setResults(data.results || []);
        setShowResults(true);
      } catch { setResults([]); }
    }, 250);
    return () => clearTimeout(timerRef.current);
  }, [query]);

  useEffect(() => {
    function handleClick(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowResults(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const formatPrice = (cents) =>
    new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);

  return (
    <div className="bg-black text-white pt-16 pb-14 px-4 sm:px-6 relative overflow-hidden">
      {/* Subtle brand watermark */}
      <div className="absolute -right-20 -top-20 opacity-[0.03] pointer-events-none">
        <Image src="/logo-lunarprint.png" alt="" width={400} height={400} className="opacity-30" />
      </div>

      <div className="max-w-7xl mx-auto relative">
        {/* Headline */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase backdrop-blur-sm mb-4">
            <Image src="/logo-lunarprint.png" alt="" width={16} height={16} className="h-4 w-4" />
            {t("home.badge")}
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter">
            {t("home.headline")}
          </h1>
          <p className="text-gray-400 max-w-xl mx-auto mt-3 text-base sm:text-lg">
            {t("home.subheadline")}
          </p>
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 text-xs font-bold text-gray-300 mt-4">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            {t("home.productsAvailable", { count: totalCount })}
          </div>
        </div>

        {/* Dual cards */}
        <div className="grid md:grid-cols-2 gap-4 max-w-4xl mx-auto">
          {/* Left: I Know What I Need */}
          <div className="rounded-2xl bg-white/[0.07] backdrop-blur-sm border border-white/10 p-6">
            <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-gray-300 mb-1">
              I Know What I Need
            </h2>
            <p className="text-xs text-gray-500 mb-4">Search or pick a category</p>

            {/* Search */}
            <div className="relative" ref={searchRef}>
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => results.length > 0 && setShowResults(true)}
                placeholder={t("nav.searchPlaceholder")}
                className="w-full rounded-xl bg-white/10 border border-white/10 pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-gray-500 focus:bg-white/15 focus:border-white/20 focus:outline-none"
              />
              {showResults && results.length > 0 && (
                <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-xl bg-white shadow-2xl border border-gray-200 overflow-hidden">
                  {results.map((r) => (
                    <Link
                      key={r.id}
                      href={`/shop/${r.category}/${r.slug}`}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors"
                      onClick={() => setShowResults(false)}
                    >
                      {r.image ? (
                        <Image src={r.image} alt={r.imageAlt} width={32} height={32} className="h-8 w-8 rounded object-cover" />
                      ) : (
                        <div className="h-8 w-8 rounded bg-gray-100 flex items-center justify-center text-xs">🧩</div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{r.name}</p>
                        {r.price > 0 && <p className="text-xs text-gray-500">from {formatPrice(r.price)}</p>}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Quick picks */}
            <div className="mt-4 flex flex-wrap gap-1.5">
              {QUICK_PICKS.map((p) => (
                <Link
                  key={p.href}
                  href={p.href}
                  className="flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1.5 text-[11px] font-medium text-gray-300 transition-colors hover:bg-white/20 hover:text-white"
                >
                  <span>{p.icon}</span>
                  {p.label}
                </Link>
              ))}
            </div>

            <Link
              href="/shop"
              className="mt-4 inline-block text-xs font-semibold text-gray-400 underline underline-offset-4 hover:text-white transition-colors"
            >
              {t("home.cta.shop")} &rarr;
            </Link>
          </div>

          {/* Right: Help Me Find the Right Product */}
          <div className="rounded-2xl bg-white/[0.07] backdrop-blur-sm border border-white/10 p-6">
            <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-gray-300 mb-1">
              Help Me Find the Right Product
            </h2>
            <p className="text-xs text-gray-500 mb-4">Browse by scenario or get a custom quote</p>

            <div className="grid grid-cols-2 gap-1.5">
              {SCENARIOS.map((s) => (
                <Link
                  key={s.href}
                  href={s.href}
                  className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2.5 text-[12px] font-medium text-gray-300 transition-colors hover:bg-white/20 hover:text-white"
                >
                  <span className="text-base">{s.icon}</span>
                  {s.label}
                </Link>
              ))}
            </div>

            <div className="mt-4 flex gap-2">
              <Link
                href="/ideas"
                className="flex-1 flex items-center justify-center gap-1 rounded-full border border-white/20 px-4 py-2.5 text-xs font-semibold text-gray-300 transition-colors hover:border-white/40 hover:text-white"
              >
                {t("home.cta.shop")} &rarr;
              </Link>
              <Link
                href="/quote"
                className="flex-1 flex items-center justify-center gap-2 rounded-full bg-white px-4 py-2.5 text-xs font-bold uppercase tracking-[0.15em] text-black transition-colors hover:bg-gray-200"
              >
                {t("home.cta.quote")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
