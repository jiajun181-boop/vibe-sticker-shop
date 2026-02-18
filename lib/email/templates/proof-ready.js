const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://lunarprint.ca";

export function buildProofReadyHtml(order, extra = {}) {
  const proofUrl = extra?.proofUrl || `${SITE_URL}/account/orders/${order.id}`;

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
          <div style="display:inline-block;width:48px;height:48px;background:#fef3c7;border-radius:50%;line-height:48px;font-size:24px;">🖼️</div>
          <h2 style="margin:12px 0 4px;font-size:22px;color:#111;">Your Proof Is Ready</h2>
          <p style="margin:0;color:#666;font-size:14px;">Order #${order.id.slice(0, 8)}</p>
        </div>

        <p style="font-size:14px;color:#666;line-height:1.6;margin-bottom:16px;">
          ${order.customerName ? `Hi ${order.customerName}, ` : ""}We've prepared a proof for your review. Please check it carefully and let us know if everything looks good or if you'd like any changes.
        </p>

        <div style="text-align:center;margin:24px 0;">
          <a href="${proofUrl}" style="display:inline-block;padding:12px 32px;background:#111;color:#fff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600;">
            Review Your Proof
          </a>
        </div>

        <div style="background:#fef3c7;border:1px solid #fde68a;border-radius:12px;padding:16px;margin-bottom:24px;">
          <p style="margin:0;font-size:13px;color:#92400e;">
            <strong>Important:</strong> Production will proceed once you approve the proof. Please review it as soon as possible to avoid delays.
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
