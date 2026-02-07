import { PRODUCTS } from "../../../config/products";
import { calculatePrice } from "../../../lib/pricing/calculatePrice";

export const runtime = "edge";

function safeStr(v, max = 500) {
  const s = v == null ? "" : String(v);
  return s.length > max ? s.slice(0, max) : s;
}

function money2cents(n) {
  const x = Number(n);
  if (!Number.isFinite(x) || x <= 0) throw new Error("Invalid amount");
  return Math.round(x * 100);
}

// 错误信息简化
function compactStripeErrorText(errText) {
  const txt = String(errText || "");
  try {
    const j = JSON.parse(txt);
    const msg = j?.error?.message || j?.message;
    if (msg) return safeStr(msg, 300);
  } catch (_) {}
  return safeStr(txt.split("\n")[0] || "Stripe Error", 300);
}

export async function POST(req) {
  try {
    // 1. 检查密钥
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error("CRITICAL: Missing STRIPE_SECRET_KEY");
      return new Response("Server Misconfiguration: Missing Payments Key", { status: 500 });
    }

    const origin = req.headers.get("origin");
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || origin || "http://localhost:3000";

    const body = await req.json();
    const { category, product: productSlug, inputs = {}, fileKey, fileName, fileType } = body || {};

    // 2. 找产品
    const productConfig = PRODUCTS.find(
      (p) => p.category === category && p.product === productSlug
    );
    if (!productConfig) return new Response("Product not found", { status: 400 });

    // 3. 算价格
    let priceData;
    try {
      priceData = calculatePrice(productConfig, inputs);
    } catch (e) {
      return new Response(safeStr(e?.message || e), { status: 400 });
    }

    const total = Number(priceData?.total);
    let amountCents;
    try {
      amountCents = money2cents(total);
    } catch (_) {
      return new Response("Invalid price calculation", { status: 400 });
    }

    const breakdown = priceData?.breakdown || {};
    const qtyRequested = Number(breakdown.qtyRequested ?? inputs.quantity ?? 0);
    if (!Number.isFinite(qtyRequested) || qtyRequested <= 0) return new Response("Invalid Quantity", { status: 400 });
    const qtyBillable = Number(breakdown.qtyBillable ?? qtyRequested);

    // 4. 组装 Metadata (生产单)
    const metadata = {
      orderType: "vibe_print_order",
      category: safeStr(category),
      product: safeStr(productSlug),
      productName: safeStr(productConfig.name),
      pricingModel: safeStr(breakdown.model || productConfig.pricingModel),

      qtyRequested: safeStr(qtyRequested),
      qtyBillable: safeStr(qtyBillable),
      moqNote: qtyBillable > qtyRequested ? safeStr(`MOQ billed at ${qtyBillable}`, 100) : "",

      tierMinQty: safeStr(Number(breakdown.tierMinQty || 0)),
      tierApplied: safeStr(String(breakdown.tierApplied || ""), 200),

      sizeSpec: safeStr(
        inputs.sizeLabel
          ? inputs.sizeLabel
          : inputs.width && inputs.height
            ? `${inputs.width}x${inputs.height} in`
            : "unknown"
      ),

      total: safeStr(total.toFixed(2)),
      fileFee: safeStr(Number(breakdown.fileFee || 0).toFixed(2)),
      addons: safeStr((inputs.addons || []).join(", "), 500),
      
      fileKey: safeStr(fileKey || "none"),
      fileName: safeStr(fileName || "unknown"),
      fileType: safeStr(fileType || "unknown"),
    };

    // Addons 详情
    const addonsArr = Array.isArray(breakdown.addons) ? breakdown.addons : [];
    const addonsTotal = addonsArr.reduce((sum, a) => sum + (Number(a?.amount) || 0), 0);
    metadata.addonsTotal = safeStr(addonsTotal.toFixed(2));
    
    const addonsHuman = addonsArr
      .map((a) => `${a?.name || a?.id}:${Number(a?.amount || 0).toFixed(2)}`)
      .join(" | ");
    metadata.addonsDetail = safeStr(addonsHuman, 500);

    // 5. 请求 Stripe
    const params = new URLSearchParams();
    params.append("mode", "payment");
    params.append("success_url", `${siteUrl}/success?session_id={CHECKOUT_SESSION_ID}`);
    params.append("cancel_url", `${siteUrl}/shop/${safeStr(category)}/${safeStr(productSlug)}`);
    params.append("line_items[0][price_data][currency]", "usd");
    params.append("line_items[0][price_data][unit_amount]", String(amountCents));
    params.append("line_items[0][price_data][product_data][name]", safeStr(productConfig.name));
    params.append("line_items[0][price_data][product_data][description]", 
      safeStr(`Size: ${metadata.sizeSpec} | Qty: ${qtyRequested} | File: ${metadata.fileName}`, 250));
    params.append("line_items[0][quantity]", "1");

    Object.entries(metadata).forEach(([k, v]) => {
      if (v) {
        params.append(`metadata[${k}]`, safeStr(v, 500));
        params.append(`payment_intent_data[metadata][${k}]`, safeStr(v, 500));
      }
    });

    const stripeRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    if (!stripeRes.ok) {
      const errText = await stripeRes.text();
      console.error("Stripe API Error:", errText);
      return new Response(`Stripe Error: ${compactStripeErrorText(errText)}`, { status: stripeRes.status });
    }

    const session = await stripeRes.json();
    return Response.json({ url: session.url });

  } catch (err) {
    console.error("Checkout Route Error:", err);
    return new Response(String(err?.message || err), { status: 500 });
  }
}