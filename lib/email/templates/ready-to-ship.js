export function buildReadyToShipHtml(order) {
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
          <div style="display:inline-block;width:48px;height:48px;background:#dbeafe;border-radius:50%;line-height:48px;font-size:24px;">📦</div>
          <h2 style="margin:12px 0 4px;font-size:22px;color:#111;">Ready to Ship!</h2>
          <p style="margin:0;color:#666;font-size:14px;">Order #${order.id.slice(0, 8)}</p>
        </div>

        <p style="font-size:14px;color:#666;line-height:1.6;margin-bottom:16px;">
          ${order.customerName ? `Hi ${order.customerName}, ` : ""}Your order has been packed and is ready to ship. You'll receive tracking information shortly.
        </p>

        <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:20px;text-align:center;margin-bottom:24px;">
          <p style="margin:0;font-size:14px;color:#1e40af;font-weight:600;">Tracking details will follow in a separate email.</p>
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
