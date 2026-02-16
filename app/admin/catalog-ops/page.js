"use client";

import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ProductsPage from "@/app/admin/products/page";
import CatalogPage from "@/app/admin/catalog/page";
import PricingPage from "@/app/admin/pricing/page";

const TABS = [
  { key: "products", label: "All Products", href: "/admin/products" },
  { key: "catalog", label: "Catalog Settings", href: "/admin/catalog" },
  { key: "pricing", label: "Pricing", href: "/admin/pricing" },
];

export default function CatalogOpsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") || "products";

  const activeTab = useMemo(() => {
    return TABS.some((t) => t.key === tab) ? tab : "products";
  }, [tab]);

  function switchTab(next) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", next);
    router.replace(`/admin/catalog-ops?${params.toString()}`);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Catalog Ops</h1>
            <p className="mt-0.5 text-sm text-gray-500">
              Manage products, catalog structure, and pricing in one workspace.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => switchTab(t.key)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  activeTab === t.key
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-3 text-xs text-gray-500">Single workspace mode enabled.</div>
      </div>

      {activeTab === "products" && <ProductsPage embedded basePath="/admin/catalog-ops" />}
      {activeTab === "catalog" && <CatalogPage />}
      {activeTab === "pricing" && <PricingPage />}
    </div>
  );
}
