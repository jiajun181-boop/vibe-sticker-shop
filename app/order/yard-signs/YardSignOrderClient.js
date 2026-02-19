"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useCartStore } from "@/lib/store";
import { showErrorToast, showSuccessToast } from "@/components/Toast";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { UploadButton } from "@/utils/uploadthing";
import Breadcrumbs from "@/components/Breadcrumbs";

const DEBOUNCE_MS = 300;

const formatCad = (cents) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);

// ─── Yard Sign Configuration ───

const SIZES = [
  { id: "12x18", label: '12" × 18"', tag: "12×18", w: 12, h: 18 },
  { id: "18x24", label: '18" × 24"', tag: "18×24", w: 18, h: 24 },
  { id: "24x36", label: '24" × 36"', tag: "24×36", w: 24, h: 36 },
  { id: "36x48", label: '36" × 48"', tag: "36×48", w: 36, h: 48 },
];

const MATERIALS = [
  { id: "4mm-corrugated", surcharge: 0 },
  { id: "6mm-corrugated", surcharge: 50 },
  { id: "10mm-corrugated", surcharge: 100 },
];

const SIDES = [
  { id: "single", surcharge: 0 },
  { id: "double", surcharge: 0 },
];

const HARDWARE = [
  { id: "none", surcharge: 0 },
  { id: "h-stakes", surcharge: 150 },
  { id: "step-stakes", surcharge: 200 },
];

const QUANTITIES = [1, 5, 10, 25, 50, 100];

// ─── Icons ───

