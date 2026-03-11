import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-auth";

/**
 * GET /api/admin/production/[id]/ticket
 * Returns a printable HTML job ticket with all production-critical info.
 * Print via browser's print dialog or save as PDF.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(request, "production", "view");
  if (!auth.authenticated) return auth.response;

  try {
    const { id } = await params;

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

<button class="print-btn no-print" onclick="window.print()">Print Job Ticket</button>
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
