"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useCartStore } from "@/lib/store";
import { showErrorToast, showSuccessToast } from "@/components/Toast";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { UploadButton } from "@/utils/uploadthing";
import Breadcrumbs from "@/components/Breadcrumbs";
import MeshBannerSections from "@/components/banners/MeshBannerSections";

const DEBOUNCE_MS = 300;

const formatCad = (cents) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);

// ─── Mesh Banner Configuration ───

const PRESET_SIZES = [
  { id: "3x6", label: "3' \u00d7 6'", tag: "3\u00d76", w: 36, h: 72 },
  { id: "4x8", label: "4' \u00d7 8'", tag: "4\u00d78", w: 48, h: 96 },
  { id: "4x10", label: "4' \u00d7 10'", tag: "4\u00d710", w: 48, h: 120 },
  { id: "5x10", label: "5' \u00d7 10'", tag: "5\u00d710", w: 60, h: 120 },
  { id: "6x12", label: "6' \u00d7 12'", tag: "6\u00d712", w: 72, h: 144 },
];

const MATERIALS = [
  { id: "8oz-mesh", surcharge: 0 },
  { id: "9oz-mesh", surcharge: 100 },
];

// Mesh: only grommets & hemmed edges (no pole pockets — mesh too soft)
const FINISHINGS = [
  { id: "hemmed-grommets", surcharge: 0 },
  { id: "hemmed-only", surcharge: 0 },
  { id: "wind-slits", surcharge: 100 },
];

const TURNAROUNDS = [
  { id: "standard", multiplier: 1 },
  { id: "rush", multiplier: 1.3 },
];

const QUANTITIES = [1, 2, 5, 10, 25];

// ─── Icons ───

