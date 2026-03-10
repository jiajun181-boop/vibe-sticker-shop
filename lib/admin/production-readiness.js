/**
 * Unified production readiness assessment.
 *
 * Every admin page that needs to know "can this item be produced?" should use
 * these helpers so the answer is consistent everywhere: order detail,
 * workstation, production board, tools hub.
 *
 * Readiness levels:
 *   "ready"      — green — all required info present, can go to production
 *   "needs-info" — amber — missing non-blocking info (proof, upload-later, design-help)
 *   "blocked"    — red   — missing critical info (no artwork, no dimensions, no material)
 *   "in-progress"— blue  — actively in production pipeline
 *   "done"       — green — shipped / completed
 */

import { detectProductFamily } from "@/lib/preflight";
import { hasArtworkUrl, getArtworkStatus } from "@/lib/artwork-detection";

// ── Readiness levels (ordered by severity) ──────────────────────────────────

export const READINESS = {
  DONE:         "done",
  READY:        "ready",
  IN_PROGRESS:  "in-progress",
  NEEDS_INFO:   "needs-info",
  BLOCKED:      "blocked",
};

export const READINESS_COLORS = {
  done:         { dot: "bg-green-500",  bg: "bg-green-50",  text: "text-green-800",  border: "border-green-300" },
  ready:        { dot: "bg-green-500",  bg: "bg-green-50",  text: "text-green-800",  border: "border-green-300" },
  "in-progress":{ dot: "bg-blue-500",   bg: "bg-blue-50",   text: "text-blue-800",   border: "border-blue-300" },
  "needs-info": { dot: "bg-amber-400",  bg: "bg-amber-50",  text: "text-amber-800",  border: "border-amber-300" },
  blocked:      { dot: "bg-red-500",    bg: "bg-red-50",    text: "text-red-800",    border: "border-red-300" },
};

// i18n keys for readiness levels
export const READINESS_LABEL_KEYS = {
  done:         "admin.readiness.done",
  ready:        "admin.readiness.ready",
  "in-progress":"admin.readiness.inProgress",
  "needs-info": "admin.readiness.needsInfo",
  blocked:      "admin.readiness.blocked",
};

// ── Per-item assessment ─────────────────────────────────────────────────────

/**
 * Assess production readiness for a single order item.
 *
 * @param {object} item — OrderItem with meta, specsJson, productName, material, widthIn, heightIn, productionJob
 * @returns {{
 *   level: string,        — "ready" | "needs-info" | "blocked" | "in-progress" | "done"
 *   family: string,       — product family from detectProductFamily
 *   reasons: Array<{code: string, message: string, severity: "blocker"|"warning"|"info"}>,
 *   nextAction: string|null, — suggested next action (human-readable key)
 *   toolLink: {label: string, href: string}|null — direct link to the relevant tool
 * }}
 */
