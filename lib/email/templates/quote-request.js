import { escapeHtml } from "../escape-html";

export function buildQuoteReceivedHtml({ name, reference }) {
  name = escapeHtml(name);
  reference = escapeHtml(reference);
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
        <h2 style="margin:0 0 12px;font-size:20px;color:#111;">Quote Request Received</h2>
        <p style="font-size:14px;color:#666;line-height:1.6;">
          Hi ${name}, we've received your quote request! Our team will review it and get back to you within 24 hours with pricing.
        </p>
        <div style="background:#f9fafb;border-radius:12px;padding:16px;margin:20px 0;text-align:center;">
          <p style="margin:0 0 4px;font-size:12px;color:#999;text-transform:uppercase;letter-spacing:0.1em;">Reference Number</p>
          <p style="margin:0;font-size:20px;color:#111;font-weight:700;">${reference}</p>
        </div>
        <p style="font-size:13px;color:#666;text-align:center;">
          If you need immediate assistance, call us at <a href="tel:+14165550199" style="color:#111;font-weight:600;">+1 (416) 555-0199</a>
        </p>
      </div>
      <div style="background:#f9fafb;padding:16px;text-align:center;font-size:11px;color:#999;">
        &copy; ${new Date().getFullYear()} La Lunar Printing Inc. &mdash; Toronto, ON, Canada
      </div>
    </div>
  </div>
</body>
</html>`;
}

export function buildQuoteNotifyHtml({ name, email, phone, company, productType, description, width, height, quantity, material, colorMode, neededBy, isRush, fileUrls, reference }) {
  name = escapeHtml(name);
  email = escapeHtml(email);
  phone = escapeHtml(phone);
  company = escapeHtml(company);
  productType = escapeHtml(productType);
  description = escapeHtml(description);
  material = escapeHtml(material);
  colorMode = escapeHtml(colorMode);
  reference = escapeHtml(reference);
  const specsRows = [
    productType ? `<tr><td style="padding:6px 0;font-size:13px;color:#999;width:120px;">Product</td><td style="padding:6px 0;font-size:14px;color:#111;font-weight:600;">${productType}</td></tr>` : "",
    width || height ? `<tr><td style="padding:6px 0;font-size:13px;color:#999;">Size</td><td style="padding:6px 0;font-size:14px;color:#111;">${width || "?"} × ${height || "?"}</td></tr>` : "",
    quantity ? `<tr><td style="padding:6px 0;font-size:13px;color:#999;">Quantity</td><td style="padding:6px 0;font-size:14px;color:#111;">${quantity}</td></tr>` : "",
    material ? `<tr><td style="padding:6px 0;font-size:13px;color:#999;">Material</td><td style="padding:6px 0;font-size:14px;color:#111;">${material}</td></tr>` : "",
    colorMode ? `<tr><td style="padding:6px 0;font-size:13px;color:#999;">Color</td><td style="padding:6px 0;font-size:14px;color:#111;">${colorMode}</td></tr>` : "",
    neededBy ? `<tr><td style="padding:6px 0;font-size:13px;color:#999;">Needed By</td><td style="padding:6px 0;font-size:14px;color:#111;">${neededBy}</td></tr>` : "",
    `<tr><td style="padding:6px 0;font-size:13px;color:#999;">Rush</td><td style="padding:6px 0;font-size:14px;color:#111;">${isRush ? "⚡ Yes" : "No"}</td></tr>`,
  ].filter(Boolean).join("");

  const filesHtml = fileUrls && fileUrls.length > 0
    ? `<div style="margin-top:16px;"><p style="font-size:12px;color:#999;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 8px;">Attached Files</p>${fileUrls.map((url) => `<a href="${url}" style="display:block;font-size:13px;color:#2563eb;margin:4px 0;">${url.split("/").pop()}</a>`).join("")}</div>`
    : "";

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
      <div style="background:${isRush ? "#dc2626" : "#111"};color:#fff;padding:24px 32px;">
        <h1 style="margin:0;font-size:20px;font-weight:600;">${isRush ? "⚡ RUSH " : ""}New Quote Request — ${reference}</h1>
      </div>
      <div style="padding:32px;">
        <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
          <tr><td style="padding:6px 0;font-size:13px;color:#999;width:120px;">Name</td><td style="padding:6px 0;font-size:14px;color:#111;font-weight:600;">${name}</td></tr>
          <tr><td style="padding:6px 0;font-size:13px;color:#999;">Email</td><td style="padding:6px 0;font-size:14px;"><a href="mailto:${email}" style="color:#111;">${email}</a></td></tr>
          ${phone ? `<tr><td style="padding:6px 0;font-size:13px;color:#999;">Phone</td><td style="padding:6px 0;font-size:14px;color:#111;">${phone}</td></tr>` : ""}
          ${company ? `<tr><td style="padding:6px 0;font-size:13px;color:#999;">Company</td><td style="padding:6px 0;font-size:14px;color:#111;">${company}</td></tr>` : ""}
        </table>
        <div style="background:#f9fafb;border-radius:12px;padding:16px;">
          <p style="margin:0 0 8px;font-size:12px;color:#999;text-transform:uppercase;letter-spacing:0.1em;">Specifications</p>
          <table style="width:100%;border-collapse:collapse;">${specsRows}</table>
        </div>
        ${description ? `<div style="background:#f9fafb;border-radius:12px;padding:16px;margin-top:12px;"><p style="margin:0 0 4px;font-size:12px;color:#999;text-transform:uppercase;letter-spacing:0.1em;">Project Description</p><p style="margin:0;font-size:14px;color:#333;line-height:1.6;white-space:pre-wrap;">${description}</p></div>` : ""}
        ${filesHtml}
      </div>
    </div>
  </div>
</body>
</html>`;
}
