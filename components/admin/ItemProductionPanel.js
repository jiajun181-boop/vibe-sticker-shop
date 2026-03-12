"use client";

import Link from "next/link";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { assessItem, assessPackage, getExecutableAction, READINESS, READINESS_COLORS, READINESS_LABEL_KEYS } from "@/lib/admin/production-readiness";
import { detectProductFamily, buildSpecsSummary } from "@/lib/preflight";
import { hasArtworkUrl, getArtworkStatus } from "@/lib/artwork-detection";

const FAMILY_LABELS = {
  "sticker": "Sticker", "label": "Label", "stamp": "Stamp", "canvas": "Canvas",
  "banner": "Banner / Flag", "sign": "Sign / Display", "booklet": "Booklet",
  "ncr": "NCR Form", "business-card": "Business Card", "vehicle": "Vehicle Graphics",
  "standard-print": "Print", "other": "Custom",
};

/**
 * Single component rendering ALL readiness info for one order item.
 *
 * @param {{ item: object, orderId: string, compact?: boolean }} props
 * - compact: minimal view for workstation (readiness dot + name + worst issue + action button)
 * - full (default): complete readiness info with specs, badges, issues, and actions
 */
export default function ItemProductionPanel({ item, orderId, compact = false }) {
  const { t } = useTranslation();
  const assessment = assessItem(item, orderId);
  const execAction = getExecutableAction(assessment, orderId, item.id);
  const colors = READINESS_COLORS[assessment.level] || READINESS_COLORS.ready;
  const readinessLabel = t(READINESS_LABEL_KEYS[assessment.level] || "admin.readiness.ready");

  if (compact) {
    return <CompactView item={item} assessment={assessment} execAction={execAction} colors={colors} readinessLabel={readinessLabel} orderId={orderId} t={t} />;
  }

  return <FullView item={item} assessment={assessment} execAction={execAction} colors={colors} readinessLabel={readinessLabel} orderId={orderId} t={t} />;
}

// ── Compact view (workstation) ─────────────────────────────────────────────

function CompactView({ item, assessment, execAction, colors, readinessLabel, orderId, t }) {
  const worstReason = assessment.reasons.find((r) => r.severity === "blocker") || assessment.reasons.find((r) => r.severity === "warning") || assessment.reasons[0];

  return (
    <div className="flex items-center gap-2 py-1.5 px-2 rounded-[3px] bg-[#fafafa] border border-[#ececec]">
      <span className={`inline-block h-2 w-2 shrink-0 rounded-full ${colors.dot}`} title={readinessLabel} />
      <span className="text-xs font-medium text-[#111] truncate min-w-0 flex-1">{item.productName}</span>
      {assessment.isPrintAndCut && (
        <span className="rounded bg-indigo-100 px-1.5 py-0.5 text-[8px] font-bold text-indigo-700 shrink-0">
          {t("admin.readiness.printAndCut")}
        </span>
      )}
      {assessment.manualReviewRequired && (
        <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[8px] font-bold text-amber-700 shrink-0">
          {t("admin.readiness.manualReview")}
        </span>
      )}
      {worstReason && (
        <span className={`text-[10px] truncate max-w-[200px] ${
          worstReason.severity === "blocker" ? "text-red-700" : "text-amber-700"
        }`}>
          {worstReason.message}
        </span>
      )}
      {execAction?.toolLink && (
        <Link
          href={execAction.toolLink}
          className="shrink-0 inline-flex items-center gap-1 rounded-[3px] bg-black px-2 py-1 text-[9px] font-semibold text-white hover:bg-[#222]"
        >
          {execAction.action.split(" ").slice(0, 3).join(" ")}
          <svg className="h-2.5 w-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
        </Link>
      )}
      {execAction && !execAction.toolLink && (
        <span className="shrink-0 text-[9px] font-medium text-amber-700 truncate max-w-[180px]">
          {execAction.action}
        </span>
      )}
    </div>
  );
}

// ── Full view (order detail page) ──────────────────────────────────────────