function MaterialIcon({ type, className = "h-7 w-7" }) {
  const common = { className, strokeWidth: 1.5, fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" };
  switch (type) {
    case "8oz-mesh":
      return (
        <svg {...common}>
          <rect x="3" y="4" width="18" height="16" rx="1" />
          <path strokeLinecap="round" d="M7 8h4M13 8h4M7 12h4M13 12h4M7 16h4M13 16h4" opacity="0.5" />
        </svg>
      );
    case "9oz-mesh":
      return (
        <svg {...common}>
          <rect x="3" y="4" width="18" height="16" rx="1" strokeWidth="2" />
          <path strokeLinecap="round" d="M7 8h4M13 8h4M7 12h4M13 12h4M7 16h4M13 16h4" />
          <path d="M3 4h18v3H3z" opacity="0.15" fill="currentColor" />
        </svg>
      );
    default:
      return null;
  }
}

// ─── Main Component ───

export default function MeshBannerOrderClient() {
  const { t } = useTranslation();
  const { addItem, openCart } = useCartStore();

  const [sizeMode, setSizeMode] = useState("preset");
  const [sizeIdx, setSizeIdx] = useState(0);

  // Custom size ft+in
  const [customWFt, setCustomWFt] = useState("3");
  const [customWIn, setCustomWIn] = useState("0");
  const [customHFt, setCustomHFt] = useState("6");
  const [customHIn, setCustomHIn] = useState("0");

  const [materialId, setMaterialId] = useState("8oz-mesh");
  const [finishingId, setFinishingId] = useState("hemmed-grommets");
  const [turnaroundId, setTurnaroundId] = useState("standard");
  const [quantity, setQuantity] = useState(1);
  const [customQty, setCustomQty] = useState("");
  const [uploadedFile, setUploadedFile] = useState(null);

  const [quoteData, setQuoteData] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState(null);
  const [buyNowLoading, setBuyNowLoading] = useState(false);

  const debounceRef = useRef(null);
  const abortRef = useRef(null);

  const size = useMemo(() => {
    if (sizeMode === "custom") {
      const wInches = Math.max(12, Math.min(72, (parseInt(customWFt, 10) || 0) * 12 + (parseInt(customWIn, 10) || 0)));
      const hInches = Math.max(12, Math.min(600, (parseInt(customHFt, 10) || 0) * 12 + (parseInt(customHIn, 10) || 0)));
      const wFt = Math.floor(wInches / 12);
      const wRem = wInches % 12;
      const hFt = Math.floor(hInches / 12);
      const hRem = hInches % 12;
      const label = wRem || hRem
        ? `${wFt}'${wRem}" \u00d7 ${hFt}'${hRem}"`
        : `${wFt}' \u00d7 ${hFt}'`;
      return { id: "custom", label, tag: "Custom", w: wInches, h: hInches };
    }
    return PRESET_SIZES[sizeIdx];
  }, [sizeMode, sizeIdx, customWFt, customWIn, customHFt, customHIn]);

  const activeQty = useMemo(() => {
    if (customQty !== "") {
      const n = parseInt(customQty, 10);
      return n > 0 ? n : 0;
    }
    return quantity;
  }, [quantity, customQty]);

  const turnaround = TURNAROUNDS.find((t) => t.id === turnaroundId) || TURNAROUNDS[0];

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
        slug: "mesh-banners",
        quantity: activeQty,
        widthIn: size.w,
        heightIn: size.h,
        sides: "single",
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
  const materialSurcharge = (MATERIALS.find((m) => m.id === materialId)?.surcharge ?? 0) * activeQty;
  const finishingSurcharge = (FINISHINGS.find((f) => f.id === finishingId)?.surcharge ?? 0) * activeQty;
  const adjustedSubtotal = subtotalCents + materialSurcharge + finishingSurcharge;
  const totalBeforeRush = adjustedSubtotal;
  const totalCents = Math.round(totalBeforeRush * turnaround.multiplier);

  const canAddToCart = quoteData && !quoteLoading && activeQty > 0;

  // ─── Cart ───

  function buildCartItem() {
    if (!quoteData || activeQty <= 0) return null;

    const nameParts = [t("mb.title"), size.tag || size.label];
    if (turnaroundId === "rush") nameParts.push("RUSH");

    return {
      id: "mesh-banners",
      name: nameParts.join(" \u2014 "),
      slug: "mesh-banners",
      price: Math.round(totalCents / activeQty),
      quantity: activeQty,
      options: {
        sizeId: size.id,
        sizeLabel: size.label,
        width: size.w,
        height: size.h,
        material: materialId,
        finishing: finishingId,
        sides: "single",
        turnaround: turnaroundId,
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
    showSuccessToast(t("mb.addedToCart"));
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
          { label: t("mb.breadcrumb"), href: "/shop/banners-displays" },
          { label: t("mb.order") },
        ]}
      />

      <h1 className="mb-8 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
        {t("mb.title")}
      </h1>

      <div className="lg:grid lg:grid-cols-5 lg:gap-10">
        {/* ── LEFT: Options ── */}
        <div className="space-y-8 lg:col-span-3">

          {/* Size */}
          <Section label={t("mb.size")}>
            <div className="mb-3 flex gap-2">
              <Chip active={sizeMode === "preset"} onClick={() => setSizeMode("preset")}>
                {t("banner.sizeMode.preset")}
              </Chip>
              <Chip active={sizeMode === "custom"} onClick={() => setSizeMode("custom")}>
                {t("banner.sizeMode.custom")}
              </Chip>
            </div>

            {sizeMode === "preset" ? (
              <div className="flex flex-wrap gap-2">
                {PRESET_SIZES.map((s, i) => (
                  <Chip key={s.id} active={sizeIdx === i} onClick={() => setSizeIdx(i)}>
                    {s.label}
                  </Chip>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-500 w-14">{t("banner.width")}:</span>
                  <input type="number" min="1" max="6" value={customWFt} onChange={(e) => setCustomWFt(e.target.value)} className="w-16 rounded-lg border border-gray-300 px-2 py-1.5 text-sm text-center focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900" />
                  <span className="text-xs text-gray-500">ft</span>
                  <input type="number" min="0" max="11" value={customWIn} onChange={(e) => setCustomWIn(e.target.value)} className="w-16 rounded-lg border border-gray-300 px-2 py-1.5 text-sm text-center focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900" />
                  <span className="text-xs text-gray-500">in</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-500 w-14">{t("banner.height")}:</span>
                  <input type="number" min="1" max="50" value={customHFt} onChange={(e) => setCustomHFt(e.target.value)} className="w-16 rounded-lg border border-gray-300 px-2 py-1.5 text-sm text-center focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900" />
                  <span className="text-xs text-gray-500">ft</span>
                  <input type="number" min="0" max="11" value={customHIn} onChange={(e) => setCustomHIn(e.target.value)} className="w-16 rounded-lg border border-gray-300 px-2 py-1.5 text-sm text-center focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900" />
                  <span className="text-xs text-gray-500">in</span>
                </div>
                <p className="text-[11px] text-gray-400">{t("banner.customSizeHint")}</p>
              </div>
            )}
          </Section>

          {/* Material */}
          <Section label={t("mb.material.label")}>
            <div className="grid grid-cols-2 gap-3">
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
                  <span className="text-sm font-semibold">{t(`mb.material.${m.id}`)}</span>
                  <span className={`text-[11px] leading-tight ${materialId === m.id ? "text-gray-300" : "text-gray-400"}`}>
                    {t(`mb.materialDesc.${m.id}`)}
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

          {/* Finishing */}
          <Section label={t("mb.finishing.label")}>
            <div className="flex flex-wrap gap-2">
              {FINISHINGS.map((f) => (
                <Chip key={f.id} active={finishingId === f.id} onClick={() => setFinishingId(f.id)}>
                  {t(`mb.finishing.${f.id}`)}
                  {f.surcharge > 0 && (
                    <span className="ml-1 text-[11px] opacity-70">+{formatCad(f.surcharge)}/ea</span>
                  )}
                </Chip>
              ))}
            </div>
          </Section>

          {/* Turnaround */}
          <Section label={t("banner.turnaround.label")}>
            <div className="grid grid-cols-2 gap-3">
              {TURNAROUNDS.map((ta) => (
                <button
                  key={ta.id}
                  type="button"
                  onClick={() => setTurnaroundId(ta.id)}
                  className={`rounded-xl border-2 p-4 text-left transition-all ${
                    turnaroundId === ta.id
                      ? "border-gray-900 bg-gray-900 text-white shadow-md"
                      : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
                  }`}
                >
                  <span className="text-sm font-semibold">{t(`banner.turnaround.${ta.id}`)}</span>
                  <p className={`mt-0.5 text-[11px] ${turnaroundId === ta.id ? "text-gray-300" : "text-gray-400"}`}>
                    {t(`banner.turnaround.${ta.id}Desc`)}
                  </p>
                  {ta.multiplier > 1 && (
                    <span className={`mt-1 inline-block text-[11px] font-medium ${turnaroundId === ta.id ? "text-amber-300" : "text-amber-600"}`}>
                      +30% surcharge
                    </span>
                  )}
                </button>
              ))}
            </div>
          </Section>

          {/* Quantity */}
          <Section label={t("mb.quantity")}>
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
              <label className="text-xs text-gray-500">{t("mb.customQty")}:</label>
              <input
                type="number" min="1" max="999999"
                value={customQty}
                onChange={(e) => setCustomQty(e.target.value)}
                placeholder="e.g. 15"
                className="w-28 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
              />
            </div>
          </Section>

          {/* File Upload */}
          <Section label={t("mb.artwork")} optional>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <p className="mb-3 text-xs text-gray-600">{t("mb.uploadHint")}</p>
              {uploadedFile ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-800">{uploadedFile.name}</span>
                  <button type="button" onClick={() => setUploadedFile(null)} className="text-xs text-red-500 hover:text-red-700">{t("mb.remove")}</button>
                </div>
              ) : (
                <UploadButton
                  endpoint="artworkUploader"
                  onClientUploadComplete={(res) => {
                    const first = Array.isArray(res) ? res[0] : null;
                    if (!first) return;
                    setUploadedFile({ url: first.ufsUrl || first.url, key: first.key, name: first.name, size: first.size });
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
            <h2 className="text-base font-bold text-gray-900">{t("mb.summary")}</h2>

            <dl className="space-y-2 text-sm">
              <Row label={t("mb.size")} value={size.label} />
              <Row label={t("mb.material.label")} value={t(`mb.material.${materialId}`)} />
              <Row label={t("mb.finishing.label")} value={t(`mb.finishing.${finishingId}`)} />
              <Row label={t("banner.turnaround.label")} value={t(`banner.turnaround.${turnaroundId}`)} />
              <Row label={t("mb.quantity")} value={activeQty > 0 ? activeQty.toLocaleString() : "\u2014"} />
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
                <Row label={t("mb.basePrice")} value={formatCad(subtotalCents)} />
                {materialSurcharge > 0 && (
                  <Row label={t(`mb.material.${materialId}`)} value={`+ ${formatCad(materialSurcharge)}`} />
                )}
                {finishingSurcharge > 0 && (
                  <Row label={t(`mb.finishing.${finishingId}`)} value={`+ ${formatCad(finishingSurcharge)}`} />
                )}
                {turnaroundId === "rush" && (
                  <Row label={t("banner.turnaround.rush")} value={`+ ${formatCad(totalCents - totalBeforeRush)}`} />
                )}
                <div className="flex justify-between border-t border-gray-100 pt-2">
                  <dt className="font-semibold text-gray-900">{t("mb.total")}</dt>
                  <dd className="text-lg font-bold text-gray-900">{formatCad(totalCents)}</dd>
                </div>
                <div className="pt-1">
                  <p className="text-[11px] text-gray-400">
                    {formatCad(Math.round(totalCents / activeQty))}/{t("mb.each")}
                  </p>
                </div>
              </dl>
            ) : (
              <p className="text-xs text-gray-400">{t("mb.selectOptions")}</p>
            )}

            <div className="space-y-3">
              <button type="button" onClick={handleAddToCart} disabled={!canAddToCart}
                className={`w-full rounded-full px-4 py-3 text-sm font-semibold uppercase tracking-[0.15em] transition-all ${canAddToCart ? "bg-gray-900 text-white hover:bg-gray-800" : "cursor-not-allowed bg-gray-200 text-gray-400"}`}>
                {t("mb.addToCart")}
              </button>
              <button type="button" onClick={handleBuyNow} disabled={!canAddToCart || buyNowLoading}
                className={`w-full rounded-full border-2 px-4 py-3 text-sm font-semibold uppercase tracking-[0.15em] transition-all ${canAddToCart && !buyNowLoading ? "border-gray-900 text-gray-900 hover:bg-gray-50" : "cursor-not-allowed border-gray-200 text-gray-400"}`}>
                {buyNowLoading ? t("mb.processing") : t("mb.buyNow")}
              </button>
            </div>

            <div className="flex items-center justify-center gap-4 pt-2 text-[11px] text-gray-400">
              <span>{t("mb.badge.windResistant")}</span>
              <span className="text-gray-300">|</span>
              <span>{t("mb.badge.shipping")}</span>
            </div>
          </div>
        </aside>
      </div>

      {/* ── Product content sections ── */}
      <MeshBannerSections />

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
                  {activeQty.toLocaleString()} × {size.tag || size.label} {t(`mb.material.${materialId}`)}
                  {turnaroundId === "rush" && " \u00b7 RUSH"}
                </p>
              </>
            ) : (
              <p className="text-sm text-gray-400">{t("mb.selectOptions")}</p>
            )}
          </div>
          <button type="button" onClick={handleAddToCart} disabled={!canAddToCart}
            className={`shrink-0 rounded-full px-5 py-2.5 text-xs font-semibold uppercase tracking-wider transition-all ${canAddToCart ? "bg-gray-900 text-white hover:bg-gray-800" : "cursor-not-allowed bg-gray-200 text-gray-400"}`}>
            {t("mb.addToCart")}
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
    <button type="button" onClick={onClick}
      className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${active ? "border-gray-900 bg-gray-900 text-white" : "border-gray-300 bg-white text-gray-700 hover:border-gray-500"}`}>
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
