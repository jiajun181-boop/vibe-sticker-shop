const formatCad = (cents) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);

function parseSizeRows(item) {
  const raw = item?.specsJson?.sizeRows ?? item?.meta?.sizeRows;
  let rows = raw;
  if (typeof raw === "string") {
    try {
      rows = JSON.parse(raw);
    } catch {
      rows = [];
    }
  }
  if (!Array.isArray(rows)) return [];
  return rows
    .map((row) => {
      const width = Number(row?.width ?? row?.widthIn);
      const height = Number(row?.height ?? row?.heightIn);
      const quantity = Number(row?.quantity);
      if (!Number.isFinite(width) || !Number.isFinite(height) || !Number.isFinite(quantity)) return null;
      return { width, height, quantity };
    })
    .filter(Boolean);
}

function buildItemDetails(item) {
  const base = [
    item.widthIn && item.heightIn ? `${item.widthIn}" x ${item.heightIn}"` : null,
    item.material || null,
    item.finishing || null,
  ].filter(Boolean);
  const rows = parseSizeRows(item);
  if (rows.length > 0) {
    base.push(...rows.map((r, idx) => `#${idx + 1}: ${r.width}" x ${r.height}" x ${r.quantity}`));
  }
  if (base.length === 0) return "";
  return `<div style="margin-top:4px;font-size:12px;color:#6b7280;">${base.join("<br/>")}</div>`;
}

export function buildOrderConfirmationHtml(order, items) {
  const itemRows = items
    .map(
      (item) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;font-size:14px;">${item.productName}${buildItemDetails(item)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;font-size:14px;text-align:center;">${item.quantity}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;font-size:14px;text-align:right;">${formatCad(item.totalPrice)}</td>
      </tr>`
    )
    .join("");

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
          <h2 style="margin:12px 0 4px;font-size:22px;color:#111;">Order Confirmed</h2>
          <p style="margin:0;color:#666;font-size:14px;">Thank you for your purchase!</p>
        </div>

        <div style="background:#f9fafb;border-radius:12px;padding:16px;margin-bottom:20px;">
          <p style="margin:0 0 4px;font-size:12px;color:#999;text-transform:uppercase;letter-spacing:0.1em;">Order Reference</p>
          <p style="margin:0;font-family:monospace;font-size:13px;color:#333;word-break:break-all;">${order.id}</p>
        </div>

        <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
          <thead>
            <tr style="background:#f9fafb;">
              <th style="padding:8px 12px;text-align:left;font-size:11px;color:#999;text-transform:uppercase;letter-spacing:0.1em;">Item</th>
              <th style="padding:8px 12px;text-align:center;font-size:11px;color:#999;text-transform:uppercase;letter-spacing:0.1em;">Qty</th>
              <th style="padding:8px 12px;text-align:right;font-size:11px;color:#999;text-transform:uppercase;letter-spacing:0.1em;">Total</th>
            </tr>
          </thead>
          <tbody>${itemRows}</tbody>
        </table>

        <div style="border-top:2px solid #111;padding-top:12px;margin-bottom:24px;">
          <div style="display:flex;justify-content:space-between;font-size:13px;color:#666;margin-bottom:4px;">
            <span>Subtotal</span><span>${formatCad(order.subtotalAmount)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:13px;color:#666;margin-bottom:4px;">
            <span>Shipping</span><span>${order.shippingAmount === 0 ? "FREE" : formatCad(order.shippingAmount)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:13px;color:#666;margin-bottom:8px;">
            <span>Tax (HST)</span><span>${formatCad(order.taxAmount)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:16px;font-weight:700;color:#111;">
            <span>Total</span><span>${formatCad(order.totalAmount)} CAD</span>
          </div>
        </div>

        <div style="background:#f0fdf4;border-radius:12px;padding:16px;margin-bottom:24px;">
          <h3 style="margin:0 0 8px;font-size:14px;font-weight:600;color:#166534;">What's Next?</h3>
          <ol style="margin:0;padding-left:20px;color:#166534;font-size:13px;line-height:1.8;">
            <li>Our team will review your artwork files</li>
            <li>Production begins (2-4 business days)</li>
            <li>Shipping & delivery (2-5 business days)</li>
          </ol>
        </div>

        <p style="font-size:13px;color:#666;text-align:center;">
          Questions? Contact us at <a href="mailto:support@lunarprint.ca" style="color:#111;font-weight:600;">support@lunarprint.ca</a>
          or call <a href="tel:+14165550199" style="color:#111;font-weight:600;">+1 (416) 555-0199</a>
        </p>
      </div>

      <div style="background:#f9fafb;padding:16px;text-align:center;font-size:11px;color:#999;">
        © ${new Date().getFullYear()} La Lunar Printing Inc. — Toronto, ON, Canada
      </div>
    </div>
  </div>
</body>
</html>`;
}
