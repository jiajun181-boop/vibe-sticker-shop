"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { formatCad } from "@/lib/admin/format-cad";
import { DESIGN_HELP_CENTS } from "@/lib/order-config";

// ── Product type presets for quick selection ──
const PRODUCT_TYPES = [
  { value: "sticker", label: "Stickers / Labels", labelZh: "贴纸/标签" },
  { value: "business-card", label: "Business Cards", labelZh: "名片" },
  { value: "flyer", label: "Flyers / Postcards", labelZh: "传单/明信片" },
  { value: "brochure", label: "Brochures / Booklets", labelZh: "宣传册" },
  { value: "poster", label: "Posters", labelZh: "海报" },
  { value: "banner", label: "Banners", labelZh: "横幅" },
  { value: "yard-sign", label: "Yard Signs", labelZh: "地插牌" },
  { value: "foam-board", label: "Foam Board Signs", labelZh: "泡沫板" },
  { value: "canvas", label: "Canvas Prints", labelZh: "画布" },
  { value: "stamp", label: "Stamps", labelZh: "印章" },
  { value: "vinyl-lettering", label: "Vinyl Lettering", labelZh: "刻字" },
  { value: "vehicle-wrap", label: "Vehicle Graphics", labelZh: "车贴" },
  { value: "other", label: "Other / Custom", labelZh: "其他" },
];

const ARTWORK_INTENT_OPTIONS = [
  { value: "provided", label: "Artwork provided", labelZh: "已提供文件" },
  { value: "upload-later", label: "Upload later", labelZh: "稍后上传" },
  { value: "design-help", label: "Design help ($45)", labelZh: "设计服务 ($45)" },
];

function emptyItem() {
  return {
    id: Date.now(),
    productType: "other",
    productName: "",
    quantity: 1,
    unitPriceDollars: "",
    widthIn: "",
    heightIn: "",
    material: "",
    finishing: "",
    notes: "",
    artworkIntent: "provided",
    rushProduction: false,
    // Pricing provenance: "manual" | "calculated" | "overridden"
    pricingSource: "manual",
    calcSlug: null,           // slug used when price was calculated
    calculatedUnitCents: null, // original calculated price (preserved if overridden)
  };
}

