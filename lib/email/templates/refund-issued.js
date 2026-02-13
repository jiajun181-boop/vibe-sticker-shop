const formatCad = (cents) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);

export function buildRefundEmailHtml(order, amountCents, totalRefunded, reason) {
  const isFullRefund = totalRefunded >= order.totalAmount;

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
          <div style="display:inline-block;width:48px;height:48px;background:#dbeafe;border-radius:50%;line-height:48px;font-size:24px;">↩</div>
          <h2 style="margin:12px 0 4px;font-size:22px;color:#111;">Refund ${isFullRefund ? "Issued" : "Partially Issued"}</h2>
          <p style="margin:0;color:#666;font-size:14px;">Order #${order.id.slice(0, 8)}</p>
        </div>

        <div style="background:#f9fafb;border-radius:12px;padding:20px;margin-bottom:24px;">
          <table style="width:100%;border-collapse:collapse;font-size:14px;">
            <tr>
              <td style="padding:6px 0;color:#666;">Refund Amount</td>
              <td style="padding:6px 0;text-align:right;font-weight:600;color:#111;">${formatCad(amountCents)}</td>
            </tr>
            ${!isFullRefund ? `
            <tr>
              <td style="padding:6px 0;color:#666;">Total Refunded So Far</td>
              <td style="padding:6px 0;text-align:right;color:#111;">${formatCad(totalRefunded)}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;color:#666;">Original Order Total</td>
              <td style="padding:6px 0;text-align:right;color:#111;">${formatCad(order.totalAmount)}</td>
            </tr>
            ` : ""}
            ${reason ? `
            <tr>
              <td style="padding:6px 0;color:#666;">Reason</td>
              <td style="padding:6px 0;text-align:right;color:#111;">${reason}</td>
            </tr>
            ` : ""}
          </table>
        </div>

        <p style="font-size:14px;color:#666;line-height:1.6;">
          The refund will be credited to your original payment method within 5-10 business days, depending on your bank.
        </p>

        <p style="font-size:14px;color:#666;line-height:1.6;">
          If you have questions, reply to this email or contact us at
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
