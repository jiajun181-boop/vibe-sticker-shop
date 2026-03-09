import { escapeHtml } from "../escape-html";

const formatCad = (cents) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);

export function buildOrderCanceledHtml(order, reason) {
  const safeName = escapeHtml(order.customerName);
  const safeReason = escapeHtml(reason);
  const itemRows = (order.items || [])
    .map(
      (item) => `
        <tr>
          <td style="padding:6px 0;color:#111;">${escapeHtml(item.productName)}</td>
          <td style="padding:6px 0;text-align:right;color:#666;">x${item.quantity}</td>
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
          <div style="display:inline-block;width:48px;height:48px;background:#fee2e2;border-radius:50%;line-height:48px;font-size:24px;">✕</div>
          <h2 style="margin:12px 0 4px;font-size:22px;color:#111;">Order Canceled</h2>
          <p style="margin:0;color:#666;font-size:14px;">Order #${order.id.slice(0, 8)}</p>
        </div>

        <p style="font-size:14px;color:#666;line-height:1.6;">
          Hi${safeName ? ` ${safeName}` : ""},
        </p>
        <p style="font-size:14px;color:#666;line-height:1.6;">
          Your order has been canceled.${safeReason ? ` Reason: ${safeReason}` : ""} If you were charged, a refund will be processed automatically.
        </p>

        ${itemRows ? `
        <div style="background:#f9fafb;border-radius:12px;padding:20px;margin:24px 0;">
          <p style="margin:0 0 8px;font-size:12px;font-weight:600;color:#999;text-transform:uppercase;letter-spacing:0.05em;">Items</p>
          <table style="width:100%;border-collapse:collapse;font-size:14px;">${itemRows}</table>
        </div>
        ` : ""}

        ${order.totalAmount ? `
        <div style="background:#f9fafb;border-radius:12px;padding:16px 20px;margin-bottom:24px;">
          <table style="width:100%;border-collapse:collapse;font-size:14px;">
            <tr>
              <td style="padding:4px 0;color:#666;">Order Total</td>
              <td style="padding:4px 0;text-align:right;font-weight:600;color:#111;">${formatCad(order.totalAmount)}</td>
            </tr>
          </table>
        </div>
        ` : ""}

        <p style="font-size:14px;color:#666;line-height:1.6;">
          If you have questions or believe this was a mistake, please reply to this email or contact us at
          <a href="mailto:info@lalunarprinting.com" style="color:#111;font-weight:600;">info@lalunarprinting.com</a>.
        </p>

        <div style="text-align:center;margin-top:24px;">
          <a href="${process.env.NEXT_PUBLIC_BASE_URL || "https://lunarprint.ca"}/shop" style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:12px 32px;border-radius:8px;font-size:14px;font-weight:600;">
            Browse Our Products
          </a>
        </div>
      </div>

      <div style="padding:16px 32px;background:#f9fafb;text-align:center;">
        <p style="margin:0;font-size:12px;color:#999;">La Lunar Printing Inc. &middot; Toronto, ON</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}
