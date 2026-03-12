"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { getAllowedNavHrefs } from "@/lib/admin-permissions";
import { flattenAdminNavigation, getAdminNavigation } from "@/lib/admin-navigation";

export default function CommandPalette() {
  const router = useRouter();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [apiResults, setApiResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [sessionRole, setSessionRole] = useState(null);
  const inputRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    fetch("/api/admin/session")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user?.role) {
          setSessionRole(data.user.role);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    function onKey(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((value) => !value);
      }
      if (e.key === "Escape" && open) setOpen(false);
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setActive(0);
    setApiResults([]);
    setTimeout(() => inputRef.current?.focus(), 60);
  }, [open]);

  const q = query.trim().toLowerCase();
  const allowedHrefs = sessionRole ? getAllowedNavHrefs(sessionRole) : null;
  const adminPages = flattenAdminNavigation(getAdminNavigation(sessionRole || "admin", allowedHrefs));
  const pageResults = adminPages
    .filter((page) => !q || t(page.key).toLowerCase().includes(q) || page.href.includes(q))
    .slice(0, q ? 6 : 8)
    .map((page) => ({ type: "page", label: t(page.key), href: page.href }));

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (q.length < 2) {
      setApiResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    timerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin/search?q=${encodeURIComponent(q)}`);
        if (res.ok) {
          const data = await res.json();
          setApiResults(data.results || []);
        }
      } catch {
        // ignore network noise in palette
      }
      setSearching(false);
    }, 300);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [q]);

  const all = [...pageResults, ...apiResults];

  const handleSelect = useCallback(
    (result) => {
      setOpen(false);
      router.push(result.href);
    },
    [router]
  );

  function onKeyDown(e) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((index) => Math.min(index + 1, all.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((index) => Math.max(index - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (all[active]) handleSelect(all[active]);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center px-4 pt-[18vh]">
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => setOpen(false)}
        aria-label={t("admin.search.close")}
      />
      <div
        className="relative w-full max-w-lg rounded-[3px] border border-[#e0e0e0] bg-white shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-label={t("admin.search.hint")}
      >
        <div className="flex items-center gap-3 border-b border-[#e0e0e0] px-4">
          <svg className="h-4 w-4 shrink-0 text-[#999]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
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
              {pageResults.map((result, index) => (
                <button
                  key={result.href}
                  type="button"
                  onClick={() => handleSelect(result)}
                  onMouseEnter={() => setActive(index)}
                  className={`flex w-full items-center gap-3 rounded-[3px] px-3 py-2.5 text-left text-sm transition-colors ${
                    active === index ? "bg-black text-[#fff]" : "text-black hover:bg-[#fafafa]"
                  }`}
                >
                  <svg
                    className={`h-3.5 w-3.5 shrink-0 ${active === index ? "text-[#999]" : "text-[#ccc]"}`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                  {result.label}
                </button>
              ))}
            </div>
          )}

          {apiResults.length > 0 && (
            <div className="mt-1">
              <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#999]">{t("admin.search.results")}</p>
              {apiResults.map((result, index) => {
                const absoluteIndex = pageResults.length + index;
                return (
                  <button
                    key={`${result.type}-${result.href}`}
                    type="button"
                    onClick={() => handleSelect(result)}
                    onMouseEnter={() => setActive(absoluteIndex)}
                    className={`flex w-full items-center gap-3 rounded-[3px] px-3 py-2.5 text-left text-sm transition-colors ${
                      active === absoluteIndex ? "bg-black text-[#fff]" : "text-black hover:bg-[#fafafa]"
                    }`}
                  >
                    <span
                      className={`shrink-0 rounded-[2px] px-1.5 py-0.5 text-[10px] font-semibold ${
                        result.type === "order"
                          ? active === absoluteIndex
                            ? "bg-blue-500/30 text-blue-200"
                            : "bg-blue-100 text-blue-700"
                          : active === absoluteIndex
                            ? "bg-emerald-500/30 text-emerald-200"
                            : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {result.type === "order" ? t("admin.search.resultOrder") : t("admin.search.resultProduct")}
                    </span>
                    <span className="truncate">{result.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {searching && <p className="py-3 text-center text-xs text-[#999]">{t("admin.search.searching")}</p>}
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t border-[#e0e0e0] px-4 py-2 text-[10px] text-[#999]">
          <span>
            <kbd className="rounded-[2px] border border-[#e0e0e0] px-1 py-0.5 font-mono">↑↓</kbd> {t("admin.search.navigate")}
          </span>
          <span>
            <kbd className="rounded-[2px] border border-[#e0e0e0] px-1 py-0.5 font-mono">↵</kbd> {t("admin.search.select")}
          </span>
          <span>
            <kbd className="rounded-[2px] border border-[#e0e0e0] px-1 py-0.5 font-mono">esc</kbd> {t("admin.search.close")}
          </span>
        </div>
      </div>
    </div>
  );
}
