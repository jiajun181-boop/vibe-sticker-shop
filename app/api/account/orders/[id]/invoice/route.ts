import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";

// ── PDF text helpers ──────────────────────────────────────────────

/** Escape special characters inside a PDF text string (parentheses & backslash). */
function pdfEsc(str: string): string {
  return str
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

/** Format cents to dollar string, e.g. 1999 -> "$19.99" */
function fmt(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents);
  return `${sign}$${(abs / 100).toFixed(2)}`;
}

/** Format a Date to a readable string. */
function fmtDate(d: Date): string {
  return d.toLocaleDateString("en-CA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/** Truncate a string to maxLen characters, adding "..." if needed. */
function truncate(s: string, maxLen: number): string {
  if (s.length <= maxLen) return s;
  return s.slice(0, maxLen - 3) + "...";
}

// ── Raw PDF builder ───────────────────────────────────────────────

interface PdfObject {
  id: number;
  offset: number;
  content: string;
}

/**
 * Build a minimal, valid PDF document from a series of drawing commands.
 * Uses PDF operators directly: BT/ET (text blocks), Tf (font), Td (move),
 * Tj (show string), re/f (rectangle fill), rg/RG (color).
 */
function buildInvoicePdf(order: OrderData): Buffer {
  const PAGE_WIDTH = 595.28; // A4 points
  const PAGE_HEIGHT = 841.89;
  const MARGIN_LEFT = 50;
  const MARGIN_RIGHT = 50;
  const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;

  // Column positions for the items table
  const COL_QTY = MARGIN_LEFT + CONTENT_WIDTH * 0.55;
  const COL_UNIT = MARGIN_LEFT + CONTENT_WIDTH * 0.68;
  const COL_TOTAL = MARGIN_LEFT + CONTENT_WIDTH * 0.85;

  // Accumulate content stream operators
  const ops: string[] = [];
  let y = PAGE_HEIGHT - 60;

  // Helper: add a line of text
  function text(x: number, yPos: number, font: string, size: number, str: string) {
    ops.push(`BT /${font} ${size} Tf ${x.toFixed(2)} ${yPos.toFixed(2)} Td (${pdfEsc(str)}) Tj ET`);
  }

  // Helper: add a right-aligned text
  function textRight(rightX: number, yPos: number, font: string, size: number, str: string) {
    // Approximate character width: size * 0.5 for Helvetica (rough average)
    const charWidth = font === "F1" ? size * 0.58 : size * 0.52;
    const strWidth = str.length * charWidth;
    const x = rightX - strWidth;
    text(x, yPos, font, size, str);
  }

  // Helper: draw a filled rectangle
  function rect(x: number, yPos: number, w: number, h: number, r: number, g: number, b: number) {
    ops.push(`${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} rg`);
    ops.push(`${x.toFixed(2)} ${yPos.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re f`);
  }

  // Helper: draw a line
  function line(x1: number, y1: number, x2: number, y2: number, r: number, g: number, b: number, lineWidth = 0.5) {
    ops.push(`${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} RG`);
    ops.push(`${lineWidth.toFixed(2)} w`);
    ops.push(`${x1.toFixed(2)} ${y1.toFixed(2)} m ${x2.toFixed(2)} ${y2.toFixed(2)} l S`);
  }

  // Reset text color to black
  function setTextColor(r: number, g: number, b: number) {
    ops.push(`${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} rg`);
  }

  // ── Header section ──

  // Dark header background
  rect(0, PAGE_HEIGHT - 100, PAGE_WIDTH, 100, 0.129, 0.129, 0.173);

  // Company name in white
  ops.push("1.000 1.000 1.000 rg");
  text(MARGIN_LEFT, PAGE_HEIGHT - 45, "F1", 22, "La Lunar Printing");
  text(MARGIN_LEFT, PAGE_HEIGHT - 65, "F2", 9, "Professional Printing & Signage Solutions");

  // INVOICE title right-aligned
  textRight(PAGE_WIDTH - MARGIN_RIGHT, PAGE_HEIGHT - 45, "F1", 26, "INVOICE");

  // Reset text color
  setTextColor(0, 0, 0);

  y = PAGE_HEIGHT - 130;

  // ── Company contact info ──
  text(MARGIN_LEFT, y, "F2", 8, "La Lunar Printing Inc.");
  y -= 13;
  text(MARGIN_LEFT, y, "F2", 8, "Toronto, ON, Canada");
  y -= 13;
  text(MARGIN_LEFT, y, "F2", 8, "info@lalunarprinting.com");
  y -= 13;
  text(MARGIN_LEFT, y, "F2", 8, "www.lalunarprinting.com");

  // ── Order info (right column) ──
  const infoY = PAGE_HEIGHT - 130;
  const labelX = PAGE_WIDTH - MARGIN_RIGHT - 200;
  const valueX = PAGE_WIDTH - MARGIN_RIGHT - 90;

  text(labelX, infoY, "F1", 9, "Invoice #:");
  text(valueX, infoY, "F2", 9, order.id.slice(0, 12).toUpperCase());

  text(labelX, infoY - 16, "F1", 9, "Date:");
  text(valueX, infoY - 16, "F2", 9, fmtDate(order.createdAt));

  text(labelX, infoY - 32, "F1", 9, "Status:");
  text(valueX, infoY - 32, "F2", 9, order.paymentStatus.toUpperCase());

  text(labelX, infoY - 48, "F1", 9, "Currency:");
  text(valueX, infoY - 48, "F2", 9, order.currency.toUpperCase());

  // ── Divider ──
  y -= 30;
  line(MARGIN_LEFT, y, PAGE_WIDTH - MARGIN_RIGHT, y, 0.82, 0.82, 0.82);
  y -= 25;

  // ── Bill To section ──
  setTextColor(0.4, 0.4, 0.4);
  text(MARGIN_LEFT, y, "F1", 8, "BILL TO");
  setTextColor(0, 0, 0);
  y -= 16;
  if (order.customerName) {
    text(MARGIN_LEFT, y, "F1", 10, order.customerName);
    y -= 14;
  }
  text(MARGIN_LEFT, y, "F2", 9, order.customerEmail);
  y -= 14;
  if (order.customerPhone) {
    text(MARGIN_LEFT, y, "F2", 9, order.customerPhone);
    y -= 14;
  }

  y -= 15;

  // ── Items table header ──
  rect(MARGIN_LEFT, y - 4, CONTENT_WIDTH, 22, 0.949, 0.949, 0.957);
  setTextColor(0.2, 0.2, 0.2);
  text(MARGIN_LEFT + 8, y, "F1", 9, "Item");
  text(COL_QTY, y, "F1", 9, "Qty");
  text(COL_UNIT, y, "F1", 9, "Unit Price");
  textRight(PAGE_WIDTH - MARGIN_RIGHT - 8, y, "F1", 9, "Total");
  setTextColor(0, 0, 0);

  y -= 26;

  // ── Items rows ──
  let rowIndex = 0;
  for (const item of order.items) {
    // Alternating row background
    if (rowIndex % 2 === 1) {
      rect(MARGIN_LEFT, y - 6, CONTENT_WIDTH, 22, 0.976, 0.976, 0.984);
    }

    const name = truncate(item.productName, 45);
    text(MARGIN_LEFT + 8, y, "F2", 9, name);
    text(COL_QTY, y, "F2", 9, String(item.quantity));
    text(COL_UNIT, y, "F2", 9, fmt(item.unitPrice));
    textRight(PAGE_WIDTH - MARGIN_RIGHT - 8, y, "F2", 9, fmt(item.totalPrice));

    // Show specs below name if available
    const specs: string[] = [];
    if (item.widthIn && item.heightIn) specs.push(`${item.widthIn}" x ${item.heightIn}"`);
    if (item.material) specs.push(item.material);
    if (item.finishing) specs.push(item.finishing);

    if (specs.length > 0) {
      y -= 13;
      setTextColor(0.5, 0.5, 0.5);
      text(MARGIN_LEFT + 16, y, "F2", 7, truncate(specs.join("  |  "), 70));
      setTextColor(0, 0, 0);
    }

    y -= 24;
    rowIndex++;

    // Page overflow safeguard: stop if too close to bottom
    if (y < 180) {
      text(MARGIN_LEFT + 8, y, "F2", 8, "... and more items (see full order online)");
      y -= 20;
      break;
    }
  }

  // ── Divider before totals ──
  y -= 5;
  line(MARGIN_LEFT, y, PAGE_WIDTH - MARGIN_RIGHT, y, 0.82, 0.82, 0.82);
  y -= 22;

  // ── Totals section (right-aligned) ──
  const totalsLabelX = PAGE_WIDTH - MARGIN_RIGHT - 160;
  const totalsValueX = PAGE_WIDTH - MARGIN_RIGHT - 8;

  text(totalsLabelX, y, "F2", 9, "Subtotal:");
  textRight(totalsValueX, y, "F2", 9, fmt(order.subtotalAmount));
  y -= 17;

  text(totalsLabelX, y, "F2", 9, "Tax (13% HST):");
  textRight(totalsValueX, y, "F2", 9, fmt(order.taxAmount));
  y -= 17;

  text(totalsLabelX, y, "F2", 9, "Shipping:");
  textRight(totalsValueX, y, "F2", 9, fmt(order.shippingAmount));
  y -= 17;

  if (order.discountAmount > 0) {
    setTextColor(0.133, 0.545, 0.133);
    text(totalsLabelX, y, "F2", 9, "Discount:");
    textRight(totalsValueX, y, "F2", 9, "-" + fmt(order.discountAmount));
    setTextColor(0, 0, 0);
    y -= 17;
  }

  // Total line with background
  y -= 3;
  rect(totalsLabelX - 10, y - 6, PAGE_WIDTH - MARGIN_RIGHT - totalsLabelX + 18, 24, 0.129, 0.129, 0.173);
  ops.push("1.000 1.000 1.000 rg");
  text(totalsLabelX, y, "F1", 11, "Total:");
  textRight(totalsValueX, y, "F1", 11, fmt(order.totalAmount));
  setTextColor(0, 0, 0);

  // ── Footer ──
  const footerY = 60;
  line(MARGIN_LEFT, footerY + 20, PAGE_WIDTH - MARGIN_RIGHT, footerY + 20, 0.9, 0.9, 0.9);
  setTextColor(0.5, 0.5, 0.5);
  text(MARGIN_LEFT, footerY, "F2", 8, "Thank you for your order!");
  text(MARGIN_LEFT, footerY - 13, "F2", 7, "This invoice was generated automatically. If you have any questions, please contact us at info@lalunarprinting.com.");
  textRight(PAGE_WIDTH - MARGIN_RIGHT, footerY, "F2", 7, "La Lunar Printing Inc.");
  setTextColor(0, 0, 0);

  // ── Assemble PDF objects ──
  return assemblePdf(PAGE_WIDTH, PAGE_HEIGHT, ops.join("\n"));
}

/**
 * Assemble a complete, valid PDF 1.4 document from a content stream.
 * Objects: 1=Catalog, 2=Pages, 3=Page, 4=Font(Helvetica), 5=Font(Helvetica-Bold), 6=Content stream
 */
function assemblePdf(pageWidth: number, pageHeight: number, contentStream: string): Buffer {
  const objects: PdfObject[] = [];
  let body = "%PDF-1.4\n%\xC0\xC1\xC2\xC3\n"; // Header + binary comment for PDF validators

  function addObj(id: number, content: string) {
    const offset = Buffer.byteLength(body, "latin1");
    const full = `${id} 0 obj\n${content}\nendobj\n`;
    body += full;
    objects.push({ id, offset, content: full });
  }

  // 1 - Catalog
  addObj(1, "<< /Type /Catalog /Pages 2 0 R >>");

  // 2 - Pages
  addObj(2, `<< /Type /Pages /Kids [3 0 R] /Count 1 >>`);

  // 3 - Page
  addObj(
    3,
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth.toFixed(2)} ${pageHeight.toFixed(2)}] /Contents 6 0 R /Resources << /Font << /F1 5 0 R /F2 4 0 R >> >> >>`
  );

  // 4 - Font: Helvetica (regular)
  addObj(4, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>");

  // 5 - Font: Helvetica-Bold
  addObj(5, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>");

  // 6 - Content stream
  const streamBytes = Buffer.from(contentStream, "latin1");
  addObj(6, `<< /Length ${streamBytes.length} >>\nstream\n${contentStream}\nendstream`);

  // Cross-reference table
  const xrefOffset = Buffer.byteLength(body, "latin1");
  let xref = "xref\n";
  xref += `0 ${objects.length + 1}\n`;
  xref += "0000000000 65535 f \n";
  for (const obj of objects) {
    xref += `${String(obj.offset).padStart(10, "0")} 00000 n \n`;
  }

  // Trailer
  const trailer = `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  body += xref + trailer;

  return Buffer.from(body, "latin1");
}

// ── Types ─────────────────────────────────────────────────────────

interface OrderItem {
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  widthIn: number | null;
  heightIn: number | null;
  material: string | null;
  finishing: string | null;
}

interface OrderData {
  id: string;
  customerEmail: string;
  customerName: string | null;
  customerPhone: string | null;
  subtotalAmount: number;
  taxAmount: number;
  shippingAmount: number;
  discountAmount: number;
  totalAmount: number;
  currency: string;
  paymentStatus: string;
  createdAt: Date;
  items: OrderItem[];
}

// ── GET handler ───────────────────────────────────────────────────

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = getSessionFromRequest(request);
    if (!session?.userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { id } = await params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!order) {
      return new Response(JSON.stringify({ error: "Order not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Verify ownership
    if (order.userId !== session.userId) {
      return new Response(JSON.stringify({ error: "Order not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Build the PDF
    const pdfBuffer = buildInvoicePdf(order as unknown as OrderData);
    const pdfBytes = new Uint8Array(pdfBuffer);

    const shortId = order.id.slice(0, 8).toUpperCase();

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="invoice-${shortId}.pdf"`,
        "Cache-Control": "private, no-cache",
      },
    });
  } catch (err) {
    console.error("[Invoice] Error generating PDF:", err);
    return new Response(JSON.stringify({ error: "Failed to generate invoice" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
