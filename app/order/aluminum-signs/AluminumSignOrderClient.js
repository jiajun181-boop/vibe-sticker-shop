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

// ─── Aluminum Sign Configuration ───

const SIZES = [
  { id: "12x18", label: '12" \u00d7 18"', tag: "12\u00d718", w: 12, h: 18 },
  { id: "18x24", label: '18" \u00d7 24"', tag: "18\u00d724", w: 18, h: 24 },
  { id: "24x36", label: '24" \u00d7 36"', tag: "24\u00d736", w: 24, h: 36 },
  { id: "36x48", label: '36" \u00d7 48"', tag: "36\u00d748", w: 36, h: 48 },
];

const THICKNESSES = [
  { id: "0.040", surcharge: 0 },
  { id: "0.063", surcharge: 200 },
  { id: "0.080", surcharge: 400 },
];

const SIDES = [
  { id: "single", surcharge: 0 },
  { id: "double", surcharge: 0 },
];

const CORNERS = [
  { id: "square", surcharge: 0 },
  { id: "rounded", surcharge: 100 },
];

const HOLES = [
  { id: "none", surcharge: 0 },
  { id: "4-corners", surcharge: 0 },
  { id: "2-top", surcharge: 0 },
];

const REFLECTIVES = [
  { id: "none", surcharge: 0 },
  { id: "reflective", surcharge: 300 },
];

const QUANTITIES = [1, 5, 10, 25, 50];

// ─── Main Component ───