export function assessItem(item, orderId) {
  const meta = {
    ...(item.specsJson && typeof item.specsJson === "object" ? item.specsJson : {}),
    ...(item.meta && typeof item.meta === "object" ? item.meta : {}),
  };
  const family = detectProductFamily(item);
  const reasons = [];
  let nextAction = null;
  let toolLink = null;

  // --- Check production job status first ---
  const job = item.productionJob;
  if (job) {
    if (job.status === "shipped" || job.status === "finished") {
      return { level: READINESS.DONE, family, reasons: [], nextAction: null, toolLink: null };
    }
    if (["printing", "quality_check", "assigned"].includes(job.status)) {
      return {
        level: READINESS.IN_PROGRESS,
        family,
        reasons: [{ code: "in_production", message: `Production: ${job.status.replace(/_/g, " ")}`, severity: "info" }],
        nextAction: null,
        toolLink: null,
      };
    }
  }

  // --- Artwork check ---
  const itemWithMergedMeta = { ...item, meta };
  const artStatus = getArtworkStatus(itemWithMergedMeta);
  const hasArt = hasArtworkUrl(itemWithMergedMeta);

  if (!hasArt) {
    if (artStatus === "missing" || artStatus === "file-name-only") {
      reasons.push({
        code: artStatus === "file-name-only" ? "artwork_url_missing" : "no_artwork",
        message: artStatus === "file-name-only"
          ? "File name present but upload URL missing — re-upload needed"
          : "No artwork uploaded — contact customer or request file",
        severity: "blocker",
      });
      if (family === "stamp") {
        nextAction = "admin.readiness.actionOpenStamp";
        const stampParams = [orderId && `orderId=${orderId}`, item.id && `itemId=${item.id}`].filter(Boolean).join("&");
        toolLink = { label: "admin.readiness.toolStamp", href: `/admin/tools/stamp-studio${stampParams ? `?${stampParams}` : ""}` };
      } else {
        nextAction = "admin.readiness.actionContactCustomer";
      }
    } else if (artStatus === "upload-later") {
      reasons.push({
        code: "upload_later",
        message: "Customer chose \"upload later\" — follow up to collect artwork",
        severity: "warning",
      });
      nextAction = "admin.readiness.actionFollowUp";
    } else if (artStatus === "design-help") {
      reasons.push({
        code: "design_help",
        message: "Design help requested ($45 fee) — prepare artwork for customer",
        severity: "warning",
      });
      nextAction = "admin.readiness.actionDesignHelp";
    }
  }

  // --- Dimensions check (skip stamps — model-based) ---
  if (family !== "stamp") {
    const hasDims = !!(item.widthIn && item.heightIn) || !!(meta.sizeLabel) || hasSizeRows(item);
    if (!hasDims) {
      reasons.push({
        code: "missing_dimensions",
        message: "Missing dimensions — cannot produce without knowing the size",
        severity: "blocker",
      });
    }
  }

  // --- Material check (for families that require it) ---
  const materialFamilies = ["sticker", "label", "banner", "sign"];
  if (materialFamilies.includes(family)) {
    const hasMaterial = !!(item.material || meta.material || meta.stock || meta.labelType);
    if (!hasMaterial) {
      reasons.push({
        code: "missing_material",
        message: "Missing material/substrate — production cannot start",
        severity: "blocker",
      });
    }
  }

  // --- Sticker/label: needs contour ---
  if ((family === "sticker" || family === "label") && !meta.contourSvg && !meta.bleedMm) {
    reasons.push({
      code: "needs_contour",
      message: "Die-cut contour not yet generated",
      severity: "warning",
    });
    if (!nextAction) {
      nextAction = "admin.readiness.actionRunContour";
      const contourParams = [orderId && `orderId=${orderId}`, item.id && `itemId=${item.id}`].filter(Boolean).join("&");
      toolLink = { label: "admin.readiness.toolContour", href: `/admin/tools/contour${contourParams ? `?${contourParams}` : ""}` };
    }
  }

  // --- White ink pending ---
  const whiteInkEnabled = !!(meta.whiteInkEnabled || (meta.whiteInkMode && meta.whiteInkMode !== "none"));
  if (whiteInkEnabled && !meta.whiteInkUrl) {
    reasons.push({
      code: "white_ink_pending",
      message: "White ink enabled but white layer file not ready",
      severity: "warning",
    });
  }

  // --- Rush flagging ---
  if (meta.turnaround === "rush" || meta.turnaround === "express" || meta.turnaround === "same-day" ||
      meta.rushProduction === true || meta.rushProduction === "true") {
    reasons.push({
      code: "rush",
      message: `Rush production (${meta.turnaround || "rush"}) — prioritize immediately`,
      severity: "warning",
    });
  }

  // --- Double-sided missing back ---
  const isTwoSided = meta.sides === "double" || meta.sides === "2" || meta.sides === 2 || meta.doubleSided === true;
  if (isTwoSided && hasArt && !meta.backArtworkUrl && !meta.backFileUrl) {
    reasons.push({
      code: "two_sided_single_file",
      message: "Double-sided but only one file — check if front+back are combined, or follow up",
      severity: "warning",
    });
  }

  // --- Stamp-specific ---
  if (family === "stamp") {
    if (!meta.stampPreviewUrl) {
      reasons.push({ code: "stamp_no_preview", message: "Stamp preview image not generated", severity: "blocker" });
      if (!nextAction) {
        nextAction = "admin.readiness.actionOpenStamp";
        const stampParams = [orderId && `orderId=${orderId}`, item.id && `itemId=${item.id}`].filter(Boolean).join("&");
        toolLink = { label: "admin.readiness.toolStamp", href: `/admin/tools/stamp-studio${stampParams ? `?${stampParams}` : ""}` };
      }
    }
  }

  // --- Booklet-specific ---
  if (family === "booklet") {
    if (!meta.pageCount) {
      reasons.push({ code: "booklet_no_pages", message: "Missing page count", severity: "blocker" });
    }
    if (!meta.binding) {
      reasons.push({ code: "booklet_no_binding", message: "Missing binding type", severity: "blocker" });
    }
  }

  // --- NCR-specific ---
  if (family === "ncr") {
    if (!meta.formType && !meta.parts) {
      reasons.push({ code: "ncr_no_parts", message: "Missing form type / part count", severity: "blocker" });
    }
  }

  // --- Vehicle-specific ---
  if (family === "vehicle") {
    if (!meta.vehicleType) {
      reasons.push({ code: "vehicle_no_type", message: "Missing vehicle graphic type", severity: "warning" });
    }
    const typeId = (meta.vehicleType || "").toLowerCase();
    const needsBody = typeId.includes("wrap") || typeId.includes("door") || typeId.includes("fleet");
    if (needsBody && !meta.vehicleBody) {
      reasons.push({ code: "vehicle_no_body", message: "Missing vehicle body type (make/model)", severity: "warning" });
    }
    const isDot = typeId.includes("dot") || typeId.includes("compliance");
    if (isDot && !meta.text) {
      reasons.push({ code: "vehicle_dot_no_text", message: "DOT/compliance missing text content", severity: "blocker" });
    }
  }

  // --- Banner: finishing check ---
  if (family === "banner") {
    const hasFinishing = !!(meta.grommetSpacing || meta.polePocketPos || meta.hemming || item.finishing || meta.finishing);
    if (!hasFinishing) {
      reasons.push({
        code: "banner_no_finishing",
        message: "No finishing specified (grommets/hemming/pockets) — confirm before printing",
        severity: "warning",
      });
    }
  }

  // --- Sign: hardware check for yard/lawn signs ---
  if (family === "sign") {
    const pName = (item.productName || "").toLowerCase();
    if ((pName.includes("yard") || pName.includes("lawn")) && !meta.hardware) {
      reasons.push({
        code: "sign_no_hardware",
        message: "Yard sign without hardware (H-stakes/frames) — confirm with customer",
        severity: "warning",
      });
    }
  }

  // --- Business card: multi-name file check ---
  if (family === "business-card" && meta.names && Number(meta.names) > 1) {
    const nameCount = Number(meta.names);
    const fileCount = typeof meta.fileName === "object" && meta.fileName
      ? Object.values(meta.fileName).filter(Boolean).length : meta.fileName ? 1 : 0;
    if (fileCount < nameCount) {
      reasons.push({
        code: "biz_card_missing_names",
        message: `${nameCount} name variations but only ${fileCount} file(s) — follow up`,
        severity: "warning",
      });
    }
  }

  // --- Determine final level ---
  const hasBlocker = reasons.some((r) => r.severity === "blocker");
  const hasWarning = reasons.some((r) => r.severity === "warning");
  const level = hasBlocker ? READINESS.BLOCKED : hasWarning ? READINESS.NEEDS_INFO : READINESS.READY;

  return { level, family, reasons, nextAction, toolLink };
}

