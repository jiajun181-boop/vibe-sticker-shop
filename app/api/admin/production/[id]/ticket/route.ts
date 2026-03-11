import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-auth";

/**
 * GET /api/admin/production/[id]/ticket
 * Returns a printable job ticket.
 *   ?format=pdf  → PDF download (pdf-lib)
 *   default      → printable HTML page
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(request, "production", "view");
  if (!auth.authenticated) return auth.response;

  try {
    const { id } = await params;
    const format = request.nextUrl.searchParams.get("format");

    const job = await prisma.productionJob.findUnique({
      where: { id },
      include: {
        orderItem: {
          select: {
            productName: true,
            quantity: true,
            material: true,
            finishing: true,
            widthIn: true,
            heightIn: true,
            fileUrl: true,
            fileName: true,
            meta: true,
            order: {
              select: {
                id: true,
                customerEmail: true,
                customerName: true,
                createdAt: true,
                deliveryMethod: true,
              },
            },
          },
        },
        factory: { select: { name: true } },
      },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const order = job.orderItem.order;
    const artworkUrl = job.artworkUrl || job.orderItem.fileUrl;
    const sizeStr = (job.widthIn || job.orderItem.widthIn) && (job.heightIn || job.orderItem.heightIn)
      ? `${job.widthIn || job.orderItem.widthIn}" × ${job.heightIn || job.orderItem.heightIn}"`
      : "—";

    // ─── PDF format ───
    if (format === "pdf") {
      const pdfBytes = await generateTicketPdf({
        jobId: job.id,
        priority: job.priority || "normal",
        createdAt: job.createdAt,
        dueAt: job.dueAt,
        productName: job.productName || job.orderItem.productName,
        isRush: job.isRush || false,
        isTwoSided: job.isTwoSided || false,
        family: job.family || null,
        quantity: job.quantity || job.orderItem.quantity,
        sizeStr,
        material: job.materialLabel || job.material || job.orderItem.material || "—",
        finishing: job.finishingLabel || job.finishing || job.orderItem.finishing || "—",
        orderId: order.id,
        customerName: order.customerName || order.customerEmail,
        factoryName: job.factory?.name || "Unassigned",
        operator: job.assignedTo || "—",
        artworkUrl: artworkUrl || null,
        notes: job.notes || null,
      });

      return new NextResponse(Buffer.from(pdfBytes), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `inline; filename="ticket-${job.id.slice(0, 8)}.pdf"`,
        },
      });
    }

    // ─── HTML format (default) ───
    const html = `<!DOCTYPE html>
<html><head>
<meta charset="utf-8">
<title>Job Ticket — ${job.id.slice(0, 8)}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #111; padding: 16px; }
  @media print {
    body { padding: 0; }
    .no-print { display: none !important; }
  }
  .ticket { max-width: 600px; border: 2px solid #000; padding: 16px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #000; padding-bottom: 12px; margin-bottom: 12px; }
  .header h1 { font-size: 20px; font-weight: 900; letter-spacing: -0.5px; }
  .header .id { font-family: monospace; font-size: 14px; font-weight: 700; }
  .header .priority { display: inline-block; padding: 2px 8px; font-size: 11px; font-weight: 900; text-transform: uppercase; border: 2px solid; }
  .priority-normal { border-color: #666; color: #666; }
  .priority-rush { border-color: #d97706; color: #d97706; background: #fef3c7; }
  .priority-urgent { border-color: #dc2626; color: #dc2626; background: #fef2f2; }
  .section { margin-bottom: 12px; }
  .section-title { font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; color: #666; margin-bottom: 4px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 16px; }
  .field { }
  .field-label { font-size: 9px; font-weight: 700; text-transform: uppercase; color: #999; }
  .field-value { font-size: 13px; font-weight: 600; }
  .field-value.large { font-size: 16px; font-weight: 900; }
  .barcode { text-align: center; margin-top: 12px; padding-top: 12px; border-top: 1px dashed #ccc; }
  .barcode-text { font-family: monospace; font-size: 16px; font-weight: 700; letter-spacing: 2px; }
  .artwork-note { margin-top: 8px; font-size: 11px; color: #666; word-break: break-all; }
  .badges { display: flex; gap: 6px; margin-top: 6px; }
  .badge { font-size: 10px; font-weight: 800; padding: 1px 6px; border: 1.5px solid; text-transform: uppercase; }
  .notes-box { margin-top: 12px; border: 1px solid #ddd; padding: 8px; min-height: 48px; font-size: 11px; color: #333; }
  .print-btn { display: block; margin: 16px auto; padding: 10px 32px; font-size: 14px; font-weight: 700; background: #000; color: #fff; border: none; cursor: pointer; }
</style>
</head>
<body>
<div class="ticket">
  <div class="header">
    <div>
      <h1>JOB TICKET</h1>
      <div class="id">${job.id.slice(0, 8)}</div>
    </div>
    <div style="text-align:right">
      <div class="priority priority-${job.priority}">${job.priority}</div>
      <div style="font-size:10px;color:#666;margin-top:4px">${new Date(job.createdAt).toLocaleDateString("en-CA")}</div>
      ${job.dueAt ? `<div style="font-size:10px;font-weight:700;color:#dc2626">DUE: ${new Date(job.dueAt).toLocaleDateString("en-CA")}</div>` : ""}
    </div>
  </div>

  <div class="section">
    <div class="section-title">Product</div>
    <div class="field">
      <div class="field-value large">${job.productName || job.orderItem.productName}</div>
    </div>
    <div class="badges">
      ${job.isRush ? '<span class="badge" style="border-color:#d97706;color:#d97706">RUSH</span>' : ""}
      ${job.isTwoSided ? '<span class="badge" style="border-color:#4f46e5;color:#4f46e5">2-SIDED</span>' : ""}
      ${job.family ? `<span class="badge" style="border-color:#666;color:#666">${job.family}</span>` : ""}
    </div>
  </div>

  <div class="section">
    <div class="section-title">Specifications</div>
    <div class="grid">
      <div class="field">
        <div class="field-label">Quantity</div>
        <div class="field-value large">${job.quantity || job.orderItem.quantity}</div>
      </div>
      <div class="field">
        <div class="field-label">Size</div>
        <div class="field-value large">${sizeStr}</div>
      </div>
      <div class="field">
        <div class="field-label">Material</div>
        <div class="field-value">${job.materialLabel || job.material || job.orderItem.material || "—"}</div>
      </div>
      <div class="field">
        <div class="field-label">Finishing</div>
        <div class="field-value">${job.finishingLabel || job.finishing || job.orderItem.finishing || "—"}</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Order & Customer</div>
    <div class="grid">
      <div class="field">
        <div class="field-label">Order</div>
        <div class="field-value">#${order.id.slice(0, 8)}</div>
      </div>
      <div class="field">
        <div class="field-label">Customer</div>
        <div class="field-value">${order.customerName || order.customerEmail}</div>
      </div>
      <div class="field">
        <div class="field-label">Factory</div>
        <div class="field-value">${job.factory?.name || "Unassigned"}</div>
      </div>
      <div class="field">
        <div class="field-label">Operator</div>
        <div class="field-value">${job.assignedTo || "—"}</div>
      </div>
    </div>
  </div>

  ${artworkUrl ? `
  <div class="section">
    <div class="section-title">Artwork</div>
    <div class="artwork-note">${artworkUrl}</div>
  </div>` : `
  <div class="section">
    <div class="section-title">Artwork</div>
    <div style="color:#dc2626;font-weight:700;font-size:11px">NO ARTWORK ON FILE</div>
  </div>`}

  ${job.notes ? `<div class="notes-box"><strong>Notes:</strong> ${job.notes}</div>` : ""}

  <div class="barcode">
    <div class="barcode-text">${job.id}</div>
    <div style="font-size:9px;color:#999;margin-top:2px">Scan or enter job ID to look up this ticket</div>
  </div>
</div>

<div class="no-print" style="text-align:center;margin-top:16px;display:flex;gap:8px;justify-content:center">
<button class="print-btn" onclick="window.print()" style="margin:0">Print</button>
<a href="?format=pdf" class="print-btn" style="margin:0;text-decoration:none;display:inline-block;text-align:center;line-height:1">Download PDF</a>
</div>
</body></html>`;

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  } catch (error) {
    console.error("[Job Ticket] Error:", error);
    return NextResponse.json({ error: "Failed to generate ticket" }, { status: 500 });
  }
}

// ─── PDF Generator ─────────────────────────────────────────

interface TicketData {
  jobId: string;
  priority: string;
  createdAt: Date;
  dueAt: Date | null;
  productName: string;
  isRush: boolean;
  isTwoSided: boolean;
  family: string | null;
  quantity: number;
  sizeStr: string;
  material: string;
  finishing: string;
  orderId: string;
  customerName: string;
  factoryName: string;
  operator: string;
  artworkUrl: string | null;
  notes: string | null;
}

async function generateTicketPdf(data: TicketData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([396, 612]); // ~5.5" × 8.5" (half letter)
  const { width, height } = page.getSize();

  const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontMono = await doc.embedFont(StandardFonts.Courier);
  const fontMonoBold = await doc.embedFont(StandardFonts.CourierBold);

  const black = rgb(0, 0, 0);
  const gray = rgb(0.4, 0.4, 0.4);
  const lightGray = rgb(0.7, 0.7, 0.7);
  const red = rgb(0.86, 0.15, 0.15);
  const amber = rgb(0.85, 0.47, 0.04);

  const margin = 24;
  let y = height - margin;

  // Helper: draw text and return new y
  function drawText(
    text: string,
    x: number,
    yPos: number,
    opts: { font?: typeof fontRegular; size?: number; color?: typeof black; maxWidth?: number } = {}
  ) {
    const font = opts.font || fontRegular;
    const size = opts.size || 10;
    const color = opts.color || black;

    // Truncate text if it would overflow
    let displayText = text;
    if (opts.maxWidth) {
      while (font.widthOfTextAtSize(displayText, size) > opts.maxWidth && displayText.length > 3) {
        displayText = displayText.slice(0, -4) + "...";
      }
    }

    page.drawText(displayText, { x, y: yPos, font, size, color });
  }

  function drawLine(yPos: number, thickness = 1) {
    page.drawLine({
      start: { x: margin, y: yPos },
      end: { x: width - margin, y: yPos },
      thickness,
      color: black,
    });
  }

  function drawDashedLine(yPos: number) {
    const dashLen = 4;
    const gapLen = 3;
    let xPos = margin;
    while (xPos < width - margin) {
      const end = Math.min(xPos + dashLen, width - margin);
      page.drawLine({
        start: { x: xPos, y: yPos },
        end: { x: end, y: yPos },
        thickness: 0.5,
        color: lightGray,
      });
      xPos += dashLen + gapLen;
    }
  }

  function sectionTitle(label: string, yPos: number): number {
    drawText(label, margin, yPos, { font: fontBold, size: 7, color: gray });
    return yPos - 14;
  }

  // ═══ HEADER ═══
  drawText("JOB TICKET", margin, y, { font: fontBold, size: 18 });
  drawText(data.jobId.slice(0, 8), margin, y - 16, { font: fontMonoBold, size: 12 });

  // Priority badge (right side)
  const priorityText = data.priority.toUpperCase();
  const prColor = data.priority === "urgent" ? red : data.priority === "rush" ? amber : gray;
  const prWidth = fontBold.widthOfTextAtSize(priorityText, 9) + 12;
  const prX = width - margin - prWidth;
  page.drawRectangle({
    x: prX,
    y: y - 12,
    width: prWidth,
    height: 16,
    borderColor: prColor,
    borderWidth: 1.5,
    color: rgb(1, 1, 1),
  });
  drawText(priorityText, prX + 6, y - 8, { font: fontBold, size: 9, color: prColor });

  // Date + due
  const dateStr = new Date(data.createdAt).toLocaleDateString("en-CA");
  drawText(dateStr, width - margin - fontRegular.widthOfTextAtSize(dateStr, 8), y - 28, {
    size: 8,
    color: gray,
  });
  if (data.dueAt) {
    const dueStr = `DUE: ${new Date(data.dueAt).toLocaleDateString("en-CA")}`;
    drawText(dueStr, width - margin - fontBold.widthOfTextAtSize(dueStr, 8), y - 38, {
      font: fontBold,
      size: 8,
      color: red,
    });
  }

  y -= 48;
  drawLine(y, 2);
  y -= 16;

  // ═══ PRODUCT ═══
  y = sectionTitle("PRODUCT", y);
  drawText(data.productName, margin, y, {
    font: fontBold,
    size: 14,
    maxWidth: width - 2 * margin,
  });
  y -= 16;

  // Badges
  let badgeX = margin;
  const badges: Array<{ label: string; color: typeof black }> = [];
  if (data.isRush) badges.push({ label: "RUSH", color: amber });
  if (data.isTwoSided) badges.push({ label: "2-SIDED", color: rgb(0.31, 0.27, 0.9) });
  if (data.family) badges.push({ label: data.family, color: gray });

  for (const badge of badges) {
    const bw = fontBold.widthOfTextAtSize(badge.label, 7) + 8;
    page.drawRectangle({
      x: badgeX,
      y: y - 2,
      width: bw,
      height: 12,
      borderColor: badge.color,
      borderWidth: 1,
      color: rgb(1, 1, 1),
    });
    drawText(badge.label, badgeX + 4, y + 1, { font: fontBold, size: 7, color: badge.color });
    badgeX += bw + 6;
  }
  if (badges.length > 0) y -= 16;

  y -= 8;

  // ═══ SPECIFICATIONS ═══
  y = sectionTitle("SPECIFICATIONS", y);
  const col2X = margin + (width - 2 * margin) / 2;

  // Row 1: Quantity + Size
  drawText("QUANTITY", margin, y, { font: fontBold, size: 6, color: lightGray });
  drawText("SIZE", col2X, y, { font: fontBold, size: 6, color: lightGray });
  y -= 12;
  drawText(String(data.quantity), margin, y, { font: fontBold, size: 14 });
  drawText(data.sizeStr, col2X, y, { font: fontBold, size: 14 });
  y -= 18;

  // Row 2: Material + Finishing
  drawText("MATERIAL", margin, y, { font: fontBold, size: 6, color: lightGray });
  drawText("FINISHING", col2X, y, { font: fontBold, size: 6, color: lightGray });
  y -= 12;
  drawText(data.material, margin, y, {
    font: fontBold,
    size: 10,
    maxWidth: (width - 2 * margin) / 2 - 8,
  });
  drawText(data.finishing, col2X, y, {
    font: fontBold,
    size: 10,
    maxWidth: (width - 2 * margin) / 2 - 8,
  });
  y -= 18;

  // ═══ ORDER & CUSTOMER ═══
  y = sectionTitle("ORDER & CUSTOMER", y);

  drawText("ORDER", margin, y, { font: fontBold, size: 6, color: lightGray });
  drawText("CUSTOMER", col2X, y, { font: fontBold, size: 6, color: lightGray });
  y -= 12;
  drawText(`#${data.orderId.slice(0, 8)}`, margin, y, { font: fontBold, size: 10 });
  drawText(data.customerName, col2X, y, {
    font: fontBold,
    size: 10,
    maxWidth: (width - 2 * margin) / 2 - 8,
  });
  y -= 16;

  drawText("FACTORY", margin, y, { font: fontBold, size: 6, color: lightGray });
  drawText("OPERATOR", col2X, y, { font: fontBold, size: 6, color: lightGray });
  y -= 12;
  drawText(data.factoryName, margin, y, { font: fontBold, size: 10 });
  drawText(data.operator, col2X, y, { font: fontBold, size: 10 });
  y -= 18;

  // ═══ ARTWORK ═══
  y = sectionTitle("ARTWORK", y);
  if (data.artworkUrl) {
    // Truncate long URLs across lines
    const url = data.artworkUrl;
    const chunkSize = 60;
    for (let i = 0; i < url.length && i < chunkSize * 3; i += chunkSize) {
      drawText(url.slice(i, i + chunkSize), margin, y, { font: fontMono, size: 7, color: gray });
      y -= 10;
    }
  } else {
    drawText("NO ARTWORK ON FILE", margin, y, { font: fontBold, size: 10, color: red });
    y -= 14;
  }

  // ═══ NOTES ═══
  if (data.notes) {
    y -= 4;
    y = sectionTitle("NOTES", y);
    // Word-wrap notes
    const words = data.notes.split(/\s+/);
    let line = "";
    const maxW = width - 2 * margin;
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (fontRegular.widthOfTextAtSize(test, 9) > maxW) {
        drawText(line, margin, y, { size: 9 });
        y -= 12;
        line = word;
      } else {
        line = test;
      }
    }
    if (line) {
      drawText(line, margin, y, { size: 9 });
      y -= 12;
    }
  }

  // ═══ BARCODE / JOB ID FOOTER ═══
  y -= 8;
  drawDashedLine(y);
  y -= 20;
  const idText = data.jobId;
  const idWidth = fontMonoBold.widthOfTextAtSize(idText, 12);
  drawText(idText, (width - idWidth) / 2, y, { font: fontMonoBold, size: 12 });
  y -= 12;
  const hint = "Scan or enter job ID to look up this ticket";
  const hintWidth = fontRegular.widthOfTextAtSize(hint, 7);
  drawText(hint, (width - hintWidth) / 2, y, { size: 7, color: lightGray });

  return doc.save();
}
