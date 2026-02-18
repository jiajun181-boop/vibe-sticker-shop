const formatCad = (cents) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);

export function buildInteracInstructionsHtml({ orderId, customerName, totalAmount }) {
  const interacEmail = process.env.INTERAC_EMAIL || "payments@lalunarprinting.com";

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
          <div style="display:inline-block;width:48px;height:48px;background:#fef3c7;border-radius:50%;line-height:48px;font-size:24px;">🏦</div>
          <h2 style="margin:12px 0 4px;font-size:22px;color:#111;">Interac e-Transfer Instructions</h2>
          <p style="margin:0;color:#666;font-size:14px;">Order #${orderId.slice(0, 8)}</p>
        </div>

        <p style="font-size:14px;color:#666;line-height:1.6;margin-bottom:16px;">
          ${customerName ? `Hi ${customerName}, ` : ""}Thank you for your order! Please complete payment via Interac e-Transfer using the details below.
        </p>

        <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:20px;margin-bottom:24px;">
          <table style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="padding:6px 0;font-size:14px;color:#666;">Send to:</td>
              <td style="padding:6px 0;font-size:14px;font-weight:600;color:#111;">${interacEmail}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;font-size:14px;color:#666;">Amount:</td>
              <td style="padding:6px 0;font-size:18px;font-weight:700;color:#111;">${formatCad(totalAmount)}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;font-size:14px;color:#666;">Message/Memo:</td>
              <td style="padding:6px 0;font-size:14px;font-weight:600;color:#111;font-family:monospace;">Order ${orderId.slice(0, 8)}</td>
            </tr>
          </table>
        </div>

        <div style="background:#fef3c7;border:1px solid #fde68a;border-radius:12px;padding:16px;margin-bottom:24px;">
          <p style="margin:0;font-size:13px;color:#92400e;">
            <strong>Important:</strong> Your order will be processed once payment is received and confirmed. Please include your order number in the message field.
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
