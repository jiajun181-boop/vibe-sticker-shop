"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useCartStore } from "@/lib/store";
import { showErrorToast, showSuccessToast } from "@/components/Toast";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { UploadButton } from "@/utils/uploadthing";
import Breadcrumbs from "@/components/Breadcrumbs";
import { ProofPreview } from "@/components/configurator";

const DEBOUNCE_MS = 300;

const formatCad = (cents) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);

// ─── Foam Board Configuration ───

const SIZES = [
  { id: "8.5x11", label: '8.5" × 11"', tag: "Letter", w: 8.5, h: 11 },
  { id: "11x17", label: '11" × 17"', tag: "Tabloid", w: 11, h: 17 },
  { id: "18x24", label: '18" × 24"', tag: "Small", w: 18, h: 24 },
  { id: "24x36", label: '24" × 36"', tag: "Medium", w: 24, h: 36 },
  { id: "36x48", label: '36" × 48"', tag: "Large", w: 36, h: 48 },
];

const THICKNESSES = [
  { id: "3mm", surcharge: 0 },
  { id: "5mm", surcharge: 50 },
  { id: "10mm", surcharge: 150 },
];

const SIDES = [
  { id: "single", surcharge: 0 },
  { id: "double", surcharge: 0 },
];

const MOUNTINGS = [
  { id: "none", surcharge: 0 },
  { id: "easel-back", surcharge: 200 },
  { id: "adhesive-velcro", surcharge: 100 },
];

const QUANTITIES = [1, 5, 10, 25, 50];

// ─── Icons ───

