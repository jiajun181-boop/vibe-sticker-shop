"use client";

import Link from "next/link";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { assessOrder, getExecutableAction, READINESS, READINESS_COLORS, READINESS_LABEL_KEYS } from "@/lib/admin/production-readiness";

/**
 * Unified order readiness summary banner.
 *
 * Replaces ProductionIssuesCard, UnifiedReadinessBanner, and NextActionBanner
 * with a single component that uses assessOrder() as its only source of truth.
 */
export default function OrderReadinessSummary({ order }) {
  const { t } = useTranslation();

  // Don't show for terminal states
  if (order.productionStatus === "shipped" || order.productionStatus === "completed") return null;

  const assessment = assessOrder(order);
  const colors = READINESS_COLORS[assessment.level] || READINESS_COLORS.ready;
  const levelLabel = t(READINESS_LABEL_KEYS[assessment.level] || "admin.readiness.ready");

  // All-green state
  if (assessment.level === READINESS.READY || assessment.level === READINESS.DONE) {
    return (
      <div className={`flex items-center gap-2 rounded-[3px] border ${colors.border} ${colors.bg} px-4 py-3`}>
        <span className={`inline-block h-2.5 w-2.5 rounded-full ${colors.dot}`} />
        <span className={`text-xs font-bold ${colors.text}`}>{levelLabel}</span>
        <span className="ml-1 text-[10px] text-[#666]">
          {assessment.items.length} item{assessment.items.length !== 1 ? "s" : ""} ready
        </span>
      </div>
    );
  }

  // In-progress state
  if (assessment.level === READINESS.IN_PROGRESS) {
    return (
      <div className={`flex items-center gap-2 rounded-[3px] border ${colors.border} ${colors.bg} px-4 py-3`}>
        <span className={`inline-block h-2.5 w-2.5 rounded-full ${colors.dot}`} />
        <span className={`text-xs font-bold ${colors.text}`}>{levelLabel}</span>
      </div>
    );
  }

  // Find the most urgent executable action across all items
  const itemActions = assessment.items.map((itemAssessment, idx) => {
    const item = (order.items || [])[idx];
    if (!item) return null;
    const ea = getExecutableAction(itemAssessment, order.id, item.id);
    return ea ? { item, itemAssessment, execAction: ea } : null;
  }).filter(Boolean);

  // Sort: blockers first
  itemActions.sort((a, b) => {
    if (a.execAction.severity === "blocker" && b.execAction.severity !== "blocker") return -1;
    if (a.execAction.severity !== "blocker" && b.execAction.severity === "blocker") return 1;
    return 0;
  });

  const primaryAction = itemActions[0]?.execAction || null;

  return (
    <div className={`rounded-[3px] border ${colors.border} ${colors.bg} px-4 py-3 space-y-2`}>
      {/* Summary line */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${colors.dot}`} />
          <span className={`text-xs font-bold ${colors.text}`}>{levelLabel}</span>
          <span className="text-[10px] text-[#666]">
            {assessment.blockerCount > 0 && `${assessment.blockerCount} blocked`}
            {assessment.blockerCount > 0 && assessment.warningCount > 0 && ", "}
            {assessment.warningCount > 0 && `${assessment.warningCount} warning${assessment.warningCount > 1 ? "s" : ""}`}
            {(assessment.blockerCount > 0 || assessment.warningCount > 0) && " / "}
            {assessment.readyCount} ready
          </span>
        </div>
        {primaryAction?.toolLink && (
          <Link
            href={primaryAction.toolLink}
            className="shrink-0 rounded-[3px] bg-black px-3 py-1.5 text-[10px] font-bold text-white hover:bg-[#222]"
          >
            {primaryAction.action}
          </Link>
        )}
      </div>

      {/* Per-item strips for items with issues */}
      {itemActions.length > 0 && (
        <div className="space-y-1">
          {itemActions.map(({ item, execAction }) => (
            <div key={item.id} className="flex items-center gap-2 text-[10px]">
              <span className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${
                execAction.severity === "blocker" ? "bg-red-500" : "bg-amber-400"
              }`} />
              <Link
                href={`#item-${item.id}`}
                className="font-medium text-[#111] hover:underline truncate max-w-[180px]"
              >
                {item.productName}
              </Link>
              <span className={`truncate ${
                execAction.severity === "blocker" ? "text-red-700" : "text-amber-700"
              }`}>
                {execAction.action}
              </span>
              {execAction.totalIssueCount > 1 && (
                <span className="text-[#999] shrink-0">(+{execAction.totalIssueCount - 1})</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
