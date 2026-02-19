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

// ─── Wall & Floor Graphics Configuration ───

const TYPES = [
  { id: "wall-graphic", icon: "wall" },
  { id: "floor-graphic", icon: "floor" },
];

const SIZES = [
  { id: "24x36", label: "2' \u00d7 3'", tag: "2\u00d73", w: 24, h: 36 },
  { id: "36x48", label: "3' \u00d7 4'", tag: "3\u00d74", w: 36, h: 48 },
  { id: "48x72", label: "4' \u00d7 6'", tag: "4\u00d76", w: 48, h: 72 },
  { id: "48x96", label: "4' \u00d7 8'", tag: "4\u00d78", w: 48, h: 96 },
  { id: "60x96", label: "5' \u00d7 8'", tag: "5\u00d78", w: 60, h: 96 },
];

const MATERIALS = [
  { id: "vinyl-adhesive", surcharge: 0 },
  { id: "fabric-peel-stick", surcharge: 200, wallOnly: true },
  { id: "textured-vinyl", surcharge: 150 },
];

const LAMINATIONS = [
  { id: "none", surcharge: 0, wallOnly: true },
  { id: "anti-slip", surcharge: 300 },
  { id: "gloss-lam", surcharge: 100 },
];

const QUANTITIES = [1, 2, 5, 10, 25];

// ─── Icons ───