// ── Order-level assessment ──────────────────────────────────────────────────

/**
 * Assess production readiness for an entire order.
 *
 * @param {object} order — Order with items[], productionStatus, status
 * @returns {{
 *   level: string,           — worst readiness across all items
 *   items: Array<object>,    — per-item assessments
 *   blockerCount: number,
 *   warningCount: number,
 *   readyCount: number,
 *   summary: string,         — i18n key for summary text
 * }}
 */
export function assessOrder(order) {
  if (!order) {
    return { level: READINESS.BLOCKED, items: [], blockerCount: 0, warningCount: 0, readyCount: 0, summary: "admin.readiness.noOrder" };
  }

  // Terminal order states
  if (order.productionStatus === "shipped" || order.productionStatus === "completed") {
    return {
      level: READINESS.DONE,
      items: (order.items || []).map((item) => assessItem(item, order.id)),
      blockerCount: 0, warningCount: 0, readyCount: (order.items || []).length,
      summary: "admin.readiness.orderDone",
    };
  }

  if (order.productionStatus === "on_hold") {
    return {
      level: READINESS.BLOCKED,
      items: (order.items || []).map((item) => assessItem(item, order.id)),
      blockerCount: 1, warningCount: 0, readyCount: 0,
      summary: "admin.readiness.orderOnHold",
    };
  }

  const items = (order.items || []).map((item) => assessItem(item, order.id));
  let blockerCount = 0;
  let warningCount = 0;
  let readyCount = 0;

  for (const a of items) {
    if (a.level === READINESS.BLOCKED) blockerCount++;
    else if (a.level === READINESS.NEEDS_INFO) warningCount++;
    else readyCount++;
  }

  // Worst level across all items
  const level = blockerCount > 0
    ? READINESS.BLOCKED
    : warningCount > 0
      ? READINESS.NEEDS_INFO
      : items.some((a) => a.level === READINESS.IN_PROGRESS)
        ? READINESS.IN_PROGRESS
        : READINESS.READY;

  const summary = level === READINESS.BLOCKED
    ? "admin.readiness.orderBlocked"
    : level === READINESS.NEEDS_INFO
      ? "admin.readiness.orderNeedsInfo"
      : level === READINESS.IN_PROGRESS
        ? "admin.readiness.orderInProgress"
        : "admin.readiness.orderReady";

  return { level, items, blockerCount, warningCount, readyCount, summary };
}

