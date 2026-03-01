"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useCartStore } from "@/lib/store";
import { showErrorToast, showSuccessToast } from "@/components/Toast";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { UploadButton } from "@/utils/uploadthing";
import Breadcrumbs from "@/components/Breadcrumbs";
import ImageGallery from "@/components/product/ImageGallery";
import FaqAccordion from "@/components/sticker-product/FaqAccordion";
import { getConfiguratorFaqs } from "@/lib/configurator-faqs";

const DEBOUNCE_MS = 300;

const formatCad = (cents) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);

// ─── A-Frame Sign Configuration ───

const SIZES = [
  { id: "24x36", label: '24" × 36"', tag: "Standard", w: 24, h: 36 },
  { id: "24x48", label: '24" × 48"', tag: "Tall", w: 24, h: 48 },
];

const MATERIALS = [
  { id: "corrugated-inserts", surcharge: 0 },
  { id: "aluminum-inserts", surcharge: 500 },   // +$5.00/ea
  { id: "pvc-inserts", surcharge: 300 },         // +$3.00/ea
];

const SIDES = [
  { id: "single", surcharge: 0 },
  { id: "double", surcharge: 0 },
];

const FRAMES = [
  { id: "included", surcharge: 0 },
  { id: "metal-frame", surcharge: 2000 },        // +$20.00/ea
];

const QUANTITIES = [1, 2, 5, 10, 25];

// ─── Main Component ───

