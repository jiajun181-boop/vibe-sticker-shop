import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-auth";
import { HST_RATE, SHIPPING_COST } from "@/lib/order-config";

/**
 * GET /api/admin/quotes/[id]/pdf
 *
 * Returns a print-optimized HTML page for a quote.
 * The admin can open this in a browser and Ctrl+P / Cmd+P to save as PDF.
 *
 * We cannot use puppeteer/wkhtmltopdf on Vercel serverless, so we serve
 * a clean HTML document with @media print CSS instead.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(request, "quotes", "view");
  if (!auth.authenticated) return auth.response;

  try {
    const { id } = await params;

    const quote = await prisma.quoteRequest.findUnique({ where: { id } });
    if (!quote) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    }

    // ── Money formatting ──────────────────────────────────────────────
    const fmtCAD = (cents: number) =>
      new Intl.NumberFormat("en-CA", {
        style: "currency",
        currency: "CAD",
      }).format(cents / 100);

    // ── Dates ─────────────────────────────────────────────────────────
    const fmtDate = (d: Date) =>
      d.toLocaleDateString("en-CA", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

    const quoteDate = quote.quotedAt ? new Date(quote.quotedAt) : new Date(quote.createdAt);
    const validUntilDate = new Date(quoteDate);
    validUntilDate.setDate(validUntilDate.getDate() + 30);

    // ── Build line items from quote fields ────────────────────────────
    // The QuoteRequest model stores a single product request with individual
    // fields (productType, quantity, material, etc.) rather than an items array.
    const specs: string[] = [];
    if (quote.material) specs.push(quote.material);
    if (quote.colorMode) specs.push(quote.colorMode);
    if (quote.widthIn && quote.heightIn) {
      specs.push(`${quote.widthIn}" x ${quote.heightIn}"`);
    }
    if (quote.isRush) specs.push("Rush");

    const productName = quote.productType || "Custom Print";
    const quantity = quote.quantity || 1;
    const hasQuotedAmount = quote.quotedAmountCents != null && quote.quotedAmountCents > 0;
    const subtotalCents = hasQuotedAmount ? quote.quotedAmountCents! : 0;
    const unitPriceCents = quantity > 0 ? Math.round(subtotalCents / quantity) : 0;

    // ── Tax & shipping ────────────────────────────────────────────────
    const taxCents = Math.round(subtotalCents * HST_RATE);
    const shippingCents = subtotalCents > 0 ? SHIPPING_COST : 0;
    const totalCents = subtotalCents + taxCents + shippingCents;

    // ── Escaped helper (prevent XSS in HTML output) ───────────────────
    const esc = (s: string | null | undefined): string =>
      (s || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");

    // ── HTML template ─────────────────────────────────────────────────
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Quote ${esc(quote.reference)} — La Lunar Printing</title>
  <style>
    /* ── Reset & Base ─────────────────────────────────── */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #1a1a1a;
      background: #f5f5f5;
      padding: 2rem;
      line-height: 1.5;
    }

    .page {
      max-width: 800px;
      margin: 0 auto;
      background: #fff;
      padding: 3rem;
      border-radius: 8px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.08);
    }

    /* ── Header ───────────────────────────────────────── */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 3px solid #1a1a1a;
      padding-bottom: 1.5rem;
      margin-bottom: 2rem;
    }
    .company h1 {
      font-size: 1.5rem;
      font-weight: 700;
      letter-spacing: -0.02em;
    }
    .company p {
      font-size: 0.85rem;
      color: #555;
      margin-top: 0.25rem;
    }
    .quote-badge {
      text-align: right;
    }
    .quote-badge h2 {
      font-size: 1.75rem;
      font-weight: 700;
      color: #2563eb;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .quote-badge .ref {
      font-size: 0.95rem;
      color: #555;
      margin-top: 0.25rem;
    }

    /* ── Meta grid ────────────────────────────────────── */
    .meta {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
      margin-bottom: 2rem;
    }
    .meta-box {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      padding: 1rem 1.25rem;
    }
    .meta-box h3 {
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #6b7280;
      margin-bottom: 0.5rem;
    }
    .meta-box p {
      font-size: 0.9rem;
      margin-top: 0.15rem;
    }

    /* ── Items table ──────────────────────────────────── */
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 1.5rem;
    }
    thead th {
      background: #1a1a1a;
      color: #fff;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      padding: 0.7rem 1rem;
      text-align: left;
    }
    thead th:last-child,
    thead th:nth-child(3),
    thead th:nth-child(4) {
      text-align: right;
    }
    tbody td {
      padding: 0.75rem 1rem;
      font-size: 0.9rem;
      border-bottom: 1px solid #e5e7eb;
      vertical-align: top;
    }
    tbody td:last-child,
    tbody td:nth-child(3),
    tbody td:nth-child(4) {
      text-align: right;
      white-space: nowrap;
    }
    .specs {
      font-size: 0.8rem;
      color: #6b7280;
      margin-top: 0.2rem;
    }

    /* ── Totals ───────────────────────────────────────── */
    .totals {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 2rem;
    }
    .totals-table {
      width: 280px;
    }
    .totals-table .row {
      display: flex;
      justify-content: space-between;
      padding: 0.4rem 0;
      font-size: 0.9rem;
    }
    .totals-table .row.grand {
      border-top: 2px solid #1a1a1a;
      margin-top: 0.5rem;
      padding-top: 0.6rem;
      font-weight: 700;
      font-size: 1.05rem;
    }

    /* ── Description ──────────────────────────────────── */
    .description-section {
      margin-bottom: 2rem;
    }
    .description-section h3 {
      font-size: 0.8rem;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #6b7280;
      margin-bottom: 0.5rem;
    }
    .description-section p {
      font-size: 0.9rem;
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      padding: 0.75rem 1rem;
      white-space: pre-wrap;
    }

    /* ── Terms / Footer ───────────────────────────────── */
    .terms {
      border-top: 1px solid #e5e7eb;
      padding-top: 1.25rem;
      margin-top: 1rem;
    }
    .terms h3 {
      font-size: 0.8rem;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #6b7280;
      margin-bottom: 0.5rem;
    }
    .terms ul {
      list-style: none;
      font-size: 0.85rem;
      color: #555;
    }
    .terms ul li::before {
      content: "\\2022";
      color: #2563eb;
      display: inline-block;
      width: 1em;
    }
    .footer {
      text-align: center;
      margin-top: 2rem;
      font-size: 0.8rem;
      color: #9ca3af;
    }

    /* ── No-quote banner ──────────────────────────────── */
    .no-quote-banner {
      background: #fef3c7;
      border: 1px solid #f59e0b;
      color: #92400e;
      border-radius: 6px;
      padding: 0.75rem 1rem;
      font-size: 0.9rem;
      margin-bottom: 1.5rem;
      text-align: center;
    }

    /* ── Print button (hidden on print) ───────────────── */
    .print-bar {
      max-width: 800px;
      margin: 0 auto 1rem;
      text-align: right;
    }
    .print-bar button {
      background: #2563eb;
      color: #fff;
      border: none;
      padding: 0.6rem 1.5rem;
      border-radius: 6px;
      font-size: 0.9rem;
      cursor: pointer;
    }
    .print-bar button:hover { background: #1d4ed8; }

    /* ── Print styles ─────────────────────────────────── */
    @media print {
      body {
        background: #fff;
        padding: 0;
        margin: 0;
      }
      .page {
        box-shadow: none;
        border-radius: 0;
        padding: 1.5cm;
        max-width: none;
      }
      .print-bar { display: none; }
      thead th {
        background: #1a1a1a !important;
        color: #fff !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .meta-box {
        background: #f9fafb !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .no-quote-banner {
        background: #fef3c7 !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      @page {
        size: letter;
        margin: 1cm;
      }
    }
  </style>
</head>
<body>
  <div class="print-bar">
    <button onclick="window.print()">Print / Save as PDF</button>
  </div>

  <div class="page">
    <!-- Header -->
    <div class="header">
      <div class="company">
        <h1>La Lunar Printing</h1>
        <p>1555 Midland Ave, Toronto ON M1P 3C2</p>
        <p>lunarprint.ca</p>
      </div>
      <div class="quote-badge">
        <h2>Quote</h2>
        <p class="ref">${esc(quote.reference)}</p>
      </div>
    </div>

    <!-- Meta -->
    <div class="meta">
      <div class="meta-box">
        <h3>Customer</h3>
        <p><strong>${esc(quote.customerName)}</strong></p>
        <p>${esc(quote.customerEmail)}</p>
        ${quote.customerPhone ? `<p>${esc(quote.customerPhone)}</p>` : ""}
        ${quote.companyName ? `<p>${esc(quote.companyName)}</p>` : ""}
      </div>
      <div class="meta-box">
        <h3>Quote Details</h3>
        <p><strong>Date:</strong> ${fmtDate(quoteDate)}</p>
        <p><strong>Valid Until:</strong> ${fmtDate(validUntilDate)}</p>
        <p><strong>Status:</strong> ${esc(quote.status)}</p>
        ${quote.quotedBy ? `<p><strong>Quoted By:</strong> ${esc(quote.quotedBy)}</p>` : ""}
      </div>
    </div>

    ${!hasQuotedAmount ? `<div class="no-quote-banner">This quote has not been priced yet. Amounts shown are placeholders.</div>` : ""}

    <!-- Items table -->
    <table>
      <thead>
        <tr>
          <th>Product</th>
          <th>Specs</th>
          <th>Qty</th>
          <th>Unit Price</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>${esc(productName)}</td>
          <td><span class="specs">${specs.length > 0 ? esc(specs.join(" / ")) : "&mdash;"}</span></td>
          <td style="text-align:right">${quantity.toLocaleString("en-CA")}</td>
          <td>${hasQuotedAmount ? fmtCAD(unitPriceCents) : "&mdash;"}</td>
          <td>${hasQuotedAmount ? fmtCAD(subtotalCents) : "&mdash;"}</td>
        </tr>
      </tbody>
    </table>

    <!-- Totals -->
    <div class="totals">
      <div class="totals-table">
        <div class="row">
          <span>Subtotal</span>
          <span>${hasQuotedAmount ? fmtCAD(subtotalCents) : "&mdash;"}</span>
        </div>
        <div class="row">
          <span>HST (13%)</span>
          <span>${hasQuotedAmount ? fmtCAD(taxCents) : "&mdash;"}</span>
        </div>
        <div class="row">
          <span>Shipping</span>
          <span>${hasQuotedAmount ? fmtCAD(shippingCents) : "&mdash;"}</span>
        </div>
        <div class="row grand">
          <span>Total (CAD)</span>
          <span>${hasQuotedAmount ? fmtCAD(totalCents) : "&mdash;"}</span>
        </div>
      </div>
    </div>

    ${quote.description ? `
    <div class="description-section">
      <h3>Project Description</h3>
      <p>${esc(quote.description)}</p>
    </div>
    ` : ""}

    ${quote.neededBy ? `
    <div class="description-section">
      <h3>Needed By</h3>
      <p>${esc(quote.neededBy)}</p>
    </div>
    ` : ""}

    <!-- Terms -->
    <div class="terms">
      <h3>Terms &amp; Conditions</h3>
      <ul>
        <li>Valid for 30 days from quote date. Prices in CAD.</li>
        <li>13% Ontario HST applied at checkout.</li>
        <li>Standard shipping included. Rush orders may incur additional fees.</li>
        <li>Final pricing subject to artwork review and proof approval.</li>
        <li>Payment due upon order confirmation via Stripe or e-Transfer.</li>
      </ul>
    </div>

    <div class="footer">
      <p>La Lunar Printing &mdash; lunarprint.ca &mdash; Toronto, Ontario</p>
    </div>
  </div>
</body>
</html>`;

    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        // Suggest a filename if the browser offers download
        "Content-Disposition": `inline; filename="Quote-${quote.reference}.html"`,
        // Prevent caching of authenticated content
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error) {
    console.error("[Admin Quote PDF] Error:", error);
    return NextResponse.json(
      { error: "Failed to generate quote document" },
      { status: 500 }
    );
  }
}