// ── Task queue categorization (for workstation) ─────────────────────────────

/**
 * Categorize orders into workstation task queue buckets.
 *
 * @param {Array<object>} orders — orders with items[], productionStatus, priority, tags
 * @returns {{
 *   missingArtwork: Array,
 *   pendingProof: Array,
 *   contourReview: Array,
 *   readyForProduction: Array,
 *   blocked: Array,
 *   rush: Array,
 *   inProgress: Array,
 * }}
 */
export function categorizeForTaskQueue(orders) {
  const buckets = {
    rush: [],
    missingArtwork: [],
    pendingProof: [],
    contourReview: [],
    readyForProduction: [],
    blocked: [],
    inProgress: [],
  };

  for (const order of orders) {
    const assessment = assessOrder(order);
    const isRush = order.priority === 0 ||
      (order.tags && (order.tags.includes("rush") || order.tags.includes("urgent"))) ||
      assessment.items.some((a) => a.reasons.some((r) => r.code === "rush"));

    // Rush orders get their own bucket (they also appear in their natural category)
    if (isRush && assessment.level !== READINESS.DONE) {
      buckets.rush.push({ order, assessment });
    }

    // Categorize by worst issue
    if (assessment.level === READINESS.DONE) continue;

    if (assessment.level === READINESS.IN_PROGRESS) {
      buckets.inProgress.push({ order, assessment });
      continue;
    }

    // Check specific issue codes across all items
    const allReasons = assessment.items.flatMap((a) => a.reasons);
    const codes = new Set(allReasons.map((r) => r.code));

    if (codes.has("no_artwork") || codes.has("artwork_url_missing") || codes.has("upload_later")) {
      buckets.missingArtwork.push({ order, assessment });
    } else if (codes.has("needs_contour")) {
      buckets.contourReview.push({ order, assessment });
    } else if (assessment.level === READINESS.BLOCKED) {
      buckets.blocked.push({ order, assessment });
    } else if (assessment.level === READINESS.READY) {
      buckets.readyForProduction.push({ order, assessment });
    } else {
      // needs-info but not artwork/contour — generic warning
      buckets.blocked.push({ order, assessment });
    }
  }

  return buckets;
}

