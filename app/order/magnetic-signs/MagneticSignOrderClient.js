"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useCartStore } from "@/lib/store";
import { showErrorToast, showSuccessToast } from "@/components/Toast";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { UploadButton } from "@/utils/uploadthing";
import Breadcrumbs from "@/components/Breadcrumbs";
import ImageGallery from "@/components/product/ImageGallery";

const DEBOUNCE_MS = 300;

const formatCad = (cents) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);

// ─── Magnetic Sign Configuration ───

const SIZES = [
  { id: "12x18", label: '12" \u00d7 18"', tag: "12\u00d718", w: 12, h: 18 },
  { id: "12x24", label: '12" \u00d7 24"', tag: "12\u00d724", w: 12, h: 24 },
  { id: "18x24", label: '18" \u00d7 24"', tag: "18\u00d724", w: 18, h: 24 },
  { id: "24x36", label: '24" \u00d7 36"', tag: "24\u00d736", w: 24, h: 36 },
];

const THICKNESSES = [
  { id: "30mil", surcharge: 0 },
  { id: "45mil", surcharge: 200 },
];

const CORNERS = [
  { id: "square", surcharge: 0 },
  { id: "rounded", surcharge: 100 },
];

const QUANTITIES = [1, 2, 5, 10];

// ─── Icons ───

function ThicknessIcon({ type, className = "h-7 w-7" }) {
  const common = { className, strokeWidth: 1.5, fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" };
  switch (type) {
    case "30mil":
      return (
        <svg {...common}>
          <rect x="3" y="6" width="18" height="12" rx="2" />
          <path strokeLinecap="round" d="M7 12h10" opacity="0.4" />
        </svg>
      );
    case "45mil":
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="14" rx="2" strokeWidth="2" />
          <path strokeLinecap="round" d="M7 10h10M7 14h10" opacity="0.5" />
          <path d="M3 5h18v3H3z" opacity="0.15" fill="currentColor" />
        </svg>
      );
    default:
      return null;
  }
}

// ─── Main Component ───

