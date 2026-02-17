const TIER_LABELS = { bronze: "Bronze", silver: "Silver", gold: "Gold", platinum: "Platinum" };

export function buildPartnerInviteHtml({ companyName, inviteUrl, tier, discount }) {
  const tierLabel = TIER_LABELS[tier] || "Bronze";
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
          <div style="display:inline-block;width:48px;height:48px;background:#fef3c7;border-radius:50%;line-height:48px;font-size:24px;">🤝</div>
          <h2 style="margin:12px 0 4px;font-size:22px;color:#111;">Partner Invitation</h2>
        </div>
        <p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 16px;">
          ${companyName ? `<strong>${companyName}</strong>, you` : "You"}'ve been invited to join our partner program at La Lunar Printing.
        </p>
        <div style="background:#fafafa;border-radius:12px;padding:20px;margin:0 0 24px;">
          <table style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="padding:6px 0;font-size:14px;color:#999;">Partner Tier</td>
              <td style="padding:6px 0;font-size:14px;color:#111;font-weight:600;text-align:right;">${tierLabel}</td>
            </tr>
            ${discount > 0 ? `<tr>
              <td style="padding:6px 0;font-size:14px;color:#999;">Wholesale Discount</td>
              <td style="padding:6px 0;font-size:14px;color:#16a34a;font-weight:600;text-align:right;">${discount}% off</td>
            </tr>` : ""}
            <tr>
              <td style="padding:6px 0;font-size:14px;color:#999;">Benefits</td>
              <td style="padding:6px 0;font-size:14px;color:#111;text-align:right;">Volume pricing, priority production</td>
            </tr>
          </table>
        </div>
        <p style="color:#555;font-size:14px;line-height:1.6;margin:0 0 8px;">
          As our partner, you'll get:
        </p>
        <ul style="color:#555;font-size:14px;line-height:2;margin:0 0 24px;padding-left:20px;">
          <li>Wholesale pricing on all products</li>
          <li>Priority production queue</li>
          <li>Dedicated partner dashboard</li>
          <li>White-label fulfillment options</li>
        </ul>
        <div style="text-align:center;margin:32px 0;">
          <a href="${inviteUrl}" style="display:inline-block;background:#111;color:#fff;padding:14px 32px;border-radius:9999px;text-decoration:none;font-size:14px;font-weight:600;letter-spacing:0.05em;">ACCEPT INVITATION</a>
        </div>
        <p style="color:#999;font-size:12px;text-align:center;margin:16px 0 0;">
          This invitation expires in 14 days. If you didn't expect this, please ignore it.
        </p>
      </div>
      <div style="background:#f9fafb;padding:20px 32px;border-top:1px solid #f0f0f0;">
        <p style="margin:0;font-size:12px;color:#999;text-align:center;">La Lunar Printing Inc. &bull; Custom Printing &amp; Vehicle Graphics</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}
