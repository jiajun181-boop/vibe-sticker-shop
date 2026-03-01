import { NextResponse } from "next/server";
import { PDFDocument, rgb, StandardFonts, degrees } from "pdf-lib";

/**
 * GET /api/templates/[slug]/download?width=4&height=6&bleed=0.125&unit=in&product=Postcards&dpi=300&folds=0&foldType=bifold
 *
 * Generates a professional print-ready PDF template with:
 *  - Bleed zone (red dashed)
 *  - Trim/cut lines (black solid)
 *  - Safe zone (green dashed)
 *  - Crop marks at corners
 *  - Registration marks
 *  - CMYK color calibration bar
 *  - Fold lines (blue dashed) for folded products
 *  - Scaled template + watermark for large-format
 *  - Branded footer
 */

// Points per inch
const PPI = 72;
const MARK_OFFSET = 18; // offset for crop marks from trim edge
const MARK_LEN = 12; // length of crop marks
const REG_RADIUS = 4; // registration mark radius

// Colors
const CLR_BLEED_BG = rgb(1.0, 0.95, 0.95);
const CLR_BLEED_LINE = rgb(0.9, 0.1, 0.1);
const CLR_TRIM_LINE = rgb(0, 0, 0);
const CLR_SAFE_BG = rgb(0.95, 1.0, 0.95);
const CLR_SAFE_LINE = rgb(0.1, 0.6, 0.1);
const CLR_CROP = rgb(0, 0, 0);
const CLR_FOLD = rgb(0.2, 0.4, 0.8);
const CLR_WATERMARK = rgb(0.85, 0.85, 0.85);

// CMYK simulation color blocks
const COLOR_BAR = [
  { label: "C", color: rgb(0, 0.65, 0.91) },
  { label: "M", color: rgb(0.89, 0, 0.45) },
  { label: "Y", color: rgb(1, 0.85, 0) },
  { label: "K", color: rgb(0, 0, 0) },
  { label: "CM", color: rgb(0, 0.2, 0.6) },
  { label: "CY", color: rgb(0, 0.55, 0.35) },
  { label: "MY", color: rgb(0.7, 0.1, 0) },
  { label: "CMY", color: rgb(0.15, 0.15, 0.15) },
];