export default function AFrameSignOrderClient({ productImages = [] }) {
  const { t } = useTranslation();
  const { addItem, openCart } = useCartStore();

  const [sizeIdx, setSizeIdx] = useState(0); // 24x36 default
  const [material, setMaterial] = useState("corrugated-inserts");
  const [sides, setSides] = useState("single");
  const [frame, setFrame] = useState("included");
  const [quantity, setQuantity] = useState(1);
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
        slug: "a-frame-signs",
        quantity: activeQty,
        widthIn: size.w,
        heightIn: size.h,
        material,
        options: { doubleSided: sides === "double" },
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
  }, [size.w, size.h, activeQty, sides, material]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(fetchQuote, DEBOUNCE_MS);
    return () => clearTimeout(debounceRef.current);
  }, [fetchQuote]);

  // ─── Pricing ───

  const subtotalCents = quoteData?.totalCents ?? 0;
  const materialSurcharge = (MATERIALS.find((m) => m.id === material)?.surcharge ?? 0) * activeQty;
  const frameSurcharge = (FRAMES.find((f) => f.id === frame)?.surcharge ?? 0) * activeQty;

  const adjustedSubtotal = subtotalCents + materialSurcharge + frameSurcharge;
  const totalCents = adjustedSubtotal;

  const canAddToCart = quoteData && !quoteLoading && activeQty > 0;

  // ─── Cart ───

  function buildCartItem() {
    if (!quoteData || activeQty <= 0) return null;
    return {
      id: "a-frame-signs",
      name: `${t("af.title")} — ${size.label}`,
      slug: "a-frame-signs",
      price: Math.round(adjustedSubtotal / activeQty),
      quantity: activeQty,
      options: {
        sizeId: size.id,
        sizeLabel: size.label,
        width: size.w,
        height: size.h,
        material,
        sides,
        frame,
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
    showSuccessToast(t("af.addedToCart"));
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
          { label: t("af.breadcrumb"), href: "/shop/signs-rigid-boards" },
          { label: t("af.order") },
        ]}
      />

      <h1 className="mb-8 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
        {t("af.title")}
      </h1>

      <div className="lg:grid lg:grid-cols-5 lg:gap-10">
        {/* ── LEFT: Options ── */}
        <div className="space-y-8 lg:col-span-3">
          {/* Product Images */}
          {productImages.length > 0 && (
            <div className="mb-2">
              <ImageGallery images={productImages} productName={t("af.title")} />
            </div>
          )}

          {/* Size */}
          <Section label={t("af.size")}>
            <div className="flex flex-wrap gap-2">
              {SIZES.map((s, i) => (
                <Chip key={s.id} active={sizeIdx === i} onClick={() => setSizeIdx(i)}>
                  {s.label} <span className="ml-1 text-[11px] opacity-70">({s.tag})</span>
                </Chip>
              ))}
            </div>
          </Section>

          {/* Material */}
          <Section label={t("af.material")}>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {MATERIALS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMaterial(m.id)}
                  className={`relative rounded-xl border-2 px-3 py-3 text-left transition-all ${
                    material === m.id
                      ? "border-gray-900 bg-gray-50 shadow-sm"
                      : "border-gray-200 bg-white hover:border-gray-400"
                  }`}
                >
                  <span className="block text-sm font-medium text-gray-800">{t(`af.material.${m.id}`)}</span>
                  <span className={`mt-0.5 block text-[11px] leading-tight ${material === m.id ? "text-gray-500" : "text-gray-400"}`}>
                    {t(`af.materialDesc.${m.id}`)}
                  </span>
                  {m.surcharge > 0 && (
                    <span className="mt-1 block text-[11px] font-medium text-amber-600">+{formatCad(m.surcharge)}/ea</span>
                  )}
                  {material === m.id && (
                    <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-gray-900" />
                  )}
                </button>
              ))}
            </div>
          </Section>

          {/* Sides */}
          <Section label={t("af.sides")}>
            <div className="flex flex-wrap gap-2">
              {SIDES.map((s) => (
                <Chip key={s.id} active={sides === s.id} onClick={() => setSides(s.id)}>
                  {t(`af.sides.${s.id}`)}
                </Chip>
              ))}
            </div>
          </Section>

          {/* Frame */}
          <Section label={t("af.frame")}>
            <div className="flex flex-wrap gap-2">
              {FRAMES.map((f) => (
                <Chip key={f.id} active={frame === f.id} onClick={() => setFrame(f.id)}>
                  {t(`af.frame.${f.id}`)}
                  {f.surcharge > 0 && <span className="ml-1 text-[11px] opacity-70">+{formatCad(f.surcharge)}/ea</span>}
                </Chip>
              ))}
            </div>
          </Section>

          {/* Quantity */}
          <Section label={t("af.quantity")}>
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
              <label className="text-xs text-gray-500">{t("af.customQty")}:</label>
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

          {/* Upload */}
          <Section label={t("af.artwork")} optional>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <p className="mb-3 text-xs text-gray-600">{t("af.uploadHint")}</p>
              {uploadedFile ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-800">{uploadedFile.name}</span>
                  <button
                    type="button"
                    onClick={() => setUploadedFile(null)}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    {t("af.remove")}
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
            <h2 className="text-base font-bold text-gray-900">{t("af.summary")}</h2>

            <dl className="space-y-2 text-sm">
              <Row label={t("af.size")} value={`${size.label} (${size.tag})`} />
              <Row label={t("af.material")} value={t(`af.material.${material}`)} />
              <Row label={t("af.sides")} value={t(`af.sides.${sides}`)} />
              <Row label={t("af.frame")} value={t(`af.frame.${frame}`)} />
              <Row label={t("af.quantity")} value={activeQty > 0 ? activeQty.toLocaleString() : "\u2014"} />
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
                <Row label={t("af.basePrice")} value={formatCad(subtotalCents)} />
                {materialSurcharge > 0 && <Row label={t(`af.material.${material}`)} value={`+ ${formatCad(materialSurcharge)}`} />}
                {frameSurcharge > 0 && <Row label={t(`af.frame.${frame}`)} value={`+ ${formatCad(frameSurcharge)}`} />}
                <Row label={t("af.subtotal")} value={formatCad(adjustedSubtotal)} />
                <div className="flex justify-between border-t border-gray-100 pt-2">
                  <dt className="font-semibold text-gray-900">{t("af.total")}</dt>
                  <dd className="text-lg font-bold text-gray-900">{formatCad(totalCents)}</dd>
                </div>
                <div className="pt-1">
                  <p className="text-[11px] text-gray-400">
                    {formatCad(Math.round(adjustedSubtotal / activeQty))}/{t("af.each")}
                  </p>
                </div>
              </dl>
            ) : (
              <p className="text-xs text-gray-400">{t("af.selectOptions")}</p>
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
                {t("af.addToCart")}
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
                {buyNowLoading ? t("af.processing") : t("af.buyNow")}
              </button>
            </div>

            <div className="flex items-center justify-center gap-4 pt-2 text-[11px] text-gray-400">
              <span>{t("af.badge.sidewalk")}</span>
              <span className="text-gray-300">|</span>
              <span>{t("af.badge.shipping")}</span>
            </div>
          </div>
        </aside>
      </div>

      {(() => {
        const faqItems = getConfiguratorFaqs("a-frame-signs");
        if (!faqItems) return null;
        return (
          <div className="mx-auto max-w-4xl pb-16 pt-8">
            <FaqAccordion items={faqItems} />
          </div>
        );
      })()}

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
                  {activeQty.toLocaleString()} × {t("af.title")} {size.label}
                </p>
              </>
            ) : (
              <p className="text-sm text-gray-400">{t("af.selectOptions")}</p>
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
            {t("af.addToCart")}
          </button>
        </div>
      </div>

      {/* ── Product Content ── */}
      <div className="mt-16 space-y-12">
        <section>
          <h2 className="text-xl font-bold text-gray-900">About A-Frame Signs</h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-gray-600">
            Portable double-sided sidewalk signs, perfect for restaurants, retail stores, and real estate open houses. Our A-Frame signs feature convenient insert panels that slide in and out, making it easy to swap messages and promotions without purchasing a new sign. Printed with vivid, weather-resistant inks at La Lunar Printing in Toronto, these signs are built to grab attention on busy sidewalks and storefronts.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900">Specifications</h2>
          <div className="mt-4 overflow-hidden rounded-xl border border-gray-200">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-gray-100">
                {[
                  ["Insert Material", "Coroplast (corrugated plastic), Aluminum, or PVC"],
                  ["Available Sizes", '24" \u00d7 36" (Standard) and 24" \u00d7 48" (Tall)'],
                  ["Frame Options", "Plastic folding frame (included) or upgraded metal frame"],
                  ["Durability", "2\u20135 years outdoor use depending on material"],
                  ["Turnaround", "1\u20132 business days for standard orders"],
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
              { q: "How do I change the inserts on an A-Frame sign?", a: "Our A-Frame signs use a simple slide-in channel system. Just pull the existing insert panel out from the top or side of the frame and slide the new one in. No tools are required, and the swap takes only a few seconds." },
              { q: "Can I use A-Frame signs indoors and outdoors?", a: "Yes, A-Frame signs work well in both settings. They are commonly used on sidewalks, patios, and parking lots outdoors, as well as in lobbies, trade show booths, and retail floors indoors. Coroplast and aluminum inserts are best for outdoor use." },
              { q: "How wind-resistant are A-Frame signs?", a: "A-Frame signs are designed to withstand moderate wind conditions. The metal frame upgrade provides additional stability and weight. For high-wind locations, we recommend placing sandbags at the base or using the heavier aluminum insert panels for added rigidity." },
              { q: "Are A-Frame signs double-sided?", a: "Yes, all of our A-Frame signs support double-sided inserts, giving you two faces of advertising space. You can choose single-sided if you prefer, or select double-sided to display your message on both sides of the frame at no extra charge." },
              { q: "Can I order custom sizes?", a: "We offer two standard sizes: 24\" \u00d7 36\" and 24\" \u00d7 48\". If you need a custom size, please contact our team at La Lunar Printing and we will do our best to accommodate your request with a custom quote." },
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
