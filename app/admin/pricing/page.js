"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
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

const TABS = [
  { id: "dashboard", label: "Dashboard", desc: "Overview of pricing health across all products" },
  { id: "products", label: "Products", desc: "All products with pricing health" },
  { id: "presets", label: "Presets", desc: "Pricing preset editor & bulk tools" },
  { id: "quote", label: "Quick Quote", desc: "Standalone cost calculator" },
  { id: "costs", label: "Costs", desc: "Cost entry & completeness tracking" },
  { id: "governance", label: "Governance", desc: "Approvals, B2B rules, vendor costs, change history" },
  { id: "ops", label: "Ops", desc: "Profit alerts and operational reminders" },
];

function PricingCenterInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeTab = searchParams.get("tab") || "products";

  function setTab(tab) {
    router.push(pricingCenterPath(tab), { scroll: false });
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#111]">Pricing Center</h1>
          <p className="mt-0.5 text-sm text-[#999]">
            Manage pricing across all products — cost visibility, profit analysis, floor enforcement
          </p>
        </div>
        <button
          onClick={() => router.push(pricingGovernancePath("changelog"), { scroll: false })}
          className="inline-flex items-center gap-2 rounded-[3px] border border-[#e0e0e0] bg-white px-4 py-2.5 text-sm font-medium text-[#666] transition-colors hover:border-black hover:text-black"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Change Log
        </button>
      </div>

      {/* Tab bar — scrollable on mobile for 7 tabs */}
      <div className="overflow-x-auto -mx-1 px-1">
        <div className="flex gap-0.5 border-b border-[#e0e0e0] min-w-max">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setTab(tab.id)}
              className={`relative whitespace-nowrap px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "text-[#111] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-black"
                  : "text-[#999] hover:text-[#666]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div>
        {activeTab === "dashboard" && <DashboardPanel />}
        {activeTab === "products" && <ProductsPanel />}
        {activeTab === "presets" && <PresetsPanel />}
        {activeTab === "quote" && <QuickQuotePanel />}
        {activeTab === "costs" && <CostEntryPanel />}
        {activeTab === "governance" && <GovernancePanel />}
        {activeTab === "ops" && <OpsPanel />}
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