function parseFloat2(val, fallback) {
  const n = parseFloat(val);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function parseInt2(val, fallback) {
  const n = parseInt(val, 10);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

export async function GET(req, { params }) {
  try {
    const { slug } = await params;
    const url = new URL(req.url);

    // Parse query params
    const widthIn = parseFloat2(url.searchParams.get("width"), 3.5);
    const heightIn = parseFloat2(url.searchParams.get("height"), 2);
    const bleedIn = parseFloat2(url.searchParams.get("bleed"), 0.125);
    const product = url.searchParams.get("product") || slug || "Template";
    const dpi = parseInt2(url.searchParams.get("dpi"), 300);
    const folds = parseInt2(url.searchParams.get("folds"), 0);
    const foldType = url.searchParams.get("foldType") || "bifold";

    // Safety limits
    if (widthIn > 600 || heightIn > 600) {
      return NextResponse.json({ error: "Dimensions too large" }, { status: 400 });
    }

    // Large format scaling
    const maxDim = Math.max(widthIn, heightIn);
    let scale = 1;
    let isScaled = false;
    if (maxDim > 24) {
      scale = 17 / maxDim;
      isScaled = true;
    }

    // Safe area inset
    const safeInsetIn = maxDim > 24 ? 0.5 : 0.25;

    // Convert to points (scaled)
    const trimW = widthIn * scale * PPI;
    const trimH = heightIn * scale * PPI;
    const bleedPt = bleedIn * scale * PPI;
    const safeInset = safeInsetIn * scale * PPI;

    // Total page size: trim + bleed on all sides + margin for marks
    const margin = MARK_OFFSET + MARK_LEN + 10;
    const pageW = trimW + 2 * bleedPt + 2 * margin;
    const pageH = trimH + 2 * bleedPt + 2 * margin + 36; // extra space for color bar & footer

    // Origin of bleed area
    const bx = margin;
    const by = margin + 36;
    // Origin of trim area
    const tx = bx + bleedPt;
    const ty = by + bleedPt;
    // Origin of safe area
    const sx = tx + safeInset;
    const sy = ty + safeInset;
    const safeW = trimW - 2 * safeInset;
    const safeH = trimH - 2 * safeInset;

    // Create PDF
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([pageW, pageH]);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // White background
    page.drawRectangle({ x: 0, y: 0, width: pageW, height: pageH, color: rgb(1, 1, 1) });

    // 1. Bleed area background
    page.drawRectangle({
      x: bx, y: by,
      width: trimW + 2 * bleedPt,
      height: trimH + 2 * bleedPt,
      color: CLR_BLEED_BG,
    });

    // 2. Safe area background
    page.drawRectangle({
      x: sx, y: sy,
      width: safeW,
      height: safeH,
      color: CLR_SAFE_BG,
    });

    // 3. Bleed border (red dashed)
    drawDashedRect(page, bx, by, trimW + 2 * bleedPt, trimH + 2 * bleedPt, CLR_BLEED_LINE, 1, [4, 3]);

    // 4. Trim border (black solid)
    page.drawRectangle({
      x: tx, y: ty, width: trimW, height: trimH,
      borderColor: CLR_TRIM_LINE, borderWidth: 1.5,
      color: undefined, opacity: 0,
    });

    // 5. Safe area border (green dashed)
    drawDashedRect(page, sx, sy, safeW, safeH, CLR_SAFE_LINE, 0.75, [3, 2]);

    // 6. Crop marks at corners
    const cropCorners = [
      [tx, ty], [tx + trimW, ty], [tx, ty + trimH], [tx + trimW, ty + trimH],
    ];
    for (const [cx, cy] of cropCorners) {
      const dx = cx === tx ? -1 : 1;
      const dy = cy === ty ? -1 : 1;
      // Horizontal
      page.drawLine({
        start: { x: cx + dx * (bleedPt + 2), y: cy },
        end: { x: cx + dx * (bleedPt + 2 + MARK_LEN), y: cy },
        color: CLR_CROP, thickness: 0.5,
      });
      // Vertical
      page.drawLine({
        start: { x: cx, y: cy + dy * (bleedPt + 2) },
        end: { x: cx, y: cy + dy * (bleedPt + 2 + MARK_LEN) },
        color: CLR_CROP, thickness: 0.5,
      });
    }

    // 7. Registration marks (at midpoints of each edge, outside bleed)
    const regPositions = [
      { x: tx + trimW / 2, y: by - MARK_OFFSET }, // bottom
      { x: tx + trimW / 2, y: by + trimH + 2 * bleedPt + MARK_OFFSET }, // top
      { x: bx - MARK_OFFSET, y: ty + trimH / 2 }, // left
      { x: bx + trimW + 2 * bleedPt + MARK_OFFSET, y: ty + trimH / 2 }, // right
    ];
    for (const pos of regPositions) {
      drawRegistrationMark(page, pos.x, pos.y, REG_RADIUS);
    }

    // 8. Fold lines
    if (folds > 0) {
      const foldPositions = computeFoldPositions(trimW, folds, foldType);
      for (const fx of foldPositions) {
        const lineX = tx + fx;
        drawDashedLine(page, lineX, ty - bleedPt, lineX, ty + trimH + bleedPt, CLR_FOLD, 0.75, [5, 3]);
        // Label
        const labelW = font.widthOfTextAtSize("FOLD LINE", 6);
        page.drawText("FOLD LINE", {
          x: lineX - labelW / 2,
          y: ty + trimH + bleedPt + 4,
          size: 6, font, color: CLR_FOLD,
        });
      }
    }

    // 9. Zone labels inside template
    const labelSize = 7;

    // Bleed label
    page.drawText("BLEED AREA", {
      x: bx + 4, y: by + 4,
      size: labelSize, font, color: CLR_BLEED_LINE,
    });

    // Trim label
    page.drawText("TRIM LINE", {
      x: tx + 4, y: ty + 4,
      size: labelSize, font, color: CLR_TRIM_LINE,
    });

    // Safe zone label
    page.drawText("SAFE ZONE — Keep important content inside this area", {
      x: sx + 4, y: sy + safeH - labelSize - 4,
      size: labelSize, font, color: CLR_SAFE_LINE,
    });

    // Center: product name + dimensions
    const centerLabel = `${product}`;
    const dimLabel = `${widthIn}" × ${heightIn}" — Bleed: ${bleedIn}" — DPI: ${dpi}`;
    const centerW = fontBold.widthOfTextAtSize(centerLabel, 14);
    const dimW = font.widthOfTextAtSize(dimLabel, 9);
    page.drawText(centerLabel, {
      x: tx + (trimW - centerW) / 2,
      y: ty + trimH / 2 + 10,
      size: 14, font: fontBold, color: rgb(0.3, 0.3, 0.3),
    });
    page.drawText(dimLabel, {
      x: tx + (trimW - dimW) / 2,
      y: ty + trimH / 2 - 8,
      size: 9, font, color: rgb(0.5, 0.5, 0.5),
    });

    // 10. Scaled watermark
    if (isScaled) {
      const wmText = "SCALED TEMPLATE \u2014 NOT ACTUAL SIZE";
      const wmSize = Math.min(48, trimW / 10);
      const wmW = fontBold.widthOfTextAtSize(wmText, wmSize);
      page.drawText(wmText, {
        x: tx + trimW / 2 - wmW / 2,
        y: ty + trimH / 2 - 40,
        size: wmSize, font: fontBold, color: CLR_WATERMARK,
        rotate: degrees(0),
      });
      const scaleNote = `Actual: ${widthIn}" × ${heightIn}" — Scale: ${Math.round(scale * 100)}%`;
      const scaleW = font.widthOfTextAtSize(scaleNote, 8);
      page.drawText(scaleNote, {
        x: tx + (trimW - scaleW) / 2,
        y: ty + trimH / 2 - 55,
        size: 8, font, color: rgb(0.6, 0.6, 0.6),
      });
    }

    // 11. CMYK color calibration bar (bottom)
    const barBlockW = 20;
    const barBlockH = 8;
    const barStartX = bx;
    const barY = by - barBlockH - 6;
    for (let i = 0; i < COLOR_BAR.length; i++) {
      const { label, color } = COLOR_BAR[i];
      const bx2 = barStartX + i * (barBlockW + 2);
      page.drawRectangle({
        x: bx2, y: barY, width: barBlockW, height: barBlockH,
        color,
      });
      const lw = font.widthOfTextAtSize(label, 5);
      page.drawText(label, {
        x: bx2 + (barBlockW - lw) / 2,
        y: barY - 7,
        size: 5, font, color: rgb(0.4, 0.4, 0.4),
      });
    }

    // 12. Footer
    const footerY = 10;
    const footerText = `La Lunar Printing Inc. — lunarprint.ca — Template for: ${product} (${widthIn}" × ${heightIn}")`;
    page.drawText(footerText, {
      x: margin, y: footerY,
      size: 7, font, color: rgb(0.5, 0.5, 0.5),
    });

    // Serialize
    const pdfBytes = await pdfDoc.save();
    const fileName = `${slug}-${widthIn}x${heightIn}-template.pdf`;

    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "public, s-maxage=604800, max-age=3600",
      },
    });
  } catch (err) {
    console.error("[template-download] Error:", err);
    return NextResponse.json({ error: "Failed to generate template" }, { status: 500 });
  }
}