function TypeIcon({ type, className = "h-8 w-8" }) {
  const common = { className, strokeWidth: 1.5, fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" };
  switch (type) {
    case "wall":
      return (
        <svg {...common}>
          <rect x="2" y="4" width="20" height="16" rx="1" />
          <path strokeLinecap="round" d="M6 4V2M12 4V2M18 4V2" />
          <rect x="5" y="7" width="14" height="10" rx="1" strokeDasharray="3 2" />
          <path d="M9 11l3 3 3-3" opacity="0.3" fill="currentColor" />
        </svg>
      );
    case "floor":
      return (
        <svg {...common}>
          <path d="M2 18l10-6 10 6" />
          <path d="M2 18l10 4 10-4" opacity="0.2" fill="currentColor" />
          <rect x="7" y="10" width="10" height="6" rx="1" strokeDasharray="3 2" />
          <path strokeLinecap="round" d="M10 14h4" opacity="0.5" />
        </svg>
      );
    default:
      return null;
  }
}

// ─── Main Component ───

export default function WallFloorGraphicOrderClient() {
  const { t } = useTranslation();
  const { addItem, openCart } = useCartStore();

  const [typeId, setTypeId] = useState("wall-graphic");
  const [sizeIdx, setSizeIdx] = useState(2); // 4'×6' default
  const [materialId, setMaterialId] = useState("vinyl-adhesive");
  const [laminationId, setLaminationId] = useState("none");
  const [quantity, setQuantity] = useState(1);
  const [customQty, setCustomQty] = useState("");
  const [uploadedFile, setUploadedFile] = useState(null);

  const [quoteData, setQuoteData] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState(null);
  const [buyNowLoading, setBuyNowLoading] = useState(false);

  const debounceRef = useRef(null);
  const abortRef = useRef(null);

  const size = SIZES[sizeIdx];
  const isFloor = typeId === "floor-graphic";

  const activeQty = useMemo(() => {
    if (customQty !== "") {
      const n = parseInt(customQty, 10);
      return n > 0 ? n : 0;
    }
    return quantity;
  }, [quantity, customQty]);

  // Floor type: force anti-slip lamination and reset material if fabric
  useEffect(() => {
    if (isFloor) {
      setLaminationId("anti-slip");
      if (materialId === "fabric-peel-stick") setMaterialId("vinyl-adhesive");
    }
  }, [isFloor, materialId]);

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
        slug: "wall-floor-graphics",
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
  const laminationSurcharge = (LAMINATIONS.find((l) => l.id === laminationId)?.surcharge ?? 0) * activeQty;
  const adjustedSubtotal = subtotalCents + materialSurcharge + laminationSurcharge;
  const totalCents = adjustedSubtotal;

  const canAddToCart = quoteData && !quoteLoading && activeQty > 0;

  // ─── Cart ───

  function buildCartItem() {
    if (!quoteData || activeQty <= 0) return null;

    const nameParts = [
      t(`wg.type.${typeId}`),
      size.tag,
    ];

    return {
      id: "wall-floor-graphics",
      name: nameParts.join(" \u2014 "),
      slug: "wall-floor-graphics",
      price: Math.round(adjustedSubtotal / activeQty),
      quantity: activeQty,
      options: {
        type: typeId,
        sizeId: size.id,
        sizeLabel: size.label,
        width: size.w,
        height: size.h,
        material: materialId,
        lamination: laminationId,
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
    showSuccessToast(t("wg.addedToCart"));
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

  // Filtered options based on type
  const visibleMaterials = MATERIALS.filter((m) => !isFloor || !m.wallOnly);
  const visibleLaminations = LAMINATIONS.filter((l) => !isFloor || !l.wallOnly);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumbs
        items={[
          { label: t("nav.shop"), href: "/shop" },
          { label: t("wg.breadcrumb"), href: "/shop/wall-floor-graphics" },
          { label: t("wg.order") },
        ]}
      />

      <h1 className="mb-8 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
        {t("wg.title")}
      </h1>

      <div className="lg:grid lg:grid-cols-5 lg:gap-10">
        {/* ── LEFT: Options ── */}
        <div className="space-y-8 lg:col-span-3">

          {/* Type */}
          <Section label={t("wg.type.label")}>
            <div className="grid grid-cols-2 gap-3">
              {TYPES.map((tp) => (
                <button
                  key={tp.id}
                  type="button"
                  onClick={() => setTypeId(tp.id)}
                  className={`group flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-center transition-all ${
                    typeId === tp.id
                      ? "border-gray-900 bg-gray-900 text-white shadow-md"
                      : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
                  }`}
                >
                  <TypeIcon type={tp.icon} className="h-8 w-8" />
                  <span className="text-sm font-semibold">{t(`wg.type.${tp.id}`)}</span>
                  <span className={`text-[11px] leading-tight ${typeId === tp.id ? "text-gray-300" : "text-gray-400"}`}>
                    {t(`wg.typeDesc.${tp.id}`)}
                  </span>
                </button>
              ))}
            </div>
          </Section>

          {/* Size */}
          <Section label={t("wg.size")}>
            <div className="flex flex-wrap gap-2">
              {SIZES.map((s, i) => (
                <Chip key={s.id} active={sizeIdx === i} onClick={() => setSizeIdx(i)}>
                  {s.label}
                </Chip>
              ))}
            </div>
          </Section>

          {/* Material */}
          <Section label={t("wg.material.label")}>
            <div className={`grid gap-3 ${visibleMaterials.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
              {visibleMaterials.map((m) => (
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
                  <span className="text-sm font-semibold">{t(`wg.material.${m.id}`)}</span>
                  <span className={`text-[11px] leading-tight ${materialId === m.id ? "text-gray-300" : "text-gray-400"}`}>
                    {t(`wg.materialDesc.${m.id}`)}
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

          {/* Lamination */}
          <Section label={t("wg.lamination.label")}>
            <div className="flex flex-wrap gap-2">
              {visibleLaminations.map((l) => (
                <Chip key={l.id} active={laminationId === l.id} onClick={() => setLaminationId(l.id)}>
                  {t(`wg.lamination.${l.id}`)}
                  {l.surcharge > 0 && (
                    <span className="ml-1 text-[11px] opacity-70">+{formatCad(l.surcharge)}/ea</span>
                  )}
                </Chip>
              ))}
            </div>
            {isFloor && <p className="mt-2 text-[11px] text-gray-400">{t("wg.floorLamHint")}</p>}
          </Section>

          {/* Quantity */}
          <Section label={t("wg.quantity")}>
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
              <label className="text-xs text-gray-500">{t("wg.customQty")}:</label>
              <input
                type="number"
                min="1"
                max="999999"
                value={customQty}
                onChange={(e) => setCustomQty(e.target.value)}
                placeholder="e.g. 15"
                className="w-28 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
              />
            </div>
          </Section>

          {/* File Upload */}
          <Section label={t("wg.artwork")} optional>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <p className="mb-3 text-xs text-gray-600">{t("wg.uploadHint")}</p>
              {uploadedFile ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-800">{uploadedFile.name}</span>
                  <button
                    type="button"
                    onClick={() => setUploadedFile(null)}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    {t("wg.remove")}
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
            <h2 className="text-base font-bold text-gray-900">{t("wg.summary")}</h2>

            <dl className="space-y-2 text-sm">
              <Row label={t("wg.type.label")} value={t(`wg.type.${typeId}`)} />
              <Row label={t("wg.size")} value={size.label} />
              <Row label={t("wg.material.label")} value={t(`wg.material.${materialId}`)} />
              <Row label={t("wg.lamination.label")} value={t(`wg.lamination.${laminationId}`)} />
              <Row label={t("wg.quantity")} value={activeQty > 0 ? activeQty.toLocaleString() : "\u2014"} />
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
                <Row label={t("wg.basePrice")} value={formatCad(subtotalCents)} />
                {materialSurcharge > 0 && (
                  <Row label={t(`wg.material.${materialId}`)} value={`+ ${formatCad(materialSurcharge)}`} />
                )}
                {laminationSurcharge > 0 && (
                  <Row label={t(`wg.lamination.${laminationId}`)} value={`+ ${formatCad(laminationSurcharge)}`} />
                )}
                <Row label={t("wg.subtotal")} value={formatCad(adjustedSubtotal)} />
                <div className="flex justify-between border-t border-gray-100 pt-2">
                  <dt className="font-semibold text-gray-900">{t("wg.total")}</dt>
                  <dd className="text-lg font-bold text-gray-900">{formatCad(totalCents)}</dd>
                </div>
                {activeQty > 1 && (
                  <div className="pt-1">
                    <p className="text-[11px] text-gray-400">
                      {formatCad(Math.round(adjustedSubtotal / activeQty))}/{t("wg.each")}
                    </p>
                  </div>
                )}
              </dl>
            ) : (
              <p className="text-xs text-gray-400">{t("wg.selectOptions")}</p>
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
                {t("wg.addToCart")}
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
                {buyNowLoading ? t("wg.processing") : t("wg.buyNow")}
              </button>
            </div>

            <div className="flex items-center justify-center gap-4 pt-2 text-[11px] text-gray-400">
              <span>{t("wg.badge.custom")}</span>
              <span className="text-gray-300">|</span>
              <span>{t("wg.badge.shipping")}</span>
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
                  {activeQty.toLocaleString()} × {t(`wg.type.${typeId}`)} {size.tag}
                </p>
              </>
            ) : (
              <p className="text-sm text-gray-400">{t("wg.selectOptions")}</p>
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
            {t("wg.addToCart")}
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
