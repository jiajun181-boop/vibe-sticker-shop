/**
 * Production Manifest — Caldera-lite groundwork (M7-6)
 *
 * Assembles all production data for an order into a structured manifest
 * that downstream tools (imposition, PDF assembly, Caldera RIP) can consume.
 *
 * This is the bridge between:
 *   Order data (Prisma) → Production manifest (JSON) → Print-ready output (future)
 *
 * The manifest captures:
 *   - Item specs (family, dimensions, material, quantity)
 *   - File references (artwork, contour, white ink, proofs)
 *   - Production metadata (bleed, DPI, color mode)
 *   - Readiness status (from unified assessment)
 */

import { detectProductFamily } from "@/lib/preflight";
import { hasArtworkUrl, getArtworkStatus } from "@/lib/artwork-detection";
import { assessItem, assessPackage, READINESS } from "@/lib/admin/production-readiness";

/**
 * Build a production manifest for an order.
 *
 * @param {object} order — full order with items[], files[], proofData[]
 * @returns {{
 *   orderId: string,
 *   orderDate: string,
 *   customerName: string,
 *   customerEmail: string,
 *   priority: number,
 *   isRush: boolean,
 *   items: Array<ManifestItem>,
 *   totalItemCount: number,
 *   readyItemCount: number,
 *   blockedItemCount: number,
 * }}
 */
export function buildProductionManifest(order) {
  if (!order) return null;

  const items = (order.items || []).map((item) => buildItemManifest(item, order.id));

  const isRush = order.priority === 0 ||
    (order.tags || []).includes("rush") ||
    items.some((i) => i.isRush);

  return {
    orderId: order.id,
    orderDate: order.createdAt,
    customerName: order.customerName || "",
    customerEmail: order.customerEmail || "",
    priority: order.priority || 2,
    isRush,
    items,
    totalItemCount: items.length,
    readyItemCount: items.filter((i) => i.readiness === READINESS.READY || i.readiness === READINESS.DONE).length,
    blockedItemCount: items.filter((i) => i.readiness === READINESS.BLOCKED).length,
  };
}

/**
 * Build manifest entry for a single order item.
 *
 * @param {object} item — OrderItem with meta, specsJson
 * @param {string} orderId
 * @returns {ManifestItem}
 */
function buildItemManifest(item, orderId) {
  const meta = {
    ...(item.specsJson && typeof item.specsJson === "object" ? item.specsJson : {}),
    ...(item.meta && typeof item.meta === "object" ? item.meta : {}),
  };
  const family = detectProductFamily(item);
  const assessment = assessItem(item, orderId);
  const pkg = assessPackage(item);

  // Artwork file URL
  const artworkUrl = item.fileUrl || meta.artworkUrl || meta.fileUrl || meta.frontArtworkUrl || null;
  const backArtworkUrl = meta.backArtworkUrl || meta.backFileUrl || null;

  // Dimensions
  const widthIn = item.widthIn || Number(meta.width) || null;
  const heightIn = item.heightIn || Number(meta.height) || null;

  return {
    itemId: item.id,
    productName: item.productName || "Unknown",
    family,
    quantity: item.quantity || 1,

    // Dimensions
    widthIn,
    heightIn,
    sizeLabel: meta.sizeLabel || (widthIn && heightIn ? `${widthIn}" x ${heightIn}"` : null),

    // Material
    material: item.material || meta.material || meta.stock || meta.labelType || null,
    finishing: item.finishing || meta.finishing || null,

    // Files
    artworkUrl: typeof artworkUrl === "string" ? artworkUrl : null,
    backArtworkUrl: typeof backArtworkUrl === "string" ? backArtworkUrl : null,
    processedImageUrl: meta.processedImageUrl || null,
    contourSvgUrl: meta.contourSvg || null,
    whiteInkUrl: meta.whiteInkUrl || null,
    stampPreviewUrl: meta.stampPreviewUrl || null,

    // Production metadata
    bleedMm: meta.bleedMm || null,
    whiteInkMode: meta.whiteInkMode || null,
    isTwoSided: meta.sides === "double" || meta.sides === "2" || meta.sides === 2 || meta.doubleSided === true,
    isRush: meta.turnaround === "rush" || meta.turnaround === "express" || meta.turnaround === "same-day" ||
            meta.rushProduction === true || meta.rushProduction === "true",

    // Contour data
    contourAppliedAt: meta.contourAppliedAt || null,
    contourConfidence: meta.contourConfidence || null,
    contourShapeType: meta.contourShapeType || null,

    // Readiness
    readiness: assessment.level,
    reasons: assessment.reasons,
    nextAction: assessment.nextAction,
    toolLink: assessment.toolLink,

    // Package completeness
    packageStatus: pkg.status,
    packageFiles: pkg.files,
    packageMissingCount: pkg.missingCount,

    // Production job (if exists)
    productionJobId: item.productionJob?.id || null,
    productionJobStatus: item.productionJob?.status || null,
  };
}

/**
 * Serialize a manifest to a download-friendly JSON string.
 */
export function manifestToJson(manifest) {
  return JSON.stringify(manifest, null, 2);
}

/**
 * Generate a human-readable text summary of a manifest.
 */
export function manifestToText(manifest) {
  if (!manifest) return "No manifest available.";

  const lines = [
    `PRODUCTION MANIFEST`,
    `Order: ${manifest.orderId}`,
    `Date: ${new Date(manifest.orderDate).toLocaleDateString("en-CA")}`,
    `Customer: ${manifest.customerName} (${manifest.customerEmail})`,
    `Priority: ${manifest.isRush ? "RUSH" : "Standard"}`,
    `Items: ${manifest.totalItemCount} (${manifest.readyItemCount} ready, ${manifest.blockedItemCount} blocked)`,
    ``,
    `--- ITEMS ---`,
  ];

  for (const item of manifest.items) {
    lines.push(``);
    lines.push(`${item.productName} [${item.family}]`);
    lines.push(`  Qty: ${item.quantity}`);
    if (item.sizeLabel) lines.push(`  Size: ${item.sizeLabel}`);
    if (item.material) lines.push(`  Material: ${item.material}`);
    if (item.finishing) lines.push(`  Finishing: ${item.finishing}`);
    lines.push(`  Readiness: ${item.readiness.toUpperCase()}`);
    lines.push(`  Package: ${item.packageStatus} (${item.packageMissingCount} missing)`);

    // Files
    const fileLabels = item.packageFiles
      .map((f) => `    ${f.present ? "[OK]" : "[--]"} ${f.label}`)
      .join("\n");
    lines.push(`  Files:\n${fileLabels}`);

    if (item.reasons.length > 0) {
      lines.push(`  Issues:`);
      for (const r of item.reasons) {
        lines.push(`    [${r.severity}] ${r.message}`);
      }
    }
  }

  return lines.join("\n");
}