// ─── Drawing helpers ───

function drawDashedRect(page, x, y, w, h, color, thickness, dashPattern) {
  // Bottom
  drawDashedLine(page, x, y, x + w, y, color, thickness, dashPattern);
  // Top
  drawDashedLine(page, x, y + h, x + w, y + h, color, thickness, dashPattern);
  // Left
  drawDashedLine(page, x, y, x, y + h, color, thickness, dashPattern);
  // Right
  drawDashedLine(page, x + w, y, x + w, y + h, color, thickness, dashPattern);
}

function drawDashedLine(page, x1, y1, x2, y2, color, thickness, [dashLen, gapLen]) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len === 0) return;
  const nx = dx / len;
  const ny = dy / len;
  let pos = 0;
  while (pos < len) {
    const segEnd = Math.min(pos + dashLen, len);
    page.drawLine({
      start: { x: x1 + nx * pos, y: y1 + ny * pos },
      end: { x: x1 + nx * segEnd, y: y1 + ny * segEnd },
      color, thickness,
    });
    pos = segEnd + gapLen;
  }
}

function drawRegistrationMark(page, cx, cy, r) {
  const steps = 32;
  // Circle
  for (let i = 0; i < steps; i++) {
    const a1 = (2 * Math.PI * i) / steps;
    const a2 = (2 * Math.PI * (i + 1)) / steps;
    page.drawLine({
      start: { x: cx + r * Math.cos(a1), y: cy + r * Math.sin(a1) },
      end: { x: cx + r * Math.cos(a2), y: cy + r * Math.sin(a2) },
      color: CLR_CROP, thickness: 0.5,
    });
  }
  // Crosshair
  page.drawLine({
    start: { x: cx - r - 1, y: cy },
    end: { x: cx + r + 1, y: cy },
    color: CLR_CROP, thickness: 0.5,
  });
  page.drawLine({
    start: { x: cx, y: cy - r - 1 },
    end: { x: cx, y: cy + r + 1 },
    color: CLR_CROP, thickness: 0.5,
  });
}

function computeFoldPositions(trimW, folds, foldType) {
  if (folds === 1) {
    // Single fold: center
    return [trimW / 2];
  }
  if (folds === 2) {
    if (foldType === "tri-fold" || foldType === "roll") {
      // Roll fold: right panel slightly narrower (1/16" less at scale)
      const third = trimW / 3;
      const offset = 4.5; // ~1/16" at 72 PPI
      return [third * 2 + offset, third];
    }
    // Z-fold: equal thirds
    const third = trimW / 3;
    return [third, third * 2];
  }
  // Generic: equal divisions
  const positions = [];
  for (let i = 1; i <= folds; i++) {
    positions.push((trimW * i) / (folds + 1));
  }
  return positions;
}
