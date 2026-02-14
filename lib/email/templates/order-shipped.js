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

export function buildOrderShippedHtml(order, { trackingNumber, carrier, estimatedDelivery } = {}) {
  const trackingUrl =
    carrier === "canada-post"
      ? `https://www.canadapost-postescanada.ca/track-reperage/en#/search?searchFor=${trackingNumber}`
      : carrier === "ups"
        ? `https://www.ups.com/track?tracknum=${trackingNumber}`
        : carrier === "purolator"
          ? `https://www.purolator.com/en/shipping/tracker?pin=${trackingNumber}`
          : null;

  const itemRows = (order.items || [])
    .map(
      (item) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;font-size:14px;">${item.productName}${buildItemDetails(item)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;font-size:14px;text-align:center;">${item.quantity}</td>
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
          <div style="display:inline-block;width:48px;height:48px;background:#dcfce7;border-radius:50%;line-height:48px;font-size:24px;">📦</div>
          <h2 style="margin:12px 0 4px;font-size:22px;color:#111;">Your Order Has Shipped!</h2>
          <p style="margin:0;color:#666;font-size:14px;">Order #${order.id.slice(0, 8)}</p>
        </div>

        ${trackingNumber ? `
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:20px;margin-bottom:24px;text-align:center;">
          <p style="margin:0 0 4px;font-size:12px;color:#666;text-transform:uppercase;letter-spacing:0.1em;">Tracking Number</p>
          <p style="margin:0;font-size:18px;font-weight:600;color:#111;font-family:monospace;">${trackingNumber}</p>
          ${carrier ? `<p style="margin:4px 0 0;font-size:12px;color:#666;">${carrier.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</p>` : ""}
          ${trackingUrl ? `
          <a href="${trackingUrl}" style="display:inline-block;margin-top:12px;padding:8px 20px;background:#111;color:#fff;text-decoration:none;border-radius:8px;font-size:13px;font-weight:600;">
            Track Package
          </a>
          ` : ""}
        </div>
        ` : ""}

        ${estimatedDelivery ? `
        <p style="font-size:14px;color:#666;margin-bottom:16px;">
          <strong>Estimated Delivery:</strong> ${estimatedDelivery}
        </p>
        ` : ""}

        ${itemRows ? `
        <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
          <thead>
            <tr style="background:#f9fafb;">
              <th style="padding:8px 12px;text-align:left;font-size:12px;color:#666;text-transform:uppercase;">Item</th>
              <th style="padding:8px 12px;text-align:center;font-size:12px;color:#666;text-transform:uppercase;">Qty</th>
            </tr>
          </thead>
          <tbody>${itemRows}</tbody>
        </table>
        ` : ""}

        <p style="font-size:14px;color:#666;line-height:1.6;">
          If you have any questions about your shipment, reply to this email or contact us at
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
