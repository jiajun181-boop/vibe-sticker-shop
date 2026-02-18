const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://lunarprint.ca";

const formatCad = (cents) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);

export function buildAbandonedCartHtml({ email, cart, recoveryToken, emailNumber = 1 }) {
  const recoveryUrl = `${SITE_URL}/cart/recover/${recoveryToken}`;

  const subjects = {
    1: "You left something behind!",
    2: "Your cart is waiting for you",
    3: "Last chance — your cart expires soon",
  };

  const intros = {
    1: "Looks like you left some items in your cart. They're still waiting for you!",
    2: "Just a friendly reminder — you have items in your cart that are ready to order.",
    3: "This is your last reminder. Your saved cart will expire soon.",
  };

  const itemRows = (cart || [])
    .map(
      (item) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;font-size:14px;">${item.name || "Item"}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;font-size:14px;text-align:center;">${item.quantity || 1}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;font-size:14px;text-align:right;">${formatCad((item.price || 0) * (item.quantity || 1))}</td>
      </tr>`
    )
    .join("");

  const total = (cart || []).reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0);

  const subject = subjects[emailNumber] || subjects[1];
  const intro = intros[emailNumber] || intros[1];

  const html = `
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
          <div style="display:inline-block;width:48px;height:48px;background:#fef3c7;border-radius:50%;line-height:48px;font-size:24px;">🛒</div>
          <h2 style="margin:12px 0 4px;font-size:22px;color:#111;">${subject}</h2>
        </div>

        <p style="font-size:14px;color:#666;line-height:1.6;margin-bottom:16px;">${intro}</p>

        ${itemRows ? `
        <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
          <thead>
            <tr style="background:#f9fafb;">
              <th style="padding:8px 12px;text-align:left;font-size:12px;color:#666;text-transform:uppercase;">Item</th>
              <th style="padding:8px 12px;text-align:center;font-size:12px;color:#666;text-transform:uppercase;">Qty</th>
              <th style="padding:8px 12px;text-align:right;font-size:12px;color:#666;text-transform:uppercase;">Price</th>
            </tr>
          </thead>
          <tbody>${itemRows}</tbody>
          <tfoot>
            <tr>
              <td colspan="2" style="padding:8px 12px;font-size:14px;font-weight:600;">Subtotal</td>
              <td style="padding:8px 12px;text-align:right;font-size:14px;font-weight:600;">${formatCad(total)}</td>
            </tr>
          </tfoot>
        </table>
        ` : ""}

        <div style="text-align:center;margin:24px 0;">
          <a href="${recoveryUrl}" style="display:inline-block;padding:14px 40px;background:#111;color:#fff;text-decoration:none;border-radius:8px;font-size:15px;font-weight:600;">
            Complete Your Order
          </a>
        </div>

        <p style="font-size:13px;color:#999;text-align:center;">
          Or copy and paste this link: ${recoveryUrl}
        </p>
      </div>
      <div style="padding:16px 32px;background:#f9fafb;text-align:center;">
        <p style="margin:0;font-size:12px;color:#999;">La Lunar Printing Inc. · Toronto, ON</p>
      </div>
    </div>
  </div>
</body>
</html>`;

  return { subject, html };
}
