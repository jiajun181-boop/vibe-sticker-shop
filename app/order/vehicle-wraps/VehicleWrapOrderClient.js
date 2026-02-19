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

// ─── Vehicle Wraps Configuration ───

const TYPES = [
  { id: "full-wrap", icon: "full" },
  { id: "partial-wrap", icon: "partial" },
  { id: "door-panels", icon: "door" },
];

const VEHICLES = [
  { id: "sedan", surcharge: 0, icon: "sedan" },
  { id: "suv", surcharge: 5000, icon: "suv" },
  { id: "truck", surcharge: 7000, icon: "truck" },
  { id: "van", surcharge: 8000, icon: "van" },
];

const MATERIALS = [
  { id: "cast-vinyl", surcharge: 0 },
  { id: "calendered", surcharge: -2000 },
];

const LAMINATIONS = [
  { id: "gloss", surcharge: 0 },
  { id: "matte", surcharge: 0 },
  { id: "satin", surcharge: 0 },
];

const QUANTITIES = [1, 2, 5];

// ─── Icons ───

function TypeIcon({ type, className = "h-8 w-8" }) {
  const common = { className, strokeWidth: 1.5, fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" };
  switch (type) {
    case "full":
      return (
        <svg {...common}>
          <rect x="2" y="8" width="20" height="10" rx="2" />
          <circle cx="6" cy="18" r="2" />
          <circle cx="18" cy="18" r="2" />
          <path strokeLinecap="round" d="M5 8l3-4h8l3 4" />
          <path d="M2 10h20" opacity="0.2" />
        </svg>
      );
    case "partial":
      return (
        <svg {...common}>
          <rect x="2" y="8" width="20" height="10" rx="2" />
          <circle cx="6" cy="18" r="2" />
          <circle cx="18" cy="18" r="2" />
          <path strokeLinecap="round" d="M5 8l3-4h8l3 4" />
          <rect x="4" y="5" width="6" height="5" rx="1" strokeDasharray="2 2" opacity="0.5" />
        </svg>
      );
    case "door":
      return (
        <svg {...common}>
          <rect x="2" y="8" width="20" height="10" rx="2" />
          <circle cx="6" cy="18" r="2" />
          <circle cx="18" cy="18" r="2" />
          <path strokeLinecap="round" d="M5 8l3-4h8l3 4" />
          <rect x="9" y="9" width="6" height="7" rx="1" strokeDasharray="2 2" opacity="0.5" />
        </svg>
      );
    default:
      return null;
  }
}

function VehicleIcon({ type, className = "h-8 w-8" }) {
  const common = { className, strokeWidth: 1.5, fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" };
  switch (type) {
    case "sedan":
      return (
        <svg {...common}>
          <path d="M3 14h18v3a1 1 0 01-1 1H4a1 1 0 01-1-1v-3z" />
          <path d="M5 14l2-5h10l2 5" />
          <circle cx="7" cy="18" r="1.5" />
          <circle cx="17" cy="18" r="1.5" />
        </svg>
      );
    case "suv":
      return (
        <svg {...common}>
          <path d="M2 14h20v3a1 1 0 01-1 1H3a1 1 0 01-1-1v-3z" />
          <path d="M4 14l2-6h12l2 6" />
          <circle cx="6" cy="18" r="1.5" />
          <circle cx="18" cy="18" r="1.5" />
          <path strokeLinecap="round" d="M10 8v6" opacity="0.3" />
        </svg>
      );
    case "truck":
      return (
        <svg {...common}>
          <rect x="1" y="10" width="14" height="7" rx="1" />
          <path d="M15 13h5l2 3v1H15v-4z" />
          <circle cx="5" cy="18" r="1.5" />
          <circle cx="19" cy="18" r="1.5" />
          <path strokeLinecap="round" d="M1 13h14" opacity="0.3" />
        </svg>
      );
    case "van":
      return (
        <svg {...common}>
          <path d="M2 10h15l3 4v3a1 1 0 01-1 1H3a1 1 0 01-1-1V10z" />
          <path d="M2 10l3-4h9l3 4" />
          <circle cx="6" cy="18" r="1.5" />
          <circle cx="17" cy="18" r="1.5" />
          <path strokeLinecap="round" d="M12 6v8" opacity="0.3" />
        </svg>
      );
    default:
      return null;
  }
}

// ─── Main Component ───

export default function VehicleWrapOrderClient() {
  const { t } = useTranslation();
  const { addItem, openCart } = useCartStore();

  const [typeId, setTypeId] = useState("full-wrap");
  const [vehicleId, setVehicleId] = useState("sedan");
  const [materialId, setMaterialId] = useState("cast-vinyl");
  const [laminationId, setLaminationId] = useState("gloss");
  const [quantity, setQuantity] = useState(1);
  const [customQty, setCustomQty] = useState("");
  const [uploadedFile, setUploadedFile] = useState(null);

  const [quoteData, setQuoteData] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState(null);
  const [buyNowLoading, setBuyNowLoading] = useState(false);

  const debounceRef = useRef(null);
  const abortRef = useRef(null);

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
        slug: "vehicle-wraps",
        quantity: activeQty,
        widthIn: 0,
        heightIn: 0,
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
  }, [activeQty]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(fetchQuote, DEBOUNCE_MS);
    return () => clearTimeout(debounceRef.current);
  }, [fetchQuote]);

  // ─── Pricing ───

  const subtotalCents = quoteData?.totalCents ?? 0;
  const vehicleSurcharge = (VEHICLES.find((v) => v.id === vehicleId)?.surcharge ?? 0) * activeQty;
  const materialSurcharge = (MATERIALS.find((m) => m.id === materialId)?.surcharge ?? 0) * activeQty;
  const adjustedSubtotal = subtotalCents + vehicleSurcharge + materialSurcharge;
  const totalCents = adjustedSubtotal;

  const canAddToCart = quoteData && !quoteLoading && activeQty > 0;

  // ─── Cart ───

  function buildCartItem() {
    if (!quoteData || activeQty <= 0) return null;

    const nameParts = [
      t(`vw.type.${typeId}`),
      t(`vw.vehicle.${vehicleId}`),
    ];

    return {
      id: "vehicle-wraps",
      name: nameParts.join(" \u2014 "),
      slug: "vehicle-wraps",
      price: Math.round(adjustedSubtotal / activeQty),
      quantity: activeQty,
      options: {
        type: typeId,
        vehicle: vehicleId,
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
    showSuccessToast(t("vw.addedToCart"));
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
          { label: t("vw.breadcrumb"), href: "/shop/vehicle-wraps" },
          { label: t("vw.order") },
        ]}
      />

      <h1 className="mb-8 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
        {t("vw.title")}
      </h1>

      <div className="lg:grid lg:grid-cols-5 lg:gap-10">
        {/* ── LEFT: Options ── */}
        <div className="space-y-8 lg:col-span-3">

          {/* Type */}
          <Section label={t("vw.type.label")}>
            <div className="grid grid-cols-3 gap-3">
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
                  <span className="text-sm font-semibold">{t(`vw.type.${tp.id}`)}</span>
                  <span className={`text-[11px] leading-tight ${typeId === tp.id ? "text-gray-300" : "text-gray-400"}`}>
                    {t(`vw.typeDesc.${tp.id}`)}
                  </span>
                </button>
              ))}
            </div>
          </Section>

          {/* Vehicle */}
          <Section label={t("vw.vehicle.label")}>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {VEHICLES.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setVehicleId(v.id)}
                  className={`group flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-center transition-all ${
                    vehicleId === v.id
                      ? "border-gray-900 bg-gray-900 text-white shadow-md"
                      : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
                  }`}
                >
                  <VehicleIcon type={v.icon} className="h-8 w-8" />
                  <span className="text-sm font-semibold">{t(`vw.vehicle.${v.id}`)}</span>
                  {v.surcharge > 0 && (
                    <span className={`text-[11px] font-medium ${vehicleId === v.id ? "text-amber-300" : "text-amber-600"}`}>
                      +{formatCad(v.surcharge)}/ea
                    </span>
                  )}
                </button>
              ))}
            </div>
          </Section>

          {/* Material */}
          <Section label={t("vw.material.label")}>
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
                  <span className="text-sm font-semibold">{t(`vw.material.${m.id}`)}</span>
                  <span className={`text-[11px] leading-tight ${materialId === m.id ? "text-gray-300" : "text-gray-400"}`}>
                    {t(`vw.materialDesc.${m.id}`)}
                  </span>
                  {m.surcharge < 0 && (
                    <span className={`text-[11px] font-medium ${materialId === m.id ? "text-green-300" : "text-green-600"}`}>
                      {formatCad(m.surcharge)}/ea
                    </span>
                  )}
                </button>
              ))}
            </div>
          </Section>

          {/* Lamination */}
          <Section label={t("vw.lamination.label")}>
            <div className="flex flex-wrap gap-2">
              {LAMINATIONS.map((l) => (
                <Chip key={l.id} active={laminationId === l.id} onClick={() => setLaminationId(l.id)}>
                  {t(`vw.lamination.${l.id}`)}
                </Chip>
              ))}
            </div>
          </Section>

          {/* Quantity */}
          <Section label={t("vw.quantity")}>
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
              <label className="text-xs text-gray-500">{t("vw.customQty")}:</label>
              <input
                type="number"
                min="1"
                max="999999"
                value={customQty}
                onChange={(e) => setCustomQty(e.target.value)}
                placeholder="e.g. 3"
                className="w-28 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
              />
            </div>
          </Section>

          {/* File Upload */}
          <Section label={t("vw.artwork")} optional>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <p className="mb-3 text-xs text-gray-600">{t("vw.uploadHint")}</p>
              {uploadedFile ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-800">{uploadedFile.name}</span>
                  <button
                    type="button"
                    onClick={() => setUploadedFile(null)}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    {t("vw.remove")}
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
            <h2 className="text-base font-bold text-gray-900">{t("vw.summary")}</h2>

            <dl className="space-y-2 text-sm">
              <Row label={t("vw.type.label")} value={t(`vw.type.${typeId}`)} />
              <Row label={t("vw.vehicle.label")} value={t(`vw.vehicle.${vehicleId}`)} />
              <Row label={t("vw.material.label")} value={t(`vw.material.${materialId}`)} />
              <Row label={t("vw.lamination.label")} value={t(`vw.lamination.${laminationId}`)} />
              <Row label={t("vw.quantity")} value={activeQty > 0 ? activeQty.toLocaleString() : "\u2014"} />
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
                <Row label={t("vw.basePrice")} value={formatCad(subtotalCents)} />
                {vehicleSurcharge > 0 && (
                  <Row label={t(`vw.vehicle.${vehicleId}`)} value={`+ ${formatCad(vehicleSurcharge)}`} />
                )}
                {materialSurcharge < 0 && (
                  <Row label={t(`vw.material.${materialId}`)} value={`\u2212 ${formatCad(Math.abs(materialSurcharge))}`} />
                )}
                <Row label={t("vw.subtotal")} value={formatCad(adjustedSubtotal)} />
                <div className="flex justify-between border-t border-gray-100 pt-2">
                  <dt className="font-semibold text-gray-900">{t("vw.total")}</dt>
                  <dd className="text-lg font-bold text-gray-900">{formatCad(totalCents)}</dd>
                </div>
                {activeQty > 1 && (
                  <div className="pt-1">
                    <p className="text-[11px] text-gray-400">
                      {formatCad(Math.round(adjustedSubtotal / activeQty))}/{t("vw.each")}
                    </p>
                  </div>
                )}
              </dl>
            ) : (
              <p className="text-xs text-gray-400">{t("vw.selectOptions")}</p>
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
                {t("vw.addToCart")}
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
                {buyNowLoading ? t("vw.processing") : t("vw.buyNow")}
              </button>
            </div>

            <div className="flex items-center justify-center gap-4 pt-2 text-[11px] text-gray-400">
              <span>{t("vw.badge.professional")}</span>
              <span className="text-gray-300">|</span>
              <span>{t("vw.badge.shipping")}</span>
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
                  {activeQty.toLocaleString()} × {t(`vw.type.${typeId}`)} {t(`vw.vehicle.${vehicleId}`)}
                </p>
              </>
            ) : (
              <p className="text-sm text-gray-400">{t("vw.selectOptions")}</p>
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
            {t("vw.addToCart")}
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
