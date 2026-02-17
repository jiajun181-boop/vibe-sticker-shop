"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/lib/i18n/useTranslation";

const ADMIN_PAGES = [
  { key: "admin.nav.dashboard", href: "/admin" },
  { key: "admin.nav.orders", href: "/admin/orders" },
  { key: "admin.nav.customers", href: "/admin/customers" },
  { key: "admin.nav.b2b", href: "/admin/b2b" },
  { key: "admin.nav.catalogOps", href: "/admin/catalog-ops" },
  { key: "admin.nav.production", href: "/admin/production" },
  { key: "admin.nav.factories", href: "/admin/factories" },
  { key: "admin.nav.qc", href: "/admin/qc" },
  { key: "admin.nav.analytics", href: "/admin/analytics" },
  { key: "admin.nav.funnel", href: "/admin/funnel" },
  { key: "admin.nav.coupons", href: "/admin/coupons" },
  { key: "admin.nav.media", href: "/admin/media" },
  { key: "admin.nav.users", href: "/admin/users" },
  { key: "admin.nav.activityLog", href: "/admin/logs" },
  { key: "admin.nav.settings", href: "/admin/settings" },
];

export default function CommandPalette() {
  const router = useRouter();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [apiResults, setApiResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const inputRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    function onKey(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape" && open) setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActive(0);
      setApiResults([]);
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [open]);

  const q = query.trim().toLowerCase();
  const pageResults = ADMIN_PAGES
    .filter((p) => !q || t(p.key).toLowerCase().includes(q) || p.href.includes(q))
    .slice(0, q ? 6 : 8)
    .map((p) => ({ type: "page", label: t(p.key), href: p.href }));

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (q.length < 2) { setApiResults([]); setSearching(false); return; }
    setSearching(true);
    timerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin/search?q=${encodeURIComponent(q)}`);
        if (res.ok) {
          const data = await res.json();
          setApiResults(data.results || []);
        }
      } catch { /* ignore */ }
      setSearching(false);
    }, 300);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [q]);

  const all = [...pageResults, ...apiResults];

  const handleSelect = useCallback(
    (r) => { setOpen(false); router.push(r.href); },
    [router],
  );

  function onKeyDown(e) {
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((i) => Math.min(i + 1, all.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); if (all[active]) handleSelect(all[active]); }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[18vh]">
      <button type="button" className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} aria-label="Close" />
      <div className="relative w-full max-w-lg rounded-[3px] border border-[#e0e0e0] bg-white shadow-2xl" role="dialog" aria-modal="true" aria-label="Command palette">
        <div className="flex items-center gap-3 border-b border-[#e0e0e0] px-4">
          <svg className="h-4 w-4 shrink-0 text-[#999]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setActive(0); }}
            onKeyDown={onKeyDown}
            placeholder={t("admin.search.placeholder")}
            className="w-full py-3.5 text-sm outline-none placeholder:text-[#999]"
          />
          <kbd className="shrink-0 rounded-[2px] border border-[#e0e0e0] px-1.5 py-0.5 text-[10px] font-mono text-[#999]">ESC</kbd>
        </div>
        <div className="max-h-72 overflow-y-auto p-2">
          {all.length === 0 && !searching && q && (
            <p className="py-8 text-center text-sm text-[#999]">{t("admin.search.noResults")}</p>
          )}
          {pageResults.length > 0 && (
            <div>
              <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#999]">{t("admin.search.pages")}</p>
              {pageResults.map((r, i) => (
                <button
                  key={r.href}
                  type="button"
                  onClick={() => handleSelect(r)}
                  onMouseEnter={() => setActive(i)}
                  className={`flex w-full items-center gap-3 rounded-[3px] px-3 py-2.5 text-left text-sm transition-colors ${active === i ? "bg-black text-white" : "text-black hover:bg-[#fafafa]"}`}
                >
                  <svg className={`h-3.5 w-3.5 shrink-0 ${active === i ? "text-[#999]" : "text-[#ccc]"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                  {r.label}
                </button>
              ))}
            </div>
          )}
          {apiResults.length > 0 && (
            <div className="mt-1">
              <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#999]">{t("admin.search.results")}</p>
              {apiResults.map((r, i) => {
                const idx = pageResults.length + i;
                return (
                  <button
                    key={`${r.type}-${r.href}`}
                    type="button"
                    onClick={() => handleSelect(r)}
                    onMouseEnter={() => setActive(idx)}
                    className={`flex w-full items-center gap-3 rounded-[3px] px-3 py-2.5 text-left text-sm transition-colors ${active === idx ? "bg-black text-white" : "text-black hover:bg-[#fafafa]"}`}
                  >
                    <span className={`shrink-0 rounded-[2px] px-1.5 py-0.5 text-[10px] font-semibold ${
                      r.type === "order"
                        ? active === idx ? "bg-blue-500/30 text-blue-200" : "bg-blue-100 text-blue-700"
                        : active === idx ? "bg-emerald-500/30 text-emerald-200" : "bg-emerald-100 text-emerald-700"
                    }`}>
                      {r.type === "order" ? "Order" : "Product"}
                    </span>
                    <span className="truncate">{r.label}</span>
                  </button>
                );
              })}
            </div>
          )}
          {searching && <p className="py-3 text-center text-xs text-[#999]">{t("admin.search.searching")}</p>}
        </div>
        <div className="flex items-center gap-4 border-t border-[#e0e0e0] px-4 py-2 text-[10px] text-[#999]">
          <span><kbd className="rounded-[2px] border border-[#e0e0e0] px-1 py-0.5 font-mono">↑↓</kbd> navigate</span>
          <span><kbd className="rounded-[2px] border border-[#e0e0e0] px-1 py-0.5 font-mono">↵</kbd> select</span>
          <span><kbd className="rounded-[2px] border border-[#e0e0e0] px-1 py-0.5 font-mono">esc</kbd> close</span>
        </div>
      </div>
    </div>
  );
}
