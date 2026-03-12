"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { pricingCenterPath, pricingGovernancePath } from "@/lib/admin/pricing-routes";
// Lazy-load tab panels to avoid 50KB+ presets panel blocking initial render
const DashboardPanel = dynamic(() => import("./DashboardPanel"), {
  loading: () => <PanelSkeleton />,
});
const ProductsPanel = dynamic(() => import("./ProductsPanel"), {
  loading: () => <PanelSkeleton />,
});
const PresetsPanel = dynamic(() => import("./PresetsPanel"), {
  loading: () => <PanelSkeleton />,
});
const QuickQuotePanel = dynamic(() => import("./QuickQuotePanel"), {
  loading: () => <PanelSkeleton />,
});
const CostEntryPanel = dynamic(() => import("./CostEntryPanel"), {
  loading: () => <PanelSkeleton />,
});
const GovernancePanel = dynamic(() => import("./GovernancePanel"), {
  loading: () => <PanelSkeleton />,
});
const OpsPanel = dynamic(() => import("./OpsPanel"), {
  loading: () => <PanelSkeleton />,
});

const TAB_IDS = ["dashboard", "products", "presets", "quote", "costs", "governance", "ops"];
const TAB_LABEL_KEYS = {
  dashboard: "admin.pc.tabDashboard",
  products: "admin.pc.tabProducts",
  presets: "admin.pc.tabPresets",
  quote: "admin.pc.tabQuote",
  costs: "admin.pc.tabCosts",
  governance: "admin.pc.tabGovernance",
  ops: "admin.pc.tabOps",
};
const TAB_DESC_KEYS = {
  dashboard: "admin.pc.descDashboard",
  products: "admin.pc.descProducts",
  presets: "admin.pc.descPresets",
  quote: "admin.pc.descQuote",
  costs: "admin.pc.descCosts",
  governance: "admin.pc.descGovernance",
  ops: "admin.pc.descOps",
};

/** Derive a human-readable label from a returnTo URL path. */
function getReturnToLabel(returnTo, t) {
  if (!returnTo) return "";
  try {
    const path = new URL(returnTo, "http://x").pathname;
    if (path.startsWith("/admin/orders")) return t("admin.pc.backToOrder");
    if (path.startsWith("/admin/production")) return t("admin.pc.backToProduction");
    if (path.startsWith("/admin/workstation")) return t("admin.pc.backToWorkstation");
    if (path.startsWith("/admin/quotes")) return t("admin.pc.backToQuotes");
    return path;
  } catch {
    return returnTo;
  }
}

function PricingCenterInner() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeTab = searchParams.get("tab") || "dashboard";
  const returnTo = searchParams.get("returnTo") || "";

  function setTab(tab) {
    router.push(pricingCenterPath(tab), { scroll: false });
  }

  const returnToLabel = getReturnToLabel(returnTo, t);

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      {/* Return-to banner */}
      {returnTo && (
        <Link
          href={returnTo}
          className="flex items-center gap-1.5 text-xs text-[#999] hover:text-[#111] transition-colors"
        >
          &larr; {t("admin.pc.backTo")} {returnToLabel}
        </Link>
      )}

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#111]">{t("admin.pc.title")}</h1>
          <p className="mt-0.5 text-sm text-[#999]">
            {t("admin.pc.subtitle")}
          </p>
        </div>
        <button
          onClick={() => router.push(pricingGovernancePath("changelog"), { scroll: false })}
          className="inline-flex items-center gap-2 rounded-[3px] border border-[#e0e0e0] bg-white px-4 py-2.5 text-sm font-medium text-[#666] transition-colors hover:border-black hover:text-black"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {t("admin.pc.changeLog")}
        </button>
      </div>

      {/* Tab bar — scrollable on mobile for 7 tabs */}
      <div className="overflow-x-auto -mx-1 px-1">
        <div className="flex gap-0.5 border-b border-[#e0e0e0] min-w-max">
          {TAB_IDS.map(id => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`relative whitespace-nowrap px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === id
                  ? "text-[#111] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-black"
                  : "text-[#999] hover:text-[#666]"
              }`}
            >
              {t(TAB_LABEL_KEYS[id])}
            </button>
          ))}
        </div>
      </div>

      {/* Active tab context */}
      <p className="text-xs text-[#999] -mt-3">{t(TAB_DESC_KEYS[activeTab])}</p>

      {/* Tab content */}
      <div>
        {activeTab === "dashboard" && <DashboardPanel returnTo={returnTo} />}
        {activeTab === "products" && <ProductsPanel />}
        {activeTab === "presets" && <PresetsPanel />}
        {activeTab === "quote" && <QuickQuotePanel />}
        {activeTab === "costs" && <CostEntryPanel returnTo={returnTo} />}
        {activeTab === "governance" && <GovernancePanel returnTo={returnTo} />}
        {activeTab === "ops" && <OpsPanel returnTo={returnTo} />}
      </div>
    </div>
  );
}

function PanelSkeleton() {
  return (
    <div className="space-y-3 py-8">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-12 animate-pulse rounded-[3px] bg-[#f0f0f0]" />
      ))}
    </div>
  );
}

export default function PricingCenterPage() {
  return (
    <Suspense fallback={<PanelSkeleton />}>
      <PricingCenterInner />
    </Suspense>
  );
}