export default function MagneticSignOrderClient({ productImages = [] }) {
  const { t } = useTranslation();
  const { addItem, openCart } = useCartStore();

  const [sizeIdx, setSizeIdx] = useState(1); // 12x24 default
  const [thickness, setThickness] = useState("30mil");
  const [corners, setCorners] = useState("square");
  const [quantity, setQuantity] = useState(2);
  const [customQty, setCustomQty] = useState("");
  const [uploadedFile, setUploadedFile] = useState(null);

  const [quoteData, setQuoteData] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(true);
  const [quoteError, setQuoteError] = useState(null);
  const [buyNowLoading, setBuyNowLoading] = useState(false);

  const debounceRef = useRef(null);
  const abortRef = useRef(null);

  const size = SIZES[sizeIdx];

  const activeQty = useMemo(() => {
    if (customQty !== "") {
      const n = parseInt(customQty, 10);
      return n > 0 ? n : 0;
    }
    return quantity;
  }, [quantity, customQty]);

  // ─── Quote ───

  const fetchQuote = useCallback(() => {
    if (abortRef.current) abortRef.current.abort();
    if (activeQty <= 0) {
      setQuoteData(null);
      return;
    }
    const ac = new AbortController();
    abortRef.current = ac;
    setQuoteLoading(true);
    setQuoteError(null);

    fetch("/api/pricing/calculate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug: "magnetic-signs",
        quantity: activeQty,
        widthIn: size.w,
        heightIn: size.h,
      }),
      signal: ac.signal,
    })
      .then((r) => r.json().then((d) => ({ ok: r.ok, data: d })))
      .then(({ ok, data }) => {
        if (!ok) throw new Error(data.error || "Quote failed");
        setQuoteData(data);
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        setQuoteError(err.message);
      })
      .finally(() => setQuoteLoading(false));
  }, [size.w, size.h, activeQty]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(fetchQuote, DEBOUNCE_MS);
    return () => clearTimeout(debounceRef.current);
  }, [fetchQuote]);

  // ─── Pricing ───

  const subtotalCents = quoteData?.totalCents ?? 0;
  const thicknessSurcharge = (THICKNESSES.find((th) => th.id === thickness)?.surcharge ?? 0) * activeQty;
  const cornerSurcharge = (CORNERS.find((c) => c.id === corners)?.surcharge ?? 0) * activeQty;

  const adjustedSubtotal = subtotalCents + thicknessSurcharge + cornerSurcharge;
  const totalCents = adjustedSubtotal;

  const canAddToCart = quoteData && !quoteLoading && activeQty > 0;

  // ─── Cart ───

  function buildCartItem() {
    if (!quoteData || activeQty <= 0) return null;

    return {
      id: "magnetic-signs",
      name: `${t("ms.title")} \u2014 ${size.tag}`,
      slug: "magnetic-signs",
      price: Math.round(adjustedSubtotal / activeQty),
      quantity: activeQty,
      options: {
        sizeId: size.id,
        sizeLabel: size.label,
        width: size.w,
        height: size.h,
        thickness,
        corners,
        fileName: uploadedFile?.name || null,
      },
      forceNewLine: true,
    };
  }

  function handleAddToCart() {
    const item = buildCartItem();
    if (!item) return;
    addItem(item);
    openCart();
    showSuccessToast(t("ms.addedToCart"));
  }

  async function handleBuyNow() {
    const item = buildCartItem();
    if (!item || buyNowLoading) return;
    setBuyNowLoading(true);
    try {
      const meta = {};
      for (const [k, v] of Object.entries(item.options)) {
        if (v == null) continue;
        meta[k] = typeof v === "object" ? JSON.stringify(v) : v;
      }
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [{
            productId: String(item.id),
            slug: String(item.slug),
            name: item.name,
            unitAmount: item.price,
            quantity: item.quantity,
            meta,
          }],
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.url) throw new Error(data?.error || "Checkout failed");
      window.location.href = data.url;
    } catch (e) {
      showErrorToast(e instanceof Error ? e.message : "Checkout failed");
    } finally {
      setBuyNowLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumbs
        items={[
          { label: t("nav.shop"), href: "/shop" },
          { label: t("ms.breadcrumb"), href: "/shop/signs-rigid-boards" },
          { label: t("ms.order") },
        ]}
      />

      <h1 className="mb-8 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
        {t("ms.title")}
      </h1>

      <div className="lg:grid lg:grid-cols-5 lg:gap-10">
        {/* ── LEFT: Options ── */}
        <div className="space-y-8 lg:col-span-3">
          {/* Product Images */}
          {productImages.length > 0 && (
            <div className="mb-2">
              <ImageGallery images={productImages} productName={t("ms.title")} />
            </div>
          )}

          {/* Size */}
          <Section label={t("ms.size")}>
            <div className="flex flex-wrap gap-2">
              {SIZES.map((s, i) => (
                <Chip key={s.id} active={sizeIdx === i} onClick={() => setSizeIdx(i)}>
                  {s.label}
                </Chip>
              ))}
            </div>
          </Section>

          {/* Thickness */}
          <Section label={t("ms.thickness.label")}>
            <div className="grid grid-cols-2 gap-3">
              {THICKNESSES.map((th) => (
                <button
                  key={th.id}
                  type="button"
                  onClick={() => setThickness(th.id)}
                  className={`group flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-center transition-all ${
                    thickness === th.id
                      ? "border-gray-900 bg-gray-900 text-[#fff] shadow-md"
                      : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
                  }`}
                >
                  <ThicknessIcon type={th.id} className="h-7 w-7" />
                  <span className="text-sm font-semibold">{t(`ms.thickness.${th.id}`)}</span>
                  <span className={`text-[11px] leading-tight ${thickness === th.id ? "text-gray-300" : "text-gray-400"}`}>
                    {t(`ms.thicknessDesc.${th.id}`)}
                  </span>
                  {th.surcharge > 0 && (
                    <span className={`text-[11px] font-medium ${thickness === th.id ? "text-amber-300" : "text-amber-600"}`}>
                      +{formatCad(th.surcharge)}/ea
                    </span>
                  )}
                </button>
              ))}
            </div>
          </Section>

          {/* Corners */}
          <Section label={t("ms.corners.label")}>
            <div className="flex flex-wrap gap-2">
              {CORNERS.map((c) => (
                <Chip key={c.id} active={corners === c.id} onClick={() => setCorners(c.id)}>
                  {t(`ms.corners.${c.id}`)}
                  {c.surcharge > 0 && (
                    <span className="ml-1 text-[11px] opacity-70">+{formatCad(c.surcharge)}/ea</span>
                  )}
                </Chip>
              ))}
            </div>
          </Section>

          {/* Quantity */}
          <Section label={t("ms.quantity")}>
            <div className="flex flex-wrap gap-2">
              {QUANTITIES.map((q) => (
                <Chip
                  key={q}
                  active={customQty === "" && quantity === q}
                  onClick={() => { setQuantity(q); setCustomQty(""); }}
                >
                  {q === 2 ? `${q} (${t("ms.pair")})` : q.toLocaleString()}
                </Chip>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <label className="text-xs text-gray-500">{t("ms.customQty")}:</label>
              <input
                type="number"
                min="1"
                max="999999"
                value={customQty}
                onChange={(e) => setCustomQty(e.target.value)}
                placeholder="e.g. 6"
                className="w-28 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
              />
            </div>
          </Section>

          {/* Artwork Upload */}
          <Section label={t("ms.artwork")} optional>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <p className="mb-3 text-xs text-gray-600">{t("ms.uploadHint")}</p>
              {uploadedFile ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-800">{uploadedFile.name}</span>
                  <button
                    type="button"
                    onClick={() => setUploadedFile(null)}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    {t("ms.remove")}
                  </button>
                </div>
              ) : (
                <UploadButton
                  endpoint="artworkUploader"
                  onClientUploadComplete={(res) => {
                    const first = Array.isArray(res) ? res[0] : null;
                    if (!first) return;
                    setUploadedFile({
                      url: first.ufsUrl || first.url,
                      key: first.key,
                      name: first.name,
                      size: first.size,
                    });
                  }}
                  onUploadError={(err) => showErrorToast(err?.message || "Upload failed")}
                />
              )}
            </div>
          </Section>
        </div>

        {/* ── RIGHT: Summary ── */}
        <aside className="hidden lg:col-span-2 lg:block">
          <div className="sticky top-24 space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-bold text-gray-900">{t("ms.summary")}</h2>

            <dl className="space-y-2 text-sm">
              <Row label={t("ms.size")} value={size.label} />
              <Row label={t("ms.thickness.label")} value={t(`ms.thickness.${thickness}`)} />
              <Row label={t("ms.corners.label")} value={t(`ms.corners.${corners}`)} />
              <Row label={t("ms.quantity")} value={activeQty > 0 ? activeQty.toLocaleString() : "\u2014"} />
            </dl>

            <hr className="border-gray-100" />

            {quoteLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-4 animate-pulse rounded bg-gray-100" />
                ))}
              </div>
            ) : quoteError ? (
              <p className="text-xs text-red-500">{quoteError}</p>
            ) : quoteData ? (
              <dl className="space-y-2 text-sm">
                <Row label={t("ms.basePrice")} value={formatCad(subtotalCents)} />
                {thicknessSurcharge > 0 && (
                  <Row label={t(`ms.thickness.${thickness}`)} value={`+ ${formatCad(thicknessSurcharge)}`} />
                )}
                {cornerSurcharge > 0 && (
                  <Row label={t(`ms.corners.${corners}`)} value={`+ ${formatCad(cornerSurcharge)}`} />
                )}
                <Row label={t("ms.subtotal")} value={formatCad(adjustedSubtotal)} />
                <div className="flex justify-between border-t border-gray-100 pt-2">
                  <dt className="font-semibold text-gray-900">{t("ms.total")}</dt>
                  <dd className="text-lg font-bold text-gray-900">{formatCad(totalCents)}</dd>
                </div>
                {activeQty > 1 && (
                  <div className="pt-1">
                    <p className="text-[11px] text-gray-400">
                      {formatCad(Math.round(adjustedSubtotal / activeQty))}/{t("ms.each")}
                    </p>
                  </div>
                )}
              </dl>
            ) : (
              <p className="text-xs text-gray-400">{t("ms.selectOptions")}</p>
            )}

            <div className="space-y-3">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={!canAddToCart}
                className={`w-full rounded-full px-4 py-3 text-sm font-semibold uppercase tracking-[0.15em] transition-all ${
                  canAddToCart
                    ? "bg-gray-900 text-[#fff] hover:bg-gray-800"
                    : "cursor-not-allowed bg-gray-200 text-gray-400"
                }`}
              >
                {t("ms.addToCart")}
              </button>
              <button
                type="button"
                onClick={handleBuyNow}
                disabled={!canAddToCart || buyNowLoading}
                className={`w-full rounded-full border-2 px-4 py-3 text-sm font-semibold uppercase tracking-[0.15em] transition-all ${
                  canAddToCart && !buyNowLoading
                    ? "border-gray-900 bg-gray-900 text-[#fff] hover:bg-gray-800"
                    : "cursor-not-allowed border-gray-200 text-gray-400"
                }`}
              >
                {buyNowLoading ? t("ms.processing") : t("ms.buyNow")}
              </button>
            </div>

            <div className="flex items-center justify-center gap-4 pt-2 text-[11px] text-gray-400">
              <span>{t("ms.badge.removable")}</span>
              <span className="text-gray-300">|</span>
              <span>{t("ms.badge.shipping")}</span>
            </div>
          </div>
        </aside>
      </div>

      {/* ── MOBILE: Bottom bar ── */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white px-4 py-3 shadow-[0_-2px_12px_rgba(0,0,0,0.08)] lg:hidden">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <div className="min-w-0 flex-1">
            {quoteLoading ? (
              <div className="h-5 w-20 animate-pulse rounded bg-gray-200" />
            ) : quoteData ? (
              <>
                <p className="text-lg font-bold text-gray-900">{formatCad(totalCents)}</p>
                <p className="truncate text-[11px] text-gray-500">
                  {activeQty} \u00d7 {t("ms.title")} {size.tag}
                </p>
              </>
            ) : (
              <p className="text-sm text-gray-400">{t("ms.selectOptions")}</p>
            )}
          </div>
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={!canAddToCart}
            className={`shrink-0 rounded-full px-5 py-2.5 text-xs font-semibold uppercase tracking-wider transition-all ${
              canAddToCart
                ? "bg-gray-900 text-[#fff] hover:bg-gray-800"
                : "cursor-not-allowed bg-gray-200 text-gray-400"
            }`}
          >
            {t("ms.addToCart")}
          </button>
        </div>
      </div>

      {/* ── Product Content ── */}
      <div className="mt-16 space-y-12">
        <section>
          <h2 className="text-xl font-bold text-gray-900">About Magnetic Signs</h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-gray-600">
            Custom magnetic signs for vehicles, metal doors, and temporary signage. Made from premium flexible magnetic material with full-colour UV printing, our magnetic signs are easy to apply and remove without damaging paint or surfaces. Perfect for service vehicles, delivery vans, real estate agents, and any business that needs portable, reusable signage. Produced at La Lunar Printing in Toronto with vibrant, weather-resistant inks.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900">Specifications</h2>
          <div className="mt-4 overflow-hidden rounded-xl border border-gray-200">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-gray-100">
                {[
                  ["Material", "30mil (standard) or 45mil (heavy-duty) flexible magnet"],
                  ["Printing", "UV-resistant, full colour CMYK"],
                  ["Durability", "3\u20135 years with proper care"],
                  ["Corners", "Square or rounded"],
                  ["Sizes", '12" \u00d7 18" up to 24" \u00d7 36"'],
                  ["Adhesion", "Vehicle-safe magnetic grip; will not scratch paint"],
                ].map(([label, value]) => (
                  <tr key={label}>
                    <td className="whitespace-nowrap bg-gray-50 px-4 py-2.5 font-medium text-gray-700">{label}</td>
                    <td className="px-4 py-2.5 text-gray-600">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900">FAQ</h2>
          <div className="mt-4 divide-y divide-gray-200 rounded-xl border border-gray-200">
            {[
              { q: "Will magnetic signs damage my vehicle's paint?", a: "No, our magnetic signs are designed to be vehicle-safe. The magnetic backing is smooth and will not scratch or damage automotive paint finishes. To avoid any issues, make sure the vehicle surface is clean and dry before applying, and remove the sign periodically to clean both surfaces and prevent moisture buildup." },
              { q: "What thickness should I choose: 30mil or 45mil?", a: "Our 30mil magnet is suitable for standard use on flat or gently curved vehicle surfaces at city driving speeds. The 45mil heavy-duty option provides a stronger magnetic grip, making it better for highway driving, larger signs, and slightly curved surfaces like van panels. If you drive at highway speeds frequently, we recommend the 45mil." },
              { q: "Can I use magnetic signs on any vehicle?", a: "Magnetic signs work on any steel or iron body panels. They will not adhere to aluminum, fibreglass, or plastic body panels. Most cars, trucks, and vans have steel doors and body panels. If you are unsure, test with a refrigerator magnet on the area where you plan to place your sign." },
              { q: "How do I clean my magnetic signs?", a: "Wipe the printed side with a damp cloth and mild soap. Clean the magnetic backing with a dry cloth to remove any road grime or dust. Avoid using harsh chemicals, abrasive cleaners, or pressure washers directly on the printed surface, as these can damage the UV coating over time." },
              { q: "Do magnetic signs hold up in rain and car washes?", a: "Our UV-printed magnetic signs are water-resistant and can handle rain without issue. However, we recommend removing them before going through an automatic car wash, as the brushes and high-pressure water can dislodge or damage the sign. Hand washing around the sign is perfectly fine." },
              { q: "How should I store magnetic signs when not in use?", a: "Store your magnetic signs flat on a clean, dry surface. Do not fold or roll them tightly, as this can cause permanent curling or cracking of the printed surface. If stacking multiple signs, place a sheet of paper between them to prevent the printed surfaces from sticking together. Keep them away from extreme heat sources." },
            ].map((faq, i) => (
              <details key={i} className="group">
                <summary className="flex cursor-pointer items-center justify-between px-4 py-3 text-sm font-medium text-gray-900 hover:bg-gray-50">
                  {faq.q}
                  <svg className="h-4 w-4 shrink-0 text-gray-400 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </summary>
                <p className="px-4 pb-3 text-sm leading-relaxed text-gray-600">{faq.a}</p>
              </details>
            ))}
          </div>
        </section>
      </div>

      <div className="h-20 lg:hidden" />
    </main>
  );
}

// ─── Helpers ───

function Section({ label, optional, children }) {
  return (
    <section>
      <div className="mb-3 flex items-baseline gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">{label}</h2>
        {optional && <span className="text-[10px] text-gray-400">(optional)</span>}
      </div>
      {children}
    </section>
  );
}

function Chip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
        active
          ? "border-gray-900 bg-gray-900 text-[#fff]"
          : "border-gray-300 bg-white text-gray-700 hover:border-gray-500"
      }`}
    >
      {children}
    </button>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between">
      <dt className="text-gray-500">{label}</dt>
      <dd className="font-medium text-gray-800">{value}</dd>
    </div>
  );
}