// ── Package completeness (M7-4) ─────────────────────────────────────────────

/**
 * Assess file package completeness for a single order item.
 * Returns which production files exist and which are missing.
 *
 * @param {object} item — OrderItem with meta, specsJson, fileUrl, productionJob
 * @returns {{
 *   status: "complete"|"partial"|"blocked",
 *   files: Array<{label: string, present: boolean, url: string|null, type: string}>,
 *   missingCount: number,
 *   totalCount: number,
 * }}
 */
export function assessPackage(item) {
  const meta = {
    ...(item.specsJson && typeof item.specsJson === "object" ? item.specsJson : {}),
    ...(item.meta && typeof item.meta === "object" ? item.meta : {}),
  };
  const family = detectProductFamily(item);
  const files = [];

  // --- Universal: color artwork ---
  const artUrl = item.fileUrl || meta.artworkUrl || meta.fileUrl || meta.frontArtworkUrl || null;
  const artPresent = !!(typeof artUrl === "string" && artUrl.trim());
  files.push({ label: "Color Artwork", present: artPresent, url: artPresent ? artUrl : null, type: "color" });

  // --- Double-sided: back artwork ---
  const isTwoSided = meta.sides === "double" || meta.sides === "2" || meta.sides === 2 || meta.doubleSided === true;
  if (isTwoSided) {
    const backUrl = meta.backArtworkUrl || meta.backFileUrl || null;
    files.push({ label: "Back Artwork", present: !!backUrl, url: backUrl, type: "color" });
  }

  // --- Sticker/label: contour SVG ---
  if (family === "sticker" || family === "label") {
    files.push({ label: "Contour SVG", present: !!meta.contourSvg, url: meta.contourSvg || null, type: "contour" });
    if (meta.processedImageUrl) {
      files.push({ label: "BG-Removed Image", present: true, url: meta.processedImageUrl, type: "processed" });
    }
  }

  // --- White ink layer ---
  const whiteInkEnabled = !!(meta.whiteInkEnabled || (meta.whiteInkMode && meta.whiteInkMode !== "none"));
  if (whiteInkEnabled) {
    files.push({ label: "White Ink Layer", present: !!meta.whiteInkUrl, url: meta.whiteInkUrl || null, type: "white-ink" });
  }

  // --- Stamp: preview ---
  if (family === "stamp") {
    files.push({ label: "Stamp Preview", present: !!meta.stampPreviewUrl, url: meta.stampPreviewUrl || null, type: "preview" });
  }

  const missingCount = files.filter((f) => !f.present).length;
  const totalCount = files.length;
  const hasCriticalMissing = !artPresent && family !== "stamp"; // stamps use preview instead

  const status = hasCriticalMissing ? "blocked" : missingCount > 0 ? "partial" : "complete";

  return { status, files, missingCount, totalCount };
}

/**
 * Assess file package for an entire order.
 */
export function assessOrderPackage(order) {
  const items = (order.items || []).map((item) => ({
    itemId: item.id,
    itemName: item.productName || "Item",
    family: detectProductFamily(item),
    ...assessPackage(item),
  }));

  const blocked = items.filter((i) => i.status === "blocked").length;
  const partial = items.filter((i) => i.status === "partial").length;
  const complete = items.filter((i) => i.status === "complete").length;

  const status = blocked > 0 ? "blocked" : partial > 0 ? "partial" : "complete";

  return { status, items, blocked, partial, complete };
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function hasSizeRows(item) {
  const meta = item?.meta && typeof item.meta === "object" ? item.meta : null;
  const specs = item?.specsJson && typeof item.specsJson === "object" ? item.specsJson : null;
  const raw = specs?.sizeRows ?? meta?.sizeRows;
  let rows = raw;
  if (typeof raw === "string") {
    try { rows = JSON.parse(raw); } catch { return false; }
  }
  return Array.isArray(rows) && rows.length > 0;
}
