import { escapeHtml } from "../escape-html";
import { HST_RATE } from "@/lib/order-config";

const formatCad = (cents) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);

/**
 * Build a professional self-service quote email.
 *
 * @param {Object} opts
 * @param {string} opts.productName    — e.g. "Business Cards"
 * @param {Array}  opts.summaryLines   — [{ label, value }]
 * @param {number} opts.unitCents
 * @param {number} opts.subtotalCents
 * @param {number} opts.quantity
 * @param {string} opts.pageUrl        — link back to configurator
 */
export function buildSelfQuoteHtml({
  productName,
  summaryLines = [],
  unitCents = 0,
  subtotalCents = 0,
  quantity = 1,
  pageUrl,
}) {
  const safeName = escapeHtml(productName);
  const safeUrl = escapeHtml(pageUrl || "https://lunarprint.ca");

  const configRows = summaryLines
    .map(
      (r) => `
      <tr>
        <td style="padding:6px 0;font-size:13px;color:#6b7280;border-bottom:1px solid #f3f4f6;">${escapeHtml(r.label)}</td>
        <td style="padding:6px 0;font-size:13px;color:#111;font-weight:600;text-align:right;border-bottom:1px solid #f3f4f6;">${escapeHtml(r.value)}</td>
      </tr>`
    )
    .join("");

  const expiryDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const expiryStr = expiryDate.toLocaleDateString("en-CA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const taxEstimate = Math.round(subtotalCents * HST_RATE);
  const totalEstimate = subtotalCents + taxEstimate;

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">

      <!-- Header -->
      <div style="background:linear-gradient(135deg,#111 0%,#1a1a2e 100%);color:#fff;padding:28px 32px;">
        <h1 style="margin:0;font-size:18px;font-weight:600;letter-spacing:0.08em;">LA LUNAR PRINTING INC.</h1>
        <p style="margin:6px 0 0;font-size:12px;color:#9ca3af;letter-spacing:0.04em;">YOUR QUOTE</p>
      </div>

      <div style="padding:32px;">
        <!-- Product name -->
        <h2 style="margin:0 0 20px;font-size:20px;font-weight:800;color:#111;">${safeName}</h2>

        <!-- Configuration details -->
        <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
          <tbody>${configRows}</tbody>
        </table>

        <!-- Price breakdown -->
        <div style="background:#f9fafb;border-radius:12px;padding:20px;margin-bottom:24px;">
          <table style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="padding:4px 0;font-size:13px;color:#6b7280;">Unit Price</td>
              <td style="padding:4px 0;font-size:13px;color:#111;font-weight:600;text-align:right;">${formatCad(unitCents)}</td>
            </tr>
            <tr>
              <td style="padding:4px 0;font-size:13px;color:#6b7280;">Quantity</td>
              <td style="padding:4px 0;font-size:13px;color:#111;font-weight:600;text-align:right;">${quantity.toLocaleString()}</td>
            </tr>
            <tr>
              <td style="padding:8px 0 4px;font-size:13px;color:#6b7280;border-top:1px solid #e5e7eb;">Subtotal</td>
              <td style="padding:8px 0 4px;font-size:13px;color:#111;font-weight:600;text-align:right;border-top:1px solid #e5e7eb;">${formatCad(subtotalCents)}</td>
            </tr>
            <tr>
              <td style="padding:4px 0;font-size:13px;color:#6b7280;">Est. Tax (HST 13%)</td>
              <td style="padding:4px 0;font-size:13px;color:#6b7280;text-align:right;">${formatCad(taxEstimate)}</td>
            </tr>
            <tr>
              <td style="padding:8px 0 0;font-size:16px;font-weight:800;color:#111;border-top:2px solid #111;">Estimated Total</td>
              <td style="padding:8px 0 0;font-size:16px;font-weight:800;color:#111;text-align:right;border-top:2px solid #111;">${formatCad(totalEstimate)} CAD</td>
            </tr>
          </table>
        </div>

        <!-- CTA Button -->
        <div style="text-align:center;margin-bottom:24px;">
          <a href="${safeUrl}" style="display:inline-block;background:#111;color:#fff;padding:14px 32px;border-radius:8px;font-size:14px;font-weight:700;text-decoration:none;letter-spacing:0.04em;">
            Continue Your Order &rarr;
          </a>
        </div>

        <!-- Validity notice -->
        <div style="background:#fefce8;border:1px solid #fde68a;border-radius:10px;padding:12px 16px;margin-bottom:24px;text-align:center;">
          <p style="margin:0;font-size:12px;color:#92400e;">
            <strong>This quote is valid for 7 days</strong> (until ${expiryStr}).<br/>
            Prices may change after this date.
          </p>
        </div>

        <!-- Contact -->
        <p style="font-size:13px;color:#666;text-align:center;">
          Questions? Contact us at
          <a href="mailto:support@lunarprint.ca" style="color:#111;font-weight:600;">support@lunarprint.ca</a>
          or call <a href="tel:+16476990549" style="color:#111;font-weight:600;">+1 (647) 699-0549</a>
        </p>
      </div>

      <!-- Footer -->
      <div style="background:#f9fafb;padding:16px;text-align:center;font-size:11px;color:#999;">
        &copy; ${new Date().getFullYear()} La Lunar Printing Inc. &mdash; Toronto, ON, Canada
      </div>
    </div>
  </div>
</body>
</html>`;
}
