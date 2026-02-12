export function buildB2bPendingHtml({ name, companyName, email }) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
      <div style="background:#111;color:#fff;padding:24px 32px;">
        <h1 style="margin:0;font-size:20px;font-weight:600;letter-spacing:0.05em;">LA LUNAR PRINTING INC. — ADMIN</h1>
      </div>
      <div style="padding:32px;">
        <h2 style="margin:0 0 16px;font-size:22px;color:#111;">New B2B Account Request</h2>
        <div style="background:#fefce8;border:1px solid #fef08a;border-radius:12px;padding:16px;margin:0 0 24px;">
          <p style="margin:0 0 8px;font-size:14px;color:#854d0e;font-weight:600;">Pending Approval</p>
          <p style="margin:0;font-size:13px;color:#713f12;">A new business account has been registered and requires your approval.</p>
        </div>
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <tr><td style="padding:8px 0;color:#888;width:120px;">Name</td><td style="padding:8px 0;color:#111;font-weight:500;">${name}</td></tr>
          <tr><td style="padding:8px 0;color:#888;">Email</td><td style="padding:8px 0;color:#111;font-weight:500;">${email}</td></tr>
          <tr><td style="padding:8px 0;color:#888;">Company</td><td style="padding:8px 0;color:#111;font-weight:500;">${companyName || "—"}</td></tr>
        </table>
        <div style="text-align:center;margin:32px 0;">
          <a href="${process.env.NEXT_PUBLIC_SITE_URL || "https://vibestickers.com"}/admin/b2b" style="display:inline-block;background:#111;color:#fff;padding:14px 32px;border-radius:9999px;text-decoration:none;font-size:14px;font-weight:600;letter-spacing:0.05em;">REVIEW IN ADMIN</a>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
}
