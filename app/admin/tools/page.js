"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/useTranslation";

const TOOLS = [
  {
    title: "Contour Tool",
    description: "Generate die-cut contours from artwork images",
    href: "/admin/tools/contour",
    toolType: "contour",
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
      </svg>
    ),
  },
  {
    title: "Proof Manager",
    description: "View and manage production proofs across all orders",
    href: "/admin/tools/proof",
    toolType: "proof",
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
  },
  {
    title: "Stamp Studio",
    description: "Design and preview stamps for production",
    href: "/admin/tools/stamp-studio",
    toolType: "stamp-studio",
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18.25 7.034l-.001.024" />
      </svg>
    ),
  },
  {
    title: "Pricing Dashboard",
    description: "View pricing models and formulas for all products",
    href: "/admin/pricing-dashboard",
    toolType: null,
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

export default function ToolsHubPage() {
  const { t } = useTranslation();
  const [jobCounts, setJobCounts] = useState({});

  useEffect(() => {
    async function fetchCounts() {
      try {
        const types = ["contour", "stamp-studio", "proof"];
        const counts = {};
        await Promise.all(
          types.map(async (type) => {
            const res = await fetch(`/api/admin/tools/jobs?toolType=${type}&limit=1`);
            if (res.ok) {
              const data = await res.json();
              counts[type] = data.pagination?.total || 0;
            }
          })
        );
        setJobCounts(counts);
      } catch { /* ignore */ }
    }
    fetchCounts();
  }, []);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-black">Production Tools</h1>
        <p className="mt-1 text-sm text-[#999]">Internal tools for pre-production and proofing workflows</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {TOOLS.map((tool) => (
          <Link
            key={tool.href}
            href={tool.href}
            className="group rounded-[3px] border border-[#e0e0e0] bg-white p-5 transition-all hover:border-black hover:shadow-sm"
          >
            <div className="flex items-start gap-4">
              <div className="shrink-0 rounded-[3px] bg-[#f5f5f5] p-2.5 text-[#666] transition-colors group-hover:bg-black group-hover:text-white">
                {tool.icon}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-black">{tool.title}</p>
                <p className="mt-0.5 text-xs text-[#777]">{tool.description}</p>
                {tool.toolType && jobCounts[tool.toolType] != null && (
                  <p className="mt-2 text-[10px] font-semibold uppercase tracking-wider text-[#999]">
                    {jobCounts[tool.toolType]} job{jobCounts[tool.toolType] !== 1 ? "s" : ""} recorded
                  </p>
                )}
              </div>
            </div>
            <div className="mt-3 flex items-center justify-end text-xs font-semibold text-[#999] transition-colors group-hover:text-black">
              Open tool &rarr;
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
