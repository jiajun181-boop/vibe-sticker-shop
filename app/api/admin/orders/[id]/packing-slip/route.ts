import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-auth";
import { isProductionItem } from "@/lib/order-item-utils";

/**
 * GET /api/admin/orders/[id]/packing-slip
 *
 * Returns an HTML packing slip ready for window.print().
 * Includes: order ID, date, customer, item list, quantities, notes.
 * Excludes: pricing (packing slips should not show costs).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(request, "orders", "view");
  if (!auth.authenticated) return auth.response;

  const { id } = await params;

  try {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        notes: {
          where: { isInternal: false },
          orderBy: { createdAt: "desc" },
          take: 3,
        },
        user: {
          select: {
            addresses: {
              where: { isDefaultShipping: true },
              take: 1,
            },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const shippingAddr = order.user?.addresses?.[0];
    const productionItems = order.items.filter(isProductionItem);
    const isRush = order.priority === 0 || (order.tags as string[] || []).includes("rush");

    const html = buildPackingSlipHtml({
      orderId: order.id,
      orderDate: order.createdAt,
      customerName: order.customerName || "",
      customerEmail: order.customerEmail || "",
      items: productionItems.map((item) => {
        const meta = item.meta && typeof item.meta === "object" ? item.meta as Record<string, unknown> : {};
        return {
          name: item.productName || "Item",
          quantity: item.quantity,
          specs: buildSpecsLine(item, meta),
        };
      }),
      shippingAddress: shippingAddr
        ? [
            shippingAddr.line1,
            shippingAddr.line2,
            [shippingAddr.city, shippingAddr.state].filter(Boolean).join(", "),
            shippingAddr.postalCode,
          ].filter(Boolean).join(", ")
        : null,
      notes: order.notes.map((n: any) => n.message).filter(Boolean),
      isRush,
    });

    return new NextResponse(html, {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (err) {
    console.error("[Packing slip] Error:", err);
    return NextResponse.json({ error: "Failed to generate packing slip" }, { status: 500 });
  }
}

function buildSpecsLine(item: any, meta: Record<string, unknown>): string {
  const parts: string[] = [];
  const w = item.widthIn || meta.width;
  const h = item.heightIn || meta.height;
  if (w && h) parts.push(`${w}" × ${h}"`);
  const size = meta.sizeLabel || meta.size;
  if (size && !parts.length) parts.push(String(size));
  const material = item.material || meta.material || meta.stock;
  if (material) parts.push(String(material));
  const finishing = item.finishing || meta.finishing;
  if (finishing) parts.push(String(finishing));
  if (meta.sides === "double" || meta.doubleSided) parts.push("Double-sided");
  return parts.join(" · ");
}

function buildPackingSlipHtml(data: {
  orderId: string;
  orderDate: Date;
  customerName: string;
  customerEmail: string;
  items: Array<{ name: string; quantity: number; specs: string }>;
  shippingAddress: string | null;
  notes: string[];
  isRush: boolean;
}) {
  const date = new Date(data.orderDate).toLocaleDateString("en-CA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const itemRows = data.items
    .map(
      (item, i) => `
    <tr style="${i % 2 === 1 ? "background:#fafafa;" : ""}">
      <td style="padding:8px 12px;border-bottom:1px solid #eee;">${escapeHtml(item.name)}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center;font-weight:600;">${item.quantity}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;color:#666;font-size:12px;">${escapeHtml(item.specs)}</td>
    </tr>`
    )
    .join("");

  const rushBanner = data.isRush
    ? `<div style="background:#fee2e2;color:#991b1b;padding:8px 16px;font-weight:700;font-size:14px;text-align:center;border-radius:6px;margin-bottom:16px;">⚡ RUSH ORDER</div>`
    : "";

  const addressBlock = data.shippingAddress
    ? `<div style="margin-top:16px;">
        <p style="font-size:11px;color:#999;text-transform:uppercase;letter-spacing:0.5px;margin:0 0 4px;">Ship To</p>
        <p style="margin:0;font-size:13px;">${escapeHtml(data.customerName)}</p>
        <p style="margin:0;font-size:13px;color:#444;">${escapeHtml(data.shippingAddress)}</p>
       </div>`
    : "";

  const notesBlock =
    data.notes.length > 0
      ? `<div style="margin-top:16px;padding:10px 14px;background:#fffbeb;border:1px solid #fde68a;border-radius:6px;">
          <p style="font-size:11px;color:#92400e;text-transform:uppercase;letter-spacing:0.5px;margin:0 0 6px;font-weight:600;">Customer Notes</p>
          ${data.notes.map((n) => `<p style="margin:0 0 4px;font-size:12px;color:#78350f;">${escapeHtml(n)}</p>`).join("")}
         </div>`
      : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Packing Slip — #${data.orderId.slice(0, 8)}</title>
  <style>
    @media print {
      body { margin: 0; }
      .no-print { display: none !important; }
    }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #111; max-width: 680px; margin: 24px auto; padding: 0 16px; }
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; padding: 8px 12px; border-bottom: 2px solid #333; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #555; }
    th:nth-child(2) { text-align: center; }
  </style>
</head>
<body>
  <div class="no-print" style="text-align:right;margin-bottom:12px;">
    <button onclick="window.print()" style="padding:8px 20px;background:#111;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:13px;">Print</button>
  </div>

  ${rushBanner}

  <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:1px solid #ddd;padding-bottom:12px;margin-bottom:16px;">
    <div>
      <h1 style="margin:0;font-size:20px;">La Lunar Printing</h1>
      <p style="margin:4px 0 0;font-size:12px;color:#666;">Packing Slip</p>
    </div>
    <div style="text-align:right;">
      <p style="margin:0;font-size:14px;font-weight:600;">Order #${data.orderId.slice(0, 8)}</p>
      <p style="margin:2px 0 0;font-size:12px;color:#666;">${date}</p>
    </div>
  </div>

  <div style="display:flex;justify-content:space-between;gap:24px;">
    <div>
      <p style="font-size:11px;color:#999;text-transform:uppercase;letter-spacing:0.5px;margin:0 0 4px;">Customer</p>
      <p style="margin:0;font-size:13px;font-weight:500;">${escapeHtml(data.customerName)}</p>
      <p style="margin:0;font-size:12px;color:#666;">${escapeHtml(data.customerEmail)}</p>
    </div>
    ${addressBlock ? `<div style="text-align:right;">${addressBlock}</div>` : ""}
  </div>

  <table style="margin-top:20px;">
    <thead>
      <tr>
        <th>Item</th>
        <th>Qty</th>
        <th>Specs</th>
      </tr>
    </thead>
    <tbody>
      ${itemRows}
    </tbody>
  </table>

  <div style="margin-top:16px;padding-top:12px;border-top:1px solid #ddd;text-align:right;">
    <p style="margin:0;font-size:13px;color:#666;">Total items: <strong>${data.items.reduce((s, i) => s + i.quantity, 0)}</strong></p>
  </div>

  ${notesBlock}

  <div style="margin-top:32px;padding-top:12px;border-top:1px solid #eee;text-align:center;">
    <p style="margin:0;font-size:11px;color:#aaa;">Thank you for choosing La Lunar Printing · lunarprint.ca</p>
  </div>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
