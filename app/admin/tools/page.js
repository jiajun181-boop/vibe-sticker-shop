"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { timeAgo } from "@/lib/admin/time-ago";
import StatusBadge from "@/components/admin/StatusBadge";

const TOOLS = [
  {
    titleKey: "admin.tools.contourTitle",
    descKey: "admin.tools.contourDesc",
    href: "/admin/tools/contour",
    toolType: "contour",
    actions: ["admin.tools.contourAction"],
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5z" />
      </svg>
    ),
  },
  {
    titleKey: "admin.tools.proofTitle",
    descKey: "admin.tools.proofDesc",
    href: "/admin/tools/proof",
    toolType: "proof",
    actions: ["admin.tools.proofAction", "admin.tools.proofActionStandalone"],
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
  },
  {
    titleKey: "admin.tools.stampTitle",
    descKey: "admin.tools.stampDesc",
    href: "/admin/tools/stamp-studio",
    toolType: "stamp-studio",
    actions: ["admin.tools.stampAction"],
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18.25 7.034l-.001.024" />
      </svg>
    ),
  },
  {
    titleKey: "admin.tools.pricingTitle",
    descKey: "admin.tools.pricingDesc",
    href: "/admin/pricing-dashboard",
    toolType: null,
    actions: [],
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
  const [recentJobs, setRecentJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch counts for each tool type + recent jobs in parallel
        const types = ["contour", "stamp-studio", "proof"];
        const [countsData, recentData] = await Promise.all([
          Promise.all(
            types.map(async (type) => {
              const res = await fetch(`/api/admin/tools/jobs?toolType=${type}&limit=1`);
              if (res.ok) {
                const data = await res.json();
                return [type, data.pagination?.total || 0];
              }
              return [type, 0];
            })
          ),
          fetch("/api/admin/tools/jobs?limit=10").then((r) => r.ok ? r.json() : { jobs: [] }),
        ]);

        const counts = {};
        for (const [type, count] of countsData) {
          counts[type] = count;
        }
        setJobCounts(counts);
        setRecentJobs(recentData.jobs || []);
      } catch { /* ignore */ }
      setLoadingJobs(false);
    }
    fetchData();
  }, []);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-black">{t("admin.tools.hubTitle")}</h1>
        <p className="mt-1 text-sm text-[#999]">{t("admin.tools.hubSubtitle")}</p>
      </div>

      {/* Tool Cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {TOOLS.map((tool) => (
          <div
            key={tool.href}
            className="rounded-[3px] border border-[#e0e0e0] bg-white p-5"
          >
            <div className="flex items-start gap-4">
              <div className="shrink-0 rounded-[3px] bg-[#f5f5f5] p-2.5 text-[#666]">
                {tool.icon}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-black">{t(tool.titleKey)}</p>
                <p className="mt-0.5 text-xs text-[#777]">{t(tool.descKey)}</p>
                {tool.toolType && jobCounts[tool.toolType] != null && (
                  <p className="mt-2 text-[10px] font-semibold uppercase tracking-wider text-[#999]">
                    {jobCounts[tool.toolType]} {t("admin.tools.jobsRecorded")}
                  </p>
                )}
                {/* Last job for this tool — task continuation hint */}
                {tool.toolType && (() => {
                  const lastJob = recentJobs.find((j) => j.toolType === tool.toolType);
                  if (!lastJob) return null;
                  return (
                    <p className="mt-1 text-[10px] text-[#bbb]">
                      {t("admin.tools.lastJob")}: {lastJob.operatorName || "—"} · {timeAgo(lastJob.createdAt, t)}
                    </p>
                  );
                })()}
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href={tool.href}
                className="inline-flex items-center gap-1.5 rounded-[3px] bg-black px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#333]"
              >
                {t("admin.tools.openTool")}
                <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
              {tool.actions.map((actionKey) => (
                <Link
                  key={actionKey}
                  href={tool.href}
                  className="inline-flex items-center gap-1 rounded-[3px] border border-[#e0e0e0] px-3 py-1.5 text-xs font-medium text-[#666] transition-colors hover:border-black hover:text-black"
                >
                  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  {t(actionKey)}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Recent Jobs Across All Tools */}
      <div className="rounded-[3px] border border-[#e0e0e0] bg-white">
        <div className="flex items-center justify-between border-b border-[#e0e0e0] px-5 py-4">
          <h2 className="text-sm font-bold text-black">{t("admin.tools.recentActivity")}</h2>
        </div>
        {loadingJobs ? (
          <div className="space-y-2 p-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-10 animate-pulse rounded-[3px] bg-[#f0f0f0]" />
            ))}
          </div>
        ) : recentJobs.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-[#999]">{t("admin.tools.noRecentJobs")}</div>
        ) : (
          <div className="divide-y divide-[#ececec]">
            {recentJobs.map((job) => {
              const toolHrefs = { contour: "/admin/tools/contour", "stamp-studio": "/admin/tools/stamp-studio", proof: "/admin/tools/proof" };
              const href = job.orderId ? `/admin/orders/${job.orderId}` : toolHrefs[job.toolType] || "/admin/tools";
              return (
                <div key={job.id} className="flex items-center justify-between px-5 py-3">
                  <Link href={href} className="flex items-center gap-3 min-w-0 flex-1 transition-colors hover:text-[#4f46e5]">
                    <span className="inline-block rounded-full bg-[#f0f0f0] px-2 py-0.5 text-[10px] font-semibold uppercase text-[#666]">
                      {job.toolType}
                    </span>
                    <span className="text-sm text-[#111] truncate">{job.operatorName || "—"}</span>
                    <StatusBadge status={job.status} t={t} />
                    <span className="text-xs text-[#999]">{timeAgo(job.createdAt, t)}</span>
                  </Link>
                  {job.outputFileUrl && (
                    <a
                      href={job.outputFileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-[3px] text-[#999] transition-colors hover:bg-[#f0f0f0] hover:text-[#111]"
                      title="Download"
                    >
                      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                      </svg>
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
