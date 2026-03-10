import { escapeHtml } from "../escape-html";
import { formatCad } from "@/lib/product-helpers";

export function buildInvoiceConfirmationHtml({ orderId, customerName, companyName, totalAmount, paymentTerms, items }) {
  const safeName = escapeHtml(customerName);
  const safeCompany = escapeHtml(companyName);
  const termsLabel = { net15: "Net 15", net30: "Net 30", net45: "Net 45" }[paymentTerms] || "Net 30";

  const itemRows = (items || [])
    .map(
      (item) => `
      <tr>
        <td style="padding:8px 0;font-size:14px;color:#333;border-bottom:1px solid #eee;">${escapeHtml(item.name)}</td>
        <td style="padding:8px 0;font-size:14px;color:#666;text-align:center;border-bottom:1px solid #eee;">${item.quantity}</td>
        <td style="padding:8px 0;font-size:14px;font-weight:600;color:#111;text-align:right;border-bottom:1px solid #eee;">${formatCad(item.unitPrice * item.quantity)}</td>
      </tr>`
    )
    .join("");

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
      <div style="background:#111;color:#fff;padding:24px 32px;">
        <h1 style="margin:0;font-size:20px;font-weight:600;letter-spacing:0.05em;">LA LUNAR PRINTING INC.</h1>
      </div>
      <div style="padding:32px;">
        <div style="text-align:center;margin-bottom:24px;">
          <div style="display:inline-block;width:48px;height:48px;background:#dbeafe;border-radius:50%;line-height:48px;font-size:24px;">📋</div>
          <h2 style="margin:12px 0 4px;font-size:22px;color:#111;">Invoice Order Received</h2>
          <p style="margin:0;color:#666;font-size:14px;">Order #${orderId.slice(0, 8)}</p>
        </div>

        <p style="font-size:14px;color:#666;line-height:1.6;margin-bottom:16px;">
          ${safeName ? `Hi ${safeName}, ` : ""}Thank you for your order! We've received your invoice request and our team will process it shortly.
        </p>

        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:20px;margin-bottom:24px;">
          <table style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="padding:6px 0;font-size:14px;color:#666;">Order:</td>
              <td style="padding:6px 0;font-size:14px;font-weight:600;color:#111;">#${orderId.slice(0, 8)}</td>
            </tr>
            ${safeCompany ? `<tr>
              <td style="padding:6px 0;font-size:14px;color:#666;">Company:</td>
              <td style="padding:6px 0;font-size:14px;font-weight:600;color:#111;">${safeCompany}</td>
            </tr>` : ""}
            <tr>
              <td style="padding:6px 0;font-size:14px;color:#666;">Payment Terms:</td>
              <td style="padding:6px 0;font-size:14px;font-weight:600;color:#111;">${termsLabel}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;font-size:14px;color:#666;">Total:</td>
              <td style="padding:6px 0;font-size:18px;font-weight:700;color:#111;">${formatCad(totalAmount)}</td>
            </tr>
          </table>
        </div>

        ${itemRows ? `
        <h3 style="font-size:14px;font-weight:600;color:#111;margin-bottom:8px;">Order Items</h3>
        <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
          <thead>
            <tr>
              <th style="padding:8px 0;font-size:12px;color:#999;text-align:left;border-bottom:2px solid #eee;">Item</th>
              <th style="padding:8px 0;font-size:12px;color:#999;text-align:center;border-bottom:2px solid #eee;">Qty</th>
              <th style="padding:8px 0;font-size:12px;color:#999;text-align:right;border-bottom:2px solid #eee;">Amount</th>
            </tr>
          </thead>
          <tbody>${itemRows}</tbody>
        </table>
        ` : ""}

        <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:16px;margin-bottom:24px;">
          <p style="margin:0;font-size:13px;color:#1e40af;">
            <strong>What's Next?</strong><br>
            1. Our team will review your order and prepare an invoice.<br>
            2. You'll receive the invoice via email within 1 business day.<br>
            3. Production begins once payment is confirmed.
          </p>
        </div>

        <p style="font-size:14px;color:#666;line-height:1.6;">
          Questions? Reply to this email or contact us at
          <a href="mailto:info@lalunarprinting.com" style="color:#111;font-weight:600;">info@lalunarprinting.com</a>.
        </p>
      </div>
      <div style="padding:16px 32px;background:#f9fafb;text-align:center;">
        <p style="margin:0;font-size:12px;color:#999;">La Lunar Printing Inc. · Toronto, ON</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}