function ThicknessIcon({ type, className = "h-7 w-7" }) {
  const common = { className, strokeWidth: 1.5, fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" };
  switch (type) {
    case "3mm":
      return (
        <svg {...common}>
          <rect x="4" y="6" width="16" height="12" rx="1" />
          <path strokeLinecap="round" d="M8 10h8M8 14h6" opacity="0.4" />
        </svg>
      );
    case "5mm":
      return (
        <svg {...common}>
          <rect x="4" y="5" width="16" height="14" rx="1" />
          <path strokeLinecap="round" d="M8 9h8M8 13h8M8 17h4" />
          <path d="M4 5h16v3H4z" opacity="0.15" fill="currentColor" />
        </svg>
      );
    case "10mm":
      return (
        <svg {...common}>
          <rect x="3" y="3" width="18" height="18" rx="1" strokeWidth="2" />
          <path strokeLinecap="round" d="M7 8h10M7 12h10M7 16h6" />
          <path d="M3 3h18v4H3z" opacity="0.2" fill="currentColor" />
        </svg>
      );
    default:
      return null;
  }
}

// ─── Main Component ───

export default function FoamBoardOrderClient() {
  const { t } = useTranslation();
  const { addItem, openCart } = useCartStore();

  const [sizeIdx, setSizeIdx] = useState(2); // 18×24 Small default
  const [thicknessId, setThicknessId] = useState("3mm");
  const [sidesId, setSidesId] = useState("single");
  const [mountingId, setMountingId] = useState("none");
  const [quantity, setQuantity] = useState(10);
  const [customQty, setCustomQty] = useState("");
  const [uploadedFile, setUploadedFile] = useState(null);
  const [proofConfirmed, setProofConfirmed] = useState(false);
  const [contourData, setContourData] = useState(null);

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
        slug: "foam-board-signs",
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
  const thicknessSurcharge = (THICKNESSES.find((th) => th.id === thicknessId)?.surcharge ?? 0) * activeQty;
  const mountingSurcharge = (MOUNTINGS.find((m) => m.id === mountingId)?.surcharge ?? 0) * activeQty;
  const adjustedSubtotal = subtotalCents + thicknessSurcharge + mountingSurcharge;
  const totalCents = adjustedSubtotal;

  const requiresProof = uploadedFile != null;
  const canAddToCart = quoteData && !quoteLoading && activeQty > 0 && (!requiresProof || proofConfirmed);

  // ─── Cart ───

  function buildCartItem() {
    if (!quoteData || activeQty <= 0) return null;

    const nameParts = [
      t("fb.title"),
      size.tag,
      t(`fb.sides.${sidesId}`),
    ];

    return {
      id: "foam-board-signs",
      name: nameParts.join(" — "),
      slug: "foam-board-signs",
      price: Math.round(adjustedSubtotal / activeQty),
      quantity: activeQty,
      options: {
        sizeId: size.id,
        sizeLabel: size.label,
        width: size.w,
        height: size.h,
        thickness: thicknessId,
        sides: sidesId,
        mounting: mountingId,
        fileName: uploadedFile?.name || null,
        proofConfirmed: proofConfirmed || false,
        contourSvg: contourData?.contourSvg || null,
        bleedMm: contourData?.bleedMm || null,
        processedImageUrl: contourData?.processedImageUrl || null,
      },
      forceNewLine: true,
    };
  }

  function handleAddToCart() {
    const item = buildCartItem();
    if (!item) return;
    addItem(item);
    openCart();
    showSuccessToast(t("fb.addedToCart"));
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
          { label: t("fb.breadcrumb"), href: "/shop/signs-banners/foam-board-signs" },
          { label: t("fb.order") },
        ]}
      />

      <h1 className="mb-8 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
        {t("fb.title")}
      </h1>

      <div className="lg:grid lg:grid-cols-5 lg:gap-10">
        {/* ── LEFT: Options ── */}
        <div className="space-y-8 lg:col-span-3">

          {/* Size */}
          <Section label={t("fb.size")}>
            <div className="flex flex-wrap gap-2">
              {SIZES.map((s, i) => (
                <Chip key={s.id} active={sizeIdx === i} onClick={() => setSizeIdx(i)}>
                  {s.label} ({s.tag})
                </Chip>
              ))}
            </div>
          </Section>

          {/* Thickness */}
          <Section label={t("fb.thickness.label")}>
            <div className="grid grid-cols-3 gap-3">
              {THICKNESSES.map((th) => (
                <button
                  key={th.id}
                  type="button"
                  onClick={() => setThicknessId(th.id)}
                  className={`group flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-center transition-all ${
                    thicknessId === th.id
                      ? "border-gray-900 bg-gray-900 text-white shadow-md"
                      : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
                  }`}
                >
                  <ThicknessIcon type={th.id} className="h-7 w-7" />
                  <span className="text-sm font-semibold">{t(`fb.thickness.${th.id}`)}</span>
                  <span className={`text-[11px] leading-tight ${thicknessId === th.id ? "text-gray-300" : "text-gray-400"}`}>
                    {t(`fb.thicknessDesc.${th.id}`)}
                  </span>
                  {th.surcharge > 0 && (
                    <span className={`text-[11px] font-medium ${thicknessId === th.id ? "text-amber-300" : "text-amber-600"}`}>
                      +{formatCad(th.surcharge)}/ea
                    </span>
                  )}
                </button>
              ))}
            </div>
          </Section>

          {/* Sides */}
          <Section label={t("fb.sides.label")}>
            <div className="flex flex-wrap gap-2">
              {SIDES.map((s) => (
                <Chip key={s.id} active={sidesId === s.id} onClick={() => setSidesId(s.id)}>
                  {t(`fb.sides.${s.id}`)}
                </Chip>
              ))}
            </div>
          </Section>

          {/* Mounting */}
          <Section label={t("fb.mounting.label")}>
            <div className="flex flex-wrap gap-2">
              {MOUNTINGS.map((m) => (
                <Chip key={m.id} active={mountingId === m.id} onClick={() => setMountingId(m.id)}>
                  {t(`fb.mounting.${m.id}`)}
                  {m.surcharge > 0 && (
                    <span className="ml-1 text-[11px] opacity-70">+{formatCad(m.surcharge)}/ea</span>
                  )}
                </Chip>
              ))}
            </div>
          </Section>

          {/* Quantity */}
          <Section label={t("fb.quantity")}>
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
              <label className="text-xs text-gray-500">{t("fb.customQty")}:</label>
              <input
                type="number"
                min="1"
                max="999999"
                value={customQty}
                onChange={(e) => setCustomQty(e.target.value)}
                placeholder="e.g. 30"
                className="w-28 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
              />
            </div>
          </Section>

          {/* File Upload */}
          <Section label={t("fb.artwork")} optional>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <p className="mb-3 text-xs text-gray-600">{t("fb.uploadHint")}</p>
              {uploadedFile ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-800">{uploadedFile.name}</span>
                  <button
                    type="button"
                    onClick={() => { setUploadedFile(null); setProofConfirmed(false); setContourData(null); }}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    {t("fb.remove")}
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
                    setProofConfirmed(false);
                    setContourData(null);
                  }}
                  onUploadError={(err) => showErrorToast(err?.message || "Upload failed")}
                />
              )}
            </div>
          </Section>

          {/* Proof Preview */}
          {uploadedFile && (
            <ProofPreview
              uploadedFile={uploadedFile}
              widthIn={size.w}
              heightIn={size.h}
              cuttingId="die-cut"
              materialId={thicknessId}
              onConfirmProof={(data) => {
                setContourData(data);
                setProofConfirmed(true);
              }}
              onRejectProof={() => {
                setUploadedFile(null);
                setProofConfirmed(false);
                setContourData(null);
              }}
              t={t}
            />
          )}
        </div>

        {/* ── RIGHT: Summary ── */}
        <aside className="hidden lg:col-span-2 lg:block">
          <div className="sticky top-24 space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-bold text-gray-900">{t("fb.summary")}</h2>

            <dl className="space-y-2 text-sm">
              <Row label={t("fb.size")} value={`${size.label} (${size.tag})`} />
              <Row label={t("fb.thickness.label")} value={t(`fb.thickness.${thicknessId}`)} />
              <Row label={t("fb.sides.label")} value={t(`fb.sides.${sidesId}`)} />
              {mountingId !== "none" && (
                <Row label={t("fb.mounting.label")} value={t(`fb.mounting.${mountingId}`)} />
              )}
              <Row label={t("fb.quantity")} value={activeQty > 0 ? activeQty.toLocaleString() : "\u2014"} />
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
                <Row label={t("fb.basePrice")} value={formatCad(subtotalCents)} />
                {thicknessSurcharge > 0 && (
                  <Row label={t(`fb.thickness.${thicknessId}`)} value={`+ ${formatCad(thicknessSurcharge)}`} />
                )}
                {mountingSurcharge > 0 && (
                  <Row label={t(`fb.mounting.${mountingId}`)} value={`+ ${formatCad(mountingSurcharge)}`} />
                )}
                <Row label={t("fb.subtotal")} value={formatCad(adjustedSubtotal)} />
                <div className="flex justify-between border-t border-gray-100 pt-2">
                  <dt className="font-semibold text-gray-900">{t("fb.total")}</dt>
                  <dd className="text-lg font-bold text-gray-900">{formatCad(totalCents)}</dd>
                </div>
                <div className="pt-1">
                  <p className="text-[11px] text-gray-400">
                    {formatCad(Math.round(adjustedSubtotal / activeQty))}/{t("fb.each")}
                  </p>
                </div>
              </dl>
            ) : (
              <p className="text-xs text-gray-400">{t("fb.selectOptions")}</p>
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
                {t("fb.addToCart")}
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
                {buyNowLoading ? t("fb.processing") : t("fb.buyNow")}
              </button>
            </div>

            <div className="flex items-center justify-center gap-4 pt-2 text-[11px] text-gray-400">
              <span>{t("fb.badge.lightweight")}</span>
              <span className="text-gray-300">|</span>
              <span>{t("fb.badge.shipping")}</span>
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
                  {activeQty.toLocaleString()} × {size.tag} {t(`fb.sides.${sidesId}`)}
                </p>
              </>
            ) : (
              <p className="text-sm text-gray-400">{t("fb.selectOptions")}</p>
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
            {t("fb.addToCart")}
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