export default function AluminumSignOrderClient({ productImages = [] }) {
  const { t } = useTranslation();
  const { addItem, openCart } = useCartStore();

  const [sizeIdx, setSizeIdx] = useState(1); // 18x24 default
  const [thickness, setThickness] = useState("0.040");
  const [sides, setSides] = useState("single");
  const [corners, setCorners] = useState("square");
  const [holes, setHoles] = useState("none");
  const [reflective, setReflective] = useState("none");
  const [quantity, setQuantity] = useState(10);
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
        slug: "aluminum-signs",
        quantity: activeQty,
        widthIn: size.w,
        heightIn: size.h,
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
  }, [size.w, size.h, activeQty, sides]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(fetchQuote, DEBOUNCE_MS);
    return () => clearTimeout(debounceRef.current);
  }, [fetchQuote]);

  // ─── Pricing ───

  const subtotalCents = quoteData?.totalCents ?? 0;
  const thicknessSurcharge = (THICKNESSES.find((th) => th.id === thickness)?.surcharge ?? 0) * activeQty;
  const cornerSurcharge = (CORNERS.find((c) => c.id === corners)?.surcharge ?? 0) * activeQty;
  const reflectiveSurcharge = (REFLECTIVES.find((r) => r.id === reflective)?.surcharge ?? 0) * activeQty;

  const adjustedSubtotal = subtotalCents + thicknessSurcharge + cornerSurcharge + reflectiveSurcharge;
  const totalCents = adjustedSubtotal;

  const canAddToCart = quoteData && !quoteLoading && activeQty > 0;

  // ─── Cart ───

  function buildCartItem() {
    if (!quoteData || activeQty <= 0) return null;

    return {
      id: "aluminum-signs",
      name: `${t("al.title")} \u2014 ${size.tag}`,
      slug: "aluminum-signs",
      price: Math.round(adjustedSubtotal / activeQty),
      quantity: activeQty,
      options: {
        sizeId: size.id,
        sizeLabel: size.label,
        width: size.w,
        height: size.h,
        thickness,
        sides,
        corners,
        holes,
        reflective,
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
    showSuccessToast(t("al.addedToCart"));
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
          { label: t("al.breadcrumb"), href: "/shop/signs-rigid-boards" },
          { label: t("al.order") },
        ]}
      />

      <h1 className="mb-8 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
        {t("al.title")}
      </h1>

      <div className="lg:grid lg:grid-cols-5 lg:gap-10">
        {/* ── LEFT: Options ── */}
        <div className="space-y-8 lg:col-span-3">
          {/* Product Images */}
          {productImages.length > 0 && (
            <div className="mb-2">
              <ImageGallery images={productImages} productName={t("al.title")} />
            </div>
          )}

          {/* Size */}
          <Section label={t("al.size")}>
            <div className="flex flex-wrap gap-2">
              {SIZES.map((s, i) => (
                <Chip key={s.id} active={sizeIdx === i} onClick={() => setSizeIdx(i)}>
                  {s.label}
                </Chip>
              ))}
            </div>
          </Section>

          {/* Thickness */}
          <Section label={t("al.thickness")}>
            <div className="grid grid-cols-3 gap-3">
              {THICKNESSES.map((th) => (
                <button
                  key={th.id}
                  type="button"
                  onClick={() => setThickness(th.id)}
                  className={`relative rounded-xl border-2 px-3 py-3 text-left transition-all ${
                    thickness === th.id
                      ? "border-gray-900 bg-gray-50 shadow-sm"
                      : "border-gray-200 bg-white hover:border-gray-400"
                  }`}
                >
                  <span className="block text-sm font-medium text-gray-800">
                    {t(`al.thick.${th.id}`)}
                  </span>
                  {th.surcharge > 0 && (
                    <span className="mt-0.5 block text-[11px] font-medium text-amber-600">
                      +{formatCad(th.surcharge)}/ea
                    </span>
                  )}
                  {thickness === th.id && (
                    <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-gray-900" />
                  )}
                </button>
              ))}
            </div>
          </Section>

          {/* Sides */}
          <Section label={t("al.sides")}>
            <div className="flex flex-wrap gap-2">
              {SIDES.map((s) => (
                <Chip key={s.id} active={sides === s.id} onClick={() => setSides(s.id)}>
                  {t(`al.side.${s.id}`)}
                </Chip>
              ))}
            </div>
          </Section>

          {/* Corners */}
          <Section label={t("al.corners")}>
            <div className="flex flex-wrap gap-2">
              {CORNERS.map((c) => (
                <Chip key={c.id} active={corners === c.id} onClick={() => setCorners(c.id)}>
                  {t(`al.corner.${c.id}`)}
                  {c.surcharge > 0 && (
                    <span className="ml-1 text-[11px] opacity-70">+{formatCad(c.surcharge)}/ea</span>
                  )}
                </Chip>
              ))}
            </div>
          </Section>

          {/* Holes */}
          <Section label={t("al.holes")}>
            <div className="flex flex-wrap gap-2">
              {HOLES.map((h) => (
                <Chip key={h.id} active={holes === h.id} onClick={() => setHoles(h.id)}>
                  {t(`al.hole.${h.id}`)}
                </Chip>
              ))}
            </div>
          </Section>

          {/* Reflective */}
          <Section label={t("al.reflective")}>
            <div className="flex flex-wrap gap-2">
              {REFLECTIVES.map((r) => (
                <Chip key={r.id} active={reflective === r.id} onClick={() => setReflective(r.id)}>
                  {t(`al.refl.${r.id}`)}
                  {r.surcharge > 0 && (
                    <span className="ml-1 text-[11px] opacity-70">+{formatCad(r.surcharge)}/ea</span>
                  )}
                </Chip>
              ))}
            </div>
          </Section>

          {/* Quantity */}
          <Section label={t("al.quantity")}>
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
              <label className="text-xs text-gray-500">{t("al.customQty")}:</label>
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

          {/* Artwork Upload */}
          <Section label={t("al.artwork")} optional>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <p className="mb-3 text-xs text-gray-600">{t("al.uploadHint")}</p>
              {uploadedFile ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-800">{uploadedFile.name}</span>
                  <button
                    type="button"
                    onClick={() => setUploadedFile(null)}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    {t("al.remove")}
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
            <h2 className="text-base font-bold text-gray-900">{t("al.summary")}</h2>

            <dl className="space-y-2 text-sm">
              <Row label={t("al.size")} value={size.label} />
              <Row label={t("al.thickness")} value={t(`al.thick.${thickness}`)} />
              <Row label={t("al.sides")} value={t(`al.side.${sides}`)} />
              <Row label={t("al.corners")} value={t(`al.corner.${corners}`)} />
              <Row label={t("al.holes")} value={t(`al.hole.${holes}`)} />
              {reflective !== "none" && (
                <Row label={t("al.reflective")} value={t(`al.refl.${reflective}`)} />
              )}
              <Row label={t("al.quantity")} value={activeQty > 0 ? activeQty.toLocaleString() : "\u2014"} />
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
                <Row label={t("al.basePrice")} value={formatCad(subtotalCents)} />
                {thicknessSurcharge > 0 && (
                  <Row label={t(`al.thick.${thickness}`)} value={`+ ${formatCad(thicknessSurcharge)}`} />
                )}
                {cornerSurcharge > 0 && (
                  <Row label={t(`al.corner.${corners}`)} value={`+ ${formatCad(cornerSurcharge)}`} />
                )}
                {reflectiveSurcharge > 0 && (
                  <Row label={t(`al.refl.${reflective}`)} value={`+ ${formatCad(reflectiveSurcharge)}`} />
                )}
                <Row label={t("al.subtotal")} value={formatCad(adjustedSubtotal)} />
                <div className="flex justify-between border-t border-gray-100 pt-2">
                  <dt className="font-semibold text-gray-900">{t("al.total")}</dt>
                  <dd className="text-lg font-bold text-gray-900">{formatCad(totalCents)}</dd>
                </div>
                {activeQty > 1 && (
                  <div className="pt-1">
                    <p className="text-[11px] text-gray-400">
                      {formatCad(Math.round(adjustedSubtotal / activeQty))}/{t("al.each")}
                    </p>
                  </div>
                )}
              </dl>
            ) : (
              <p className="text-xs text-gray-400">{t("al.selectOptions")}</p>
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
                {t("al.addToCart")}
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
                {buyNowLoading ? t("al.processing") : t("al.buyNow")}
              </button>
            </div>

            <div className="flex items-center justify-center gap-4 pt-2 text-[11px] text-gray-400">
              <span>{t("al.badge.rustproof")}</span>
              <span className="text-gray-300">|</span>
              <span>{t("al.badge.shipping")}</span>
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
                  {activeQty} \u00d7 {t("al.title")} {size.tag}
                </p>
              </>
            ) : (
              <p className="text-sm text-gray-400">{t("al.selectOptions")}</p>
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
            {t("al.addToCart")}
          </button>
        </div>
      </div>

      {/* ── Product Content ── */}
      <div className="mt-16 space-y-12">
        <section>
          <h2 className="text-xl font-bold text-gray-900">About Aluminum Signs</h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-gray-600">
            Premium aluminum signs for permanent outdoor and indoor signage. Rust-proof, rigid, and professional, our aluminum signs are ideal for parking signs, business signage, wayfinding, and property identification. Printed with UV-cured inks directly onto the metal surface at La Lunar Printing in Toronto, these signs deliver sharp graphics and exceptional longevity even in harsh Canadian weather conditions.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900">Specifications</h2>
          <div className="mt-4 overflow-hidden rounded-xl border border-gray-200">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-gray-100">
                {[
                  ["Material", '.040", .063", or .080" aluminum sheet'],
                  ["Printing", "UV direct print, full colour CMYK"],
                  ["Durability", "5\u201310 years outdoor without fading"],
                  ["Finish", "Gloss or matte UV coating"],
                  ["Mounting", "Pre-drilled holes, grommets, or plain"],
                  ["Reflective Option", "Engineer-grade reflective sheeting available"],
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
              { q: "How does aluminum compare to Coroplast for durability?", a: "Aluminum is significantly more durable than Coroplast. While Coroplast signs typically last 1\u20132 years outdoors, aluminum signs can last 5\u201310 years or longer. Aluminum is rust-proof, rigid, and will not warp, bend, or become brittle over time like plastic-based materials." },
              { q: "What mounting options are available?", a: "We offer several mounting options including pre-drilled holes in all four corners, two holes at the top for hanging, or grommets for rope or zip-tie mounting. You can also order without any holes if you plan to use adhesive, brackets, or a custom mounting solution." },
              { q: "Can I get reflective aluminum signs for parking lots?", a: "Yes, we offer engineer-grade reflective sheeting that can be applied to aluminum signs. Reflective signs are ideal for parking lots, fire lanes, no-parking zones, and any signage that needs to be visible at night when illuminated by headlights." },
              { q: "Are custom shapes available?", a: "Our standard production handles rectangular signs with optional square or rounded corners. If you require a custom shape such as a circle, arrow, or die-cut contour, please contact our team at La Lunar Printing for a custom quote and lead time." },
              { q: "How weather-resistant are aluminum signs?", a: "Aluminum signs are extremely weather-resistant. The material itself will not rust, rot, or corrode, and our UV-cured inks are rated for years of direct sun exposure without significant fading. They handle rain, snow, ice, and temperature extremes common in the Toronto and Southern Ontario climate." },
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