function MaterialIcon({ type, className = "h-7 w-7" }) {
  const common = { className, strokeWidth: 1.5, fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" };
  switch (type) {
    case "4mm-corrugated":
      return (
        <svg {...common}>
          <rect x="3" y="4" width="18" height="16" rx="1" />
          <path strokeLinecap="round" d="M7 8h10M7 12h10M7 16h10" opacity="0.4" />
        </svg>
      );
    case "6mm-corrugated":
      return (
        <svg {...common}>
          <rect x="3" y="4" width="18" height="16" rx="1" />
          <path strokeLinecap="round" d="M7 8h10M7 12h10M7 16h10" />
          <path d="M3 4h18v3H3z" opacity="0.15" fill="currentColor" />
        </svg>
      );
    case "10mm-corrugated":
      return (
        <svg {...common}>
          <rect x="3" y="3" width="18" height="18" rx="1" strokeWidth="2" />
          <path strokeLinecap="round" d="M7 8h10M7 12h10M7 16h10" />
          <path d="M3 3h18v4H3z" opacity="0.2" fill="currentColor" />
        </svg>
      );
    default:
      return null;
  }
}

// ─── Main Component ───

export default function YardSignOrderClient() {
  const { t } = useTranslation();
  const { addItem, openCart } = useCartStore();

  const [sizeIdx, setSizeIdx] = useState(1); // 18×24 default
  const [materialId, setMaterialId] = useState("4mm-corrugated");
  const [sidesId, setSidesId] = useState("single");
  const [hardwareId, setHardwareId] = useState("none");
  const [quantity, setQuantity] = useState(10);
  const [customQty, setCustomQty] = useState("");
  const [uploadedFile, setUploadedFile] = useState(null);

  const [quoteData, setQuoteData] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
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

    fetch("/api/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug: "yard-signs",
        quantity: activeQty,
        widthIn: size.w,
        heightIn: size.h,
        sides: sidesId,
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
  }, [size.w, size.h, activeQty, sidesId]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(fetchQuote, DEBOUNCE_MS);
    return () => clearTimeout(debounceRef.current);
  }, [fetchQuote]);

  // ─── Pricing ───

  const subtotalCents = quoteData?.totalCents ?? 0;
  const materialSurcharge = (MATERIALS.find((m) => m.id === materialId)?.surcharge ?? 0) * activeQty;
  const hardwareSurcharge = (HARDWARE.find((h) => h.id === hardwareId)?.surcharge ?? 0) * activeQty;
  const adjustedSubtotal = subtotalCents + materialSurcharge + hardwareSurcharge;
  const totalCents = adjustedSubtotal;

  const canAddToCart = quoteData && !quoteLoading && activeQty > 0;

  // ─── Cart ───

  function buildCartItem() {
    if (!quoteData || activeQty <= 0) return null;

    const nameParts = [
      t("ys.title"),
      size.tag,
      t(`ys.sides.${sidesId}`),
    ];

    return {
      id: "yard-signs",
      name: nameParts.join(" — "),
      slug: "yard-signs",
      price: Math.round(adjustedSubtotal / activeQty),
      quantity: activeQty,
      options: {
        sizeId: size.id,
        sizeLabel: size.label,
        width: size.w,
        height: size.h,
        material: materialId,
        sides: sidesId,
        hardware: hardwareId,
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
    showSuccessToast(t("ys.addedToCart"));
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
          { label: t("ys.breadcrumb"), href: "/shop/signs-banners/yard-signs" },
          { label: t("ys.order") },
        ]}
      />

      <h1 className="mb-8 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
        {t("ys.title")}
      </h1>

      <div className="lg:grid lg:grid-cols-5 lg:gap-10">
        {/* ── LEFT: Options ── */}
        <div className="space-y-8 lg:col-span-3">

          {/* Size */}
          <Section label={t("ys.size")}>
            <div className="flex flex-wrap gap-2">
              {SIZES.map((s, i) => (
                <Chip key={s.id} active={sizeIdx === i} onClick={() => setSizeIdx(i)}>
                  {s.label} ({s.tag})
                </Chip>
              ))}
            </div>
          </Section>

          {/* Material */}
          <Section label={t("ys.material.label")}>
            <div className="grid grid-cols-3 gap-3">
              {MATERIALS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMaterialId(m.id)}
                  className={`group flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-center transition-all ${
                    materialId === m.id
                      ? "border-gray-900 bg-gray-900 text-white shadow-md"
                      : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
                  }`}
                >
                  <MaterialIcon type={m.id} className="h-7 w-7" />
                  <span className="text-sm font-semibold">{t(`ys.material.${m.id}`)}</span>
                  <span className={`text-[11px] leading-tight ${materialId === m.id ? "text-gray-300" : "text-gray-400"}`}>
                    {t(`ys.materialDesc.${m.id}`)}
                  </span>
                  {m.surcharge > 0 && (
                    <span className={`text-[11px] font-medium ${materialId === m.id ? "text-amber-300" : "text-amber-600"}`}>
                      +{formatCad(m.surcharge)}/ea
                    </span>
                  )}
                </button>
              ))}
            </div>
          </Section>

          {/* Sides */}
          <Section label={t("ys.sides.label")}>
            <div className="flex flex-wrap gap-2">
              {SIDES.map((s) => (
                <Chip key={s.id} active={sidesId === s.id} onClick={() => setSidesId(s.id)}>
                  {t(`ys.sides.${s.id}`)}
                </Chip>
              ))}
            </div>
          </Section>

          {/* Hardware */}
          <Section label={t("ys.hardware.label")}>
            <div className="flex flex-wrap gap-2">
              {HARDWARE.map((h) => (
                <Chip key={h.id} active={hardwareId === h.id} onClick={() => setHardwareId(h.id)}>
                  {t(`ys.hardware.${h.id}`)}
                  {h.surcharge > 0 && (
                    <span className="ml-1 text-[11px] opacity-70">+{formatCad(h.surcharge)}/ea</span>
                  )}
                </Chip>
              ))}
            </div>
          </Section>

          {/* Quantity */}
          <Section label={t("ys.quantity")}>
            <div className="flex flex-wrap gap-2">
              {QUANTITIES.map((q) => (
                <Chip
                  key={q}
                  active={customQty === "" && quantity === q}
                  onClick={() => { setQuantity(q); setCustomQty(""); }}
                >
                  {q.toLocaleString()}
                </Chip>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <label className="text-xs text-gray-500">{t("ys.customQty")}:</label>
              <input
                type="number"
                min="1"
                max="999999"
                value={customQty}
                onChange={(e) => setCustomQty(e.target.value)}
                placeholder="e.g. 75"
                className="w-28 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
              />
            </div>
          </Section>

          {/* File Upload */}
          <Section label={t("ys.artwork")} optional>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <p className="mb-3 text-xs text-gray-600">{t("ys.uploadHint")}</p>
              {uploadedFile ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-800">{uploadedFile.name}</span>
                  <button
                    type="button"
                    onClick={() => setUploadedFile(null)}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    {t("ys.remove")}
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
            <h2 className="text-base font-bold text-gray-900">{t("ys.summary")}</h2>

            <dl className="space-y-2 text-sm">
              <Row label={t("ys.size")} value={`${size.label} (${size.tag})`} />
              <Row label={t("ys.material.label")} value={t(`ys.material.${materialId}`)} />
              <Row label={t("ys.sides.label")} value={t(`ys.sides.${sidesId}`)} />
              {hardwareId !== "none" && (
                <Row label={t("ys.hardware.label")} value={t(`ys.hardware.${hardwareId}`)} />
              )}
              <Row label={t("ys.quantity")} value={activeQty > 0 ? activeQty.toLocaleString() : "\u2014"} />
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
                <Row label={t("ys.basePrice")} value={formatCad(subtotalCents)} />
                {materialSurcharge > 0 && (
                  <Row label={t(`ys.material.${materialId}`)} value={`+ ${formatCad(materialSurcharge)}`} />
                )}
                {hardwareSurcharge > 0 && (
                  <Row label={t(`ys.hardware.${hardwareId}`)} value={`+ ${formatCad(hardwareSurcharge)}`} />
                )}
                <Row label={t("ys.subtotal")} value={formatCad(adjustedSubtotal)} />
                <div className="flex justify-between border-t border-gray-100 pt-2">
                  <dt className="font-semibold text-gray-900">{t("ys.total")}</dt>
                  <dd className="text-lg font-bold text-gray-900">{formatCad(totalCents)}</dd>
                </div>
                <div className="pt-1">
                  <p className="text-[11px] text-gray-400">
                    {formatCad(Math.round(adjustedSubtotal / activeQty))}/{t("ys.each")}
                  </p>
                </div>
              </dl>
            ) : (
              <p className="text-xs text-gray-400">{t("ys.selectOptions")}</p>
            )}

            <div className="space-y-3">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={!canAddToCart}
                className={`w-full rounded-full px-4 py-3 text-sm font-semibold uppercase tracking-[0.15em] transition-all ${
                  canAddToCart
                    ? "bg-gray-900 text-white hover:bg-gray-800"
                    : "cursor-not-allowed bg-gray-200 text-gray-400"
                }`}
              >
                {t("ys.addToCart")}
              </button>
              <button
                type="button"
                onClick={handleBuyNow}
                disabled={!canAddToCart || buyNowLoading}
                className={`w-full rounded-full border-2 px-4 py-3 text-sm font-semibold uppercase tracking-[0.15em] transition-all ${
                  canAddToCart && !buyNowLoading
                    ? "border-gray-900 text-gray-900 hover:bg-gray-50"
                    : "cursor-not-allowed border-gray-200 text-gray-400"
                }`}
              >
                {buyNowLoading ? t("ys.processing") : t("ys.buyNow")}
              </button>
            </div>

            <div className="flex items-center justify-center gap-4 pt-2 text-[11px] text-gray-400">
              <span>{t("ys.badge.weatherproof")}</span>
              <span className="text-gray-300">|</span>
              <span>{t("ys.badge.shipping")}</span>
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
                  {activeQty.toLocaleString()} × {size.tag} {t(`ys.sides.${sidesId}`)}
                </p>
              </>
            ) : (
              <p className="text-sm text-gray-400">{t("ys.selectOptions")}</p>
            )}
          </div>
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={!canAddToCart}
            className={`shrink-0 rounded-full px-5 py-2.5 text-xs font-semibold uppercase tracking-wider transition-all ${
              canAddToCart
                ? "bg-gray-900 text-white hover:bg-gray-800"
                : "cursor-not-allowed bg-gray-200 text-gray-400"
            }`}
          >
            {t("ys.addToCart")}
          </button>
        </div>
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
          ? "border-gray-900 bg-gray-900 text-white"
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