function FullView({ item, assessment, execAction, colors, readinessLabel, orderId, t }) {
  const meta = {
    ...(item.specsJson && typeof item.specsJson === "object" ? item.specsJson : {}),
    ...(item.meta && typeof item.meta === "object" ? item.meta : {}),
  };
  const family = assessment.family;

  // Artwork status
  const hasRealUrl = hasArtworkUrl(item);
  const artStatus = getArtworkStatus(item);

  // Key specs
  const materialLabel = item.material || meta.material || meta.stock || meta.labelType || null;
  const finishLabel = item.finishing || meta.finishing || meta.finish || meta.finishName || null;
  const sizeLabel = item.widthIn && item.heightIn
    ? `${item.widthIn}" x ${item.heightIn}"`
    : meta.sizeLabel || null;
  const fmtSpec = (s) => s ? s.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "";

  return (
    <div className="space-y-2">
      {/* Row 1: readiness dot + product name + family badge + print-and-cut badge */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`inline-block h-2 w-2 shrink-0 rounded-full ${colors.dot}`} title={readinessLabel} />
        <p className="text-sm font-medium text-black">{item.productName}</p>
        <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[9px] font-bold text-gray-500">
          {FAMILY_LABELS[family] || family}
        </span>
        {assessment.isPrintAndCut && (
          <span className="rounded bg-indigo-100 px-1.5 py-0.5 text-[9px] font-bold text-indigo-700">
            {t("admin.readiness.printAndCut")}
          </span>
        )}
      </div>

      {/* Row 2: key specs */}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-[#555]">
        <span className="font-semibold">{item.quantity}x</span>
        {sizeLabel && (<><span className="text-[#bbb]">/</span><span>{sizeLabel}</span></>)}
        {materialLabel && (<><span className="text-[#bbb]">/</span><span className="font-medium">{fmtSpec(materialLabel)}</span></>)}
        {finishLabel && finishLabel !== "none" && (<><span className="text-[#bbb]">/</span><span>{fmtSpec(finishLabel)}</span></>)}
      </div>

      {/* Row 3: status badges */}
      <div className="flex flex-wrap gap-1.5">
        {/* Artwork status */}
        {hasRealUrl ? (
          <span className="rounded bg-green-50 px-1.5 py-0.5 text-[9px] font-medium text-green-700">Artwork: Uploaded</span>
        ) : artStatus === "provided" ? (
          <span className="rounded bg-cyan-100 px-1.5 py-0.5 text-[9px] font-bold text-cyan-700">Artwork: Provided (off-platform)</span>
        ) : artStatus === "file-name-only" ? (
          <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-700">Artwork: URL Missing</span>
        ) : artStatus === "upload-later" ? (
          <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-700">Artwork: Upload Pending</span>
        ) : artStatus === "design-help" ? (
          <span className="rounded bg-indigo-100 px-1.5 py-0.5 text-[9px] font-bold text-indigo-700">Artwork: Design Help ($45)</span>
        ) : (
          <span className="rounded bg-red-100 px-1.5 py-0.5 text-[9px] font-bold text-red-700">Artwork: Missing</span>
        )}

        {/* Print-and-cut indicators */}
        {assessment.isPrintAndCut && assessment.contourReady && (
          <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[9px] font-medium text-blue-700">
            {t("admin.readiness.contourReady")}
          </span>
        )}
        {assessment.isPrintAndCut && !assessment.contourReady && (
          <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-700">
            {t("admin.readiness.contourNeeded")}
          </span>
        )}
        {assessment.isPrintAndCut && assessment.registrationMarkReady && (
          <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[9px] font-medium text-blue-700">
            {t("admin.readiness.regMarksReady")}
          </span>
        )}
        {assessment.manualReviewRequired && (
          <span className="rounded bg-orange-100 px-1.5 py-0.5 text-[9px] font-bold text-orange-700">
            {t("admin.readiness.manualReview")}
          </span>
        )}

        {/* Other production badges */}
        {meta.proofConfirmed && <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[9px] font-medium text-emerald-700">Proof OK</span>}
        {meta.whiteInkMode && meta.whiteInkMode !== "none" && (
          <span className={`rounded px-1.5 py-0.5 text-[9px] font-medium ${meta.whiteInkUrl ? "bg-purple-50 text-purple-700" : "bg-yellow-50 text-yellow-700"}`}>
            {meta.whiteInkUrl ? "White Ink Ready" : "White Ink Pending"}
          </span>
        )}
        {meta.stampPreviewUrl && <span className="rounded bg-green-50 px-1.5 py-0.5 text-[9px] font-medium text-green-700">Stamp Preview</span>}
        {(meta.sides === "double" || meta.doubleSided) && <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[9px] font-medium text-amber-700">2-Sided</span>}
        {(meta.turnaround === "rush" || meta.turnaround === "express" || meta.turnaround === "same-day") && (
          <span className="rounded bg-red-50 px-1.5 py-0.5 text-[9px] font-bold text-red-700">RUSH</span>
        )}
        {meta.foilCoverage && <span className="rounded bg-yellow-50 px-1.5 py-0.5 text-[9px] font-medium text-yellow-800">Foil</span>}
        {meta.numbering && <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-[9px] font-medium text-indigo-700">Numbered</span>}
        {(meta.foodUse === true || meta.foodUse === "yes") && <span className="rounded bg-lime-50 px-1.5 py-0.5 text-[9px] font-medium text-lime-700">Food Safe</span>}
        {meta.lamination && <span className="rounded bg-cyan-50 px-1.5 py-0.5 text-[9px] font-medium text-cyan-700">Laminated</span>}
        {meta.processedImageUrl && <span className="rounded bg-violet-50 px-1.5 py-0.5 text-[9px] font-medium text-violet-700">BG Removed</span>}
        {meta.vehicleType && <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-medium text-slate-700">{meta.vehicleType}</span>}
      </div>

      {/* Row 4: issues list */}
      {assessment.reasons.length > 0 && assessment.level !== READINESS.DONE && assessment.level !== READINESS.READY && (
        <div className="flex flex-wrap gap-1">
          {assessment.reasons.map((r, ri) => (
            <span key={ri} className={`rounded px-1.5 py-0.5 text-[9px] font-medium ${
              r.severity === "blocker" ? "bg-red-100 text-red-700" :
              r.severity === "warning" ? "bg-amber-100 text-amber-700" :
              "bg-blue-50 text-blue-700"
            }`}>
              {r.message}
            </span>
          ))}
        </div>
      )}

      {/* Row 5: executable action */}
      {execAction && (
        <div className="flex items-center gap-2">
          {execAction.toolLink ? (
            <Link
              href={execAction.toolLink}
              className="inline-flex items-center gap-1.5 rounded-[3px] bg-black px-3 py-1.5 text-[10px] font-bold text-white hover:bg-[#222]"
            >
              {execAction.action}
              <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
            </Link>
          ) : (
            <span className="text-[10px] font-semibold text-amber-700">
              ▶ {execAction.action}
            </span>
          )}
          {execAction.totalIssueCount > 1 && (
            <span className="text-[9px] text-[#999]">
              (+{execAction.totalIssueCount - 1} more)
            </span>
          )}
        </div>
      )}
    </div>
  );
}
