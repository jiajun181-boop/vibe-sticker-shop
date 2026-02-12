export function buildB2bApprovedHtml({ name, companyName }) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://vibestickers.com";
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
          <div style="display:inline-block;width:48px;height:48px;background:#dcfce7;border-radius:50%;line-height:48px;font-size:24px;">✓</div>
          <h2 style="margin:12px 0 4px;font-size:22px;color:#111;">Business Account Approved</h2>
        </div>
        <p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 24px;">
          Hi ${name},<br><br>
          Great news! Your business account${companyName ? ` for <strong>${companyName}</strong>` : ""} has been approved. You now have access to volume pricing and B2B features.
        </p>
        <div style="text-align:center;margin:32px 0;">
          <a href="${siteUrl}/account" style="display:inline-block;background:#111;color:#fff;padding:14px 32px;border-radius:9999px;text-decoration:none;font-size:14px;font-weight:600;letter-spacing:0.05em;">GO TO MY ACCOUNT</a>
        </div>
      </div>
      <div style="background:#f9fafb;padding:20px 32px;border-top:1px solid #f0f0f0;">
        <p style="margin:0;font-size:12px;color:#999;text-align:center;">La Lunar Printing Inc. &bull; Custom Printing &amp; Vehicle Graphics</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}
