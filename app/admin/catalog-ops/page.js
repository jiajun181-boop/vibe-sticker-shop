"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import ProductsPage from "@/app/admin/products/page";
import CatalogPage from "@/app/admin/catalog/page";
import PricingPage from "@/app/admin/pricing/page";

const TABS = [
  { key: "products", label: "All Products", href: "/admin/products" },
  { key: "catalog", label: "Catalog Settings", href: "/admin/catalog" },
  { key: "pricing", label: "Pricing", href: "/admin/pricing" },
];
const CATEGORY_OPTIONS = [
  { value: "all", label: "All Categories" },
  { value: "marketing-business-print", label: "Marketing & Business Print" },
  { value: "stickers-labels-decals", label: "Stickers & Labels" },
  { value: "signs-rigid-boards", label: "Signs & Rigid Boards" },
  { value: "banners-displays", label: "Banners & Displays" },
  { value: "windows-walls-floors", label: "Windows/Walls/Floors Decals" },
  { value: "vehicle-graphics-fleet", label: "Vehicle & Fleet Graphics" },
];

export default function CatalogOpsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") || "products";
  const [workspaceSearch, setWorkspaceSearch] = useState(searchParams.get("search") || "");
  const [workspaceCategory, setWorkspaceCategory] = useState(searchParams.get("category") || "all");
  const [stats, setStats] = useState({ products: null, categories: null, presets: null });
  const [statsLoading, setStatsLoading] = useState(false);

  const activeTab = useMemo(() => {
    return TABS.some((t) => t.key === tab) ? tab : "products";
  }, [tab]);

  useEffect(() => {
    setWorkspaceSearch(searchParams.get("search") || "");
    setWorkspaceCategory(searchParams.get("category") || "all");
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;
    async function loadStats() {
      setStatsLoading(true);
      try {
        const [productsRes, catalogRes, pricingRes] = await Promise.all([
          fetch("/api/admin/products?page=1&limit=1"),
          fetch("/api/admin/catalog"),
          fetch("/api/admin/pricing"),
        ]);
        const [productsData, catalogData, pricingData] = await Promise.all([
          productsRes.json(),
          catalogRes.json(),
          pricingRes.json(),
        ]);
        if (cancelled) return;
        setStats({
          products: productsData?.pagination?.total ?? null,
          categories: Array.isArray(catalogData?.categories) ? catalogData.categories.length : null,
          presets: Array.isArray(pricingData) ? pricingData.length : null,
        });
      } catch {
        if (!cancelled) {
          setStats({ products: null, categories: null, presets: null });
        }
      } finally {
        if (!cancelled) setStatsLoading(false);
      }
    }
    loadStats();
    return () => {
      cancelled = true;
    };
  }, []);

  function switchTab(next) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", next);
    router.replace(`/admin/catalog-ops?${params.toString()}`);
  }

  function updateWorkspaceFilters() {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", "products");
    if (workspaceSearch.trim()) params.set("search", workspaceSearch.trim());
    else params.delete("search");
    if (workspaceCategory && workspaceCategory !== "all") params.set("category", workspaceCategory);
    else params.delete("category");
    params.set("page", "1");
    router.replace(`/admin/catalog-ops?${params.toString()}`);
  }

  function clearWorkspaceFilters() {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", "products");
    params.delete("search");
    params.delete("category");
    params.set("page", "1");
    router.replace(`/admin/catalog-ops?${params.toString()}`);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-[3px] border border-[#e0e0e0] bg-white p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-black">Catalog Ops</h1>
            <p className="mt-0.5 text-sm text-[#999]">
              Manage products, catalog structure, and pricing in one workspace.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => switchTab(t.key)}
                className={`rounded-[3px] px-3 py-1.5 text-xs font-medium transition-colors ${
                  activeTab === t.key
                    ? "bg-black text-white"
                    : "bg-[#f5f5f5] text-black hover:bg-[#fafafa]"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-3 text-xs text-[#999]">Single workspace mode enabled.</div>
        <div className="mt-3 grid gap-2 rounded-[3px] border border-[#e0e0e0] bg-[#fafafa] p-3 lg:grid-cols-[1fr_auto_auto_auto]">
          <input
            type="text"
            value={workspaceSearch}
            onChange={(e) => setWorkspaceSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") updateWorkspaceFilters();
            }}
            placeholder="Quick search products..."
            className="rounded-[3px] border border-[#d0d0d0] bg-white px-3 py-2 text-sm outline-none focus:border-black"
          />
          <select
            value={workspaceCategory}
            onChange={(e) => setWorkspaceCategory(e.target.value)}
            className="rounded-[3px] border border-[#d0d0d0] bg-white px-3 py-2 text-sm outline-none focus:border-black"
          >
            {CATEGORY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={updateWorkspaceFilters}
            className="rounded-[3px] bg-black px-4 py-2 text-xs font-semibold text-white hover:bg-[#222]"
          >
            Apply
          </button>
          <button
            type="button"
            onClick={clearWorkspaceFilters}
            className="rounded-[3px] border border-[#d0d0d0] bg-white px-4 py-2 text-xs font-semibold text-black hover:bg-[#f5f5f5]"
          >
            Reset
          </button>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-[2px] border border-[#e0e0e0] bg-white px-2.5 py-1 text-[#666]">
            Products:{" "}
            <span className="font-semibold text-black">
              {statsLoading ? "..." : stats.products ?? "-"}
            </span>
          </span>
          <span className="rounded-[2px] border border-[#e0e0e0] bg-white px-2.5 py-1 text-[#666]">
            Categories:{" "}
            <span className="font-semibold text-black">
              {statsLoading ? "..." : stats.categories ?? "-"}
            </span>
          </span>
          <span className="rounded-[2px] border border-[#e0e0e0] bg-white px-2.5 py-1 text-[#666]">
            Pricing Presets:{" "}
            <span className="font-semibold text-black">
              {statsLoading ? "..." : stats.presets ?? "-"}
            </span>
          </span>
          <span className="ml-auto text-[#999]">
            Focus mode:{" "}
            <Link href="/admin/products" className="text-black underline hover:no-underline">Products</Link>{" "}
            ·{" "}
            <Link href="/admin/catalog" className="text-black underline hover:no-underline">Catalog</Link>{" "}
            ·{" "}
            <Link href="/admin/pricing" className="text-black underline hover:no-underline">Pricing</Link>
          </span>
        </div>
      </div>

      {activeTab === "products" && <ProductsPage embedded basePath="/admin/catalog-ops" />}
      {activeTab === "catalog" && <CatalogPage embedded />}
      {activeTab === "pricing" && <PricingPage embedded />}
    </div>
  );
}

