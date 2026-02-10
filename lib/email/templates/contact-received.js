export function buildContactReceivedHtml({ name, message }) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
      <div style="background:#111;color:#fff;padding:24px 32px;">
        <h1 style="margin:0;font-size:20px;font-weight:600;letter-spacing:0.05em;">VIBE STICKER SHOP</h1>
      </div>
      <div style="padding:32px;">
        <h2 style="margin:0 0 12px;font-size:20px;color:#111;">We received your message</h2>
        <p style="font-size:14px;color:#666;line-height:1.6;">
          Hi ${name}, thank you for reaching out! Our team will review your message and get back to you within 1 business day.
        </p>
        <div style="background:#f9fafb;border-radius:12px;padding:16px;margin:20px 0;">
          <p style="margin:0 0 4px;font-size:12px;color:#999;text-transform:uppercase;letter-spacing:0.1em;">Your message</p>
          <p style="margin:0;font-size:14px;color:#333;line-height:1.6;">${message}</p>
        </div>
        <p style="font-size:13px;color:#666;text-align:center;">
          If you need immediate assistance, call us at <a href="tel:+14165550199" style="color:#111;font-weight:600;">+1 (416) 555-0199</a>
        </p>
      </div>
      <div style="background:#f9fafb;padding:16px;text-align:center;font-size:11px;color:#999;">
        © ${new Date().getFullYear()} Vibe Sticker Shop — Toronto, ON, Canada
      </div>
    </div>
  </div>
</body>
</html>`;
}

export function buildContactNotifyHtml({ name, email, phone, company, message }) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
      <div style="background:#111;color:#fff;padding:24px 32px;">
        <h1 style="margin:0;font-size:20px;font-weight:600;">New Contact Form Submission</h1>
      </div>
      <div style="padding:32px;">
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:8px 0;font-size:13px;color:#999;width:100px;">Name</td><td style="padding:8px 0;font-size:14px;color:#111;font-weight:600;">${name}</td></tr>
          <tr><td style="padding:8px 0;font-size:13px;color:#999;">Email</td><td style="padding:8px 0;font-size:14px;"><a href="mailto:${email}" style="color:#111;">${email}</a></td></tr>
          ${phone ? `<tr><td style="padding:8px 0;font-size:13px;color:#999;">Phone</td><td style="padding:8px 0;font-size:14px;color:#111;">${phone}</td></tr>` : ""}
          ${company ? `<tr><td style="padding:8px 0;font-size:13px;color:#999;">Company</td><td style="padding:8px 0;font-size:14px;color:#111;">${company}</td></tr>` : ""}
        </table>
        <div style="background:#f9fafb;border-radius:12px;padding:16px;margin-top:16px;">
          <p style="margin:0 0 4px;font-size:12px;color:#999;text-transform:uppercase;letter-spacing:0.1em;">Message</p>
          <p style="margin:0;font-size:14px;color:#333;line-height:1.6;white-space:pre-wrap;">${message}</p>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
}