export default function CreateOrderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Quote provenance — if creating an order from a quote
  const fromQuoteId = searchParams.get("fromQuote") || null;

  // Customer
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  // Pre-fill from quote query params
  useEffect(() => {
    if (!fromQuoteId) return;
    const email = searchParams.get("email");
    const name = searchParams.get("name");
    const phone = searchParams.get("phone");
    if (email) setCustomerEmail(email);
    if (name) setCustomerName(name);
    if (phone) setCustomerPhone(phone);
  }, [fromQuoteId, searchParams]);

  // Items
  const [items, setItems] = useState([emptyItem()]);

  // Order notes
  const [orderNotes, setOrderNotes] = useState("");

  // Payment status
  const [paymentStatus, setPaymentStatus] = useState("unpaid");

  // Price calculation
  const [calculating, setCalculating] = useState({});
  const [calcError, setCalcError] = useState({});

  const updateItem = (id, field, value) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const addItem = () => setItems((prev) => [...prev, emptyItem()]);

  const removeItem = (id) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Auto-calculate price via pricing API
  const calculatePrice = async (item) => {
    if (!item.productName) return;
    setCalculating((prev) => ({ ...prev, [item.id]: true }));
    setCalcError((prev) => ({ ...prev, [item.id]: null }));

    try {
      // Build a slug from product type
      const slugMap = {
        sticker: "custom-stickers",
        "business-card": "classic-business-cards",
        flyer: "flyers",
        brochure: "brochures",
        poster: "posters",
        banner: "vinyl-banners",
        "yard-sign": "yard-signs",
        "foam-board": "foam-board-prints",
        canvas: "canvas-prints",
        "vinyl-lettering": "vinyl-lettering",
      };

      const slug = slugMap[item.productType];
      if (!slug) {
        setCalcError((prev) => ({ ...prev, [item.id]: "No pricing for this product type — enter price manually" }));
        return;
      }

      const body = {
        slug,
        widthIn: parseFloat(item.widthIn) || 12,
        heightIn: parseFloat(item.heightIn) || 12,
        quantity: item.quantity || 1,
        material: item.material || undefined,
      };

      const res = await fetch("/api/pricing/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const data = await res.json();
        const calcDollars = (data.unitCents / 100).toFixed(2);
        setItems((prev) =>
          prev.map((it) =>
            it.id === item.id
              ? {
                  ...it,
                  unitPriceDollars: calcDollars,
                  pricingSource: "calculated",
                  calcSlug: slug,
                  calculatedUnitCents: data.unitCents,
                }
              : it
          )
        );
      } else {
        const data = await res.json().catch(() => null);
        setCalcError((prev) => ({ ...prev, [item.id]: data?.error || "Pricing API error — enter price manually" }));
      }
    } catch {
      setCalcError((prev) => ({ ...prev, [item.id]: "Network error — enter price manually" }));
    } finally {
      setCalculating((prev) => ({ ...prev, [item.id]: false }));
    }
  };

  const getItemTotalCents = (item) => {
    const unitPrice = parseFloat(item.unitPriceDollars) || 0;
    return Math.round(unitPrice * 100 * item.quantity);
  };

  const designHelpCount = items.filter((i) => i.artworkIntent === "design-help").length;
  const designHelpTotalCents = designHelpCount * DESIGN_HELP_CENTS;

  const orderTotalCents = items.reduce(
    (sum, item) => sum + getItemTotalCents(item),
    0
  ) + designHelpTotalCents;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!customerEmail.trim()) {
      setError("Customer email is required");
      return;
    }
    if (items.some((item) => !item.productName.trim())) {
      setError("All items must have a product name");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        customerEmail: customerEmail.trim(),
        customerName: customerName.trim() || null,
        customerPhone: customerPhone.trim() || null,
        paymentStatus,
        notes: orderNotes.trim() || null,
        items: items.map((item) => ({
          productName: item.productName,
          productType: item.productType,
          quantity: item.quantity,
          unitPrice: Math.round((parseFloat(item.unitPriceDollars) || 0) * 100),
          totalPrice: getItemTotalCents(item),
          widthIn: parseFloat(item.widthIn) || null,
          heightIn: parseFloat(item.heightIn) || null,
          material: item.material || null,
          finishing: item.finishing || null,
          artworkIntent: item.artworkIntent,
          rushProduction: item.rushProduction,
          meta: {
            ...(item.notes ? { adminNotes: item.notes } : {}),
            artworkIntent: item.artworkIntent,
            rushProduction: item.rushProduction ? "true" : "false",
            ...(item.artworkIntent === "design-help" ? { designHelp: "true", designHelpFee: String(DESIGN_HELP_CENTS) } : {}),
            ...(item.artworkIntent === "upload-later" ? { artworkStatus: "pending" } : {}),
            // Pricing provenance
            pricingSource: item.pricingSource,
            ...(item.calcSlug ? { pricingQuoteSlug: item.calcSlug } : {}),
            ...(item.pricingSource === "overridden" && item.calculatedUnitCents
              ? { calculatedUnitCents: item.calculatedUnitCents }
              : {}),
          },
        })),
      };

      const res = await fetch("/api/admin/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create order");
      }

      const { order } = await res.json();

      // If this order was created from a quote, link them
      if (fromQuoteId) {
        try {
          await fetch(`/api/admin/quotes/${fromQuoteId}/convert`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderId: order.id }),
          });
        } catch {
          // Non-blocking — order was created, quote link is best-effort
          console.warn("[CreateOrder] Failed to link quote", fromQuoteId);
        }
      }

      router.push(`/admin/orders/${order.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-black">
            New Order 新建订单
          </h1>
          {fromQuoteId ? (
            <p className="text-sm text-indigo-600">
              Converting from quote — order will be linked automatically.{" "}
              <Link href={`/admin/quotes`} className="underline hover:no-underline">
                Back to quotes
              </Link>
            </p>
          ) : (
            <p className="text-sm text-[#999]">
              Create a manual order for walk-in or phone customers.{" "}
              <Link href="/admin/pricing-dashboard" className="text-black underline hover:no-underline">
                Check product prices
              </Link>
            </p>
          )}
        </div>
        <Link
          href="/admin/orders"
          className="rounded-[3px] border border-[#d0d0d0] px-4 py-2 text-xs font-medium text-black hover:border-black"
        >
          Cancel
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ── Customer Info ── */}
        <div className="rounded-[3px] border border-[#e0e0e0] bg-white p-5">
          <h2 className="mb-4 text-sm font-bold text-black">
            Customer Info 客户信息
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-medium text-[#666] mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="customer@example.com"
                className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-black"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#666] mb-1">
                Name
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Full name"
                className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-black"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#666] mb-1">
                Phone
              </label>
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="(416) 000-0000"
                className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-black"
              />
            </div>
          </div>
        </div>

        {/* ── Line Items ── */}
        <div className="rounded-[3px] border border-[#e0e0e0] bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-bold text-black">
              Items 产品项目
            </h2>
            <button
              type="button"
              onClick={addItem}
              className="rounded-[3px] bg-black px-3 py-1.5 text-xs font-semibold text-[#fff] hover:bg-[#222]"
            >
              + Add Item
            </button>
          </div>

          <div className="space-y-4">
            {items.map((item, idx) => (
              <div
                key={item.id}
                className="rounded-lg border border-[#e8e8e8] bg-[#fafafa] p-4"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-bold text-[#999]">
                    ITEM #{idx + 1}
                  </span>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  )}
                </div>

                {/* Row 1: Product type + name */}
                <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs text-[#666] mb-1">
                      Product Type
                    </label>
                    <select
                      value={item.productType}
                      onChange={(e) =>
                        updateItem(item.id, "productType", e.target.value)
                      }
                      className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-black"
                    >
                      {PRODUCT_TYPES.map((pt) => (
                        <option key={pt.value} value={pt.value}>
                          {pt.label} {pt.labelZh}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-[#666] mb-1">
                      Product Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={item.productName}
                      onChange={(e) =>
                        updateItem(item.id, "productName", e.target.value)
                      }
                      placeholder="e.g. Die-cut Stickers 3x3"
                      className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-black"
                    />
                  </div>
                </div>

                {/* Row 2: Qty, size, material */}
                <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
                  <div>
                    <label className="block text-xs text-[#666] mb-1">
                      Quantity
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) =>
                        updateItem(
                          item.id,
                          "quantity",
                          Math.max(1, parseInt(e.target.value) || 1)
                        )
                      }
                      className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm font-mono outline-none focus:border-black"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#666] mb-1">
                      Width (in)
                    </label>
                    <input
                      type="number"
                      step="0.25"
                      min="0"
                      value={item.widthIn}
                      onChange={(e) =>
                        updateItem(item.id, "widthIn", e.target.value)
                      }
                      placeholder="—"
                      className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm font-mono outline-none focus:border-black"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#666] mb-1">
                      Height (in)
                    </label>
                    <input
                      type="number"
                      step="0.25"
                      min="0"
                      value={item.heightIn}
                      onChange={(e) =>
                        updateItem(item.id, "heightIn", e.target.value)
                      }
                      placeholder="—"
                      className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm font-mono outline-none focus:border-black"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#666] mb-1">
                      Material
                    </label>
                    <input
                      type="text"
                      value={item.material}
                      onChange={(e) =>
                        updateItem(item.id, "material", e.target.value)
                      }
                      placeholder="e.g. white vinyl"
                      className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-black"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#666] mb-1">
                      Finishing
                    </label>
                    <input
                      type="text"
                      value={item.finishing}
                      onChange={(e) =>
                        updateItem(item.id, "finishing", e.target.value)
                      }
                      placeholder="e.g. laminate"
                      className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-black"
                    />
                  </div>
                </div>

                {/* Row 3: Pricing */}
                <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div>
                    <label className="block text-xs text-[#666] mb-1">
                      Unit Price ($)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.unitPriceDollars}
                        onChange={(e) => {
                          const newVal = e.target.value;
                          setItems((prev) =>
                            prev.map((it) => {
                              if (it.id !== item.id) return it;
                              // If price was calculated and user changes it, mark as overridden
                              const wasCalc = it.pricingSource === "calculated" || it.pricingSource === "overridden";
                              const newSource = wasCalc ? "overridden" : "manual";
                              return { ...it, unitPriceDollars: newVal, pricingSource: newSource };
                            })
                          );
                        }}
                        placeholder="0.00"
                        className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm font-mono outline-none focus:border-black"
                      />
                      <button
                        type="button"
                        onClick={() => calculatePrice(item)}
                        disabled={calculating[item.id]}
                        title="Auto-calculate price"
                        className="shrink-0 rounded-[3px] border border-[#d0d0d0] px-2.5 py-2 text-xs text-[#666] hover:border-black hover:text-black disabled:opacity-40"
                      >
                        {calculating[item.id] ? "..." : "Calc"}
                      </button>
                    </div>
                    {calcError[item.id] && (
                      <p className="mt-1 text-[11px] text-amber-600">{calcError[item.id]}</p>
                    )}
                    {item.pricingSource === "calculated" && (
                      <p className="mt-1 text-[11px] text-emerald-600 font-medium">System-calculated price</p>
                    )}
                    {item.pricingSource === "overridden" && (
                      <p className="mt-1 text-[11px] text-amber-600 font-medium">
                        Overridden (was {formatCad(item.calculatedUnitCents || 0)}/ea)
                      </p>
                    )}
                    {item.pricingSource === "manual" && item.unitPriceDollars && (
                      <p className="mt-1 text-[11px] text-[#999]">Manual price</p>
                    )}
                  </div>
                  <div className="flex items-end">
                    <div className="rounded-[3px] bg-[#f0f0f0] px-3 py-2 text-sm font-bold tabular-nums text-black">
                      Total: {formatCad(getItemTotalCents(item))}
                    </div>
                  </div>
                </div>

                {/* Row 4: Artwork intent + Rush */}
                <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs text-[#666] mb-1">
                      Artwork 文件状态
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {ARTWORK_INTENT_OPTIONS.map((opt) => (
                        <label key={opt.value} className="flex items-center gap-1.5">
                          <input
                            type="radio"
                            name={`artworkIntent-${item.id}`}
                            value={opt.value}
                            checked={item.artworkIntent === opt.value}
                            onChange={() => updateItem(item.id, "artworkIntent", opt.value)}
                            className="h-3.5 w-3.5"
                          />
                          <span className={`text-xs ${item.artworkIntent === opt.value ? "font-semibold text-black" : "text-[#666]"}`}>
                            {opt.label}
                          </span>
                        </label>
                      ))}
                    </div>
                    {item.artworkIntent === "design-help" && (
                      <p className="mt-1 text-[11px] text-indigo-600">
                        +{formatCad(DESIGN_HELP_CENTS)} design-help fee will be added as a service line
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs text-[#666] mb-1">
                      Rush 加急
                    </label>
                    <label className="inline-flex items-center gap-2 rounded-[3px] border border-[#d0d0d0] px-3 py-2 cursor-pointer hover:border-black">
                      <input
                        type="checkbox"
                        checked={item.rushProduction}
                        onChange={(e) => updateItem(item.id, "rushProduction", e.target.checked)}
                        className="h-4 w-4"
                      />
                      <span className={`text-xs ${item.rushProduction ? "font-semibold text-amber-700" : "text-[#666]"}`}>
                        Rush production 加急生产
                      </span>
                    </label>
                  </div>
                </div>

                {/* Row 5: Item notes */}
                <div>
                  <label className="block text-xs text-[#666] mb-1">
                    Item Notes 备注
                  </label>
                  <input
                    type="text"
                    value={item.notes}
                    onChange={(e) =>
                      updateItem(item.id, "notes", e.target.value)
                    }
                    placeholder="Special instructions for this item..."
                    className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-black"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Order Notes + Payment ── */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="rounded-[3px] border border-[#e0e0e0] bg-white p-5">
            <h2 className="mb-3 text-sm font-bold text-black">
              Order Notes 订单备注
            </h2>
            <textarea
              value={orderNotes}
              onChange={(e) => setOrderNotes(e.target.value)}
              rows={3}
              placeholder="Internal notes about this order..."
              className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-black"
            />
          </div>

          <div className="rounded-[3px] border border-[#e0e0e0] bg-white p-5">
            <h2 className="mb-3 text-sm font-bold text-black">
              Payment 付款状态
            </h2>
            <div className="flex gap-3">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="paymentStatus"
                  value="unpaid"
                  checked={paymentStatus === "unpaid"}
                  onChange={() => setPaymentStatus("unpaid")}
                  className="h-4 w-4"
                />
                <span className="text-sm">Unpaid 未付款</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="paymentStatus"
                  value="paid"
                  checked={paymentStatus === "paid"}
                  onChange={() => setPaymentStatus("paid")}
                  className="h-4 w-4"
                />
                <span className="text-sm">Paid 已付款</span>
              </label>
            </div>
          </div>
        </div>

        {/* ── Summary + Submit ── */}
        <div className="rounded-[3px] border border-[#e0e0e0] bg-white p-5">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm text-[#666]">
                {items.length} item{items.length > 1 ? "s" : ""}
                {designHelpCount > 0 && (
                  <span className="ml-2 text-indigo-600">
                    + {designHelpCount} design-help fee{designHelpCount > 1 ? "s" : ""} ({formatCad(designHelpTotalCents)})
                  </span>
                )}
                {items.some((i) => i.rushProduction) && (
                  <span className="ml-2 text-amber-600">RUSH</span>
                )}
                {(() => {
                  const calc = items.filter(i => i.pricingSource === "calculated").length;
                  const over = items.filter(i => i.pricingSource === "overridden").length;
                  const manual = items.filter(i => i.pricingSource === "manual" && i.unitPriceDollars).length;
                  const parts = [];
                  if (calc > 0) parts.push(`${calc} calc`);
                  if (over > 0) parts.push(`${over} overridden`);
                  if (manual > 0) parts.push(`${manual} manual`);
                  return parts.length > 0 ? (
                    <span className="ml-2 text-[#999]">({parts.join(", ")})</span>
                  ) : null;
                })()}
              </span>
              <span className="ml-4 text-lg font-bold tabular-nums text-black">
                Order Total: {formatCad(orderTotalCents)}
              </span>
            </div>
            <div className="flex gap-3">
              <Link
                href="/admin/orders"
                className="rounded-[3px] border border-[#d0d0d0] px-5 py-2.5 text-sm font-medium text-black hover:border-black"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="rounded-[3px] bg-black px-6 py-2.5 text-sm font-bold text-[#fff] hover:bg-[#222] disabled:opacity-50"
              >
                {saving ? "Creating..." : "Create Order 创建订单"}
              </button>
            </div>
          </div>

          {error && (
            <p className="mt-3 text-sm text-red-600">{error}</p>
          )}
        </div>
      </form>
    </div>
  );
}
