"use client";

import { useCallback, useMemo, useRef, useState, useEffect } from "react";
import { useCartStore } from "@/lib/store";
import { showErrorToast, showSuccessToast } from "@/components/Toast";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { UploadButton } from "@/utils/uploadthing";
import Breadcrumbs from "@/components/Breadcrumbs";

const DEBOUNCE_MS = 300;

const formatCad = (cents) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);

// ─── Decal Configuration ───

const APPLICATIONS = [
  { id: "window", slug: "decals-window", icon: "window" },
  { id: "wall", slug: "decals-wall", icon: "wall" },
  { id: "floor", slug: "decals-floor", icon: "floor" },
];

const VINYLS = [
  { id: "clear", label: null, surcharge: 0 },
  { id: "white", label: null, surcharge: 0 },
  { id: "perforated", label: null, surcharge: 15 },  // +$0.15/ea — see-through vinyl
  { id: "reflective", label: null, surcharge: 25 },   // +$0.25/ea
];

// Floor decals need anti-slip lamination — forced on
const FLOOR_APP = "floor";

const ADHESIVE_SIDES = [
  { id: "front", surcharge: 0 },   // standard — adhesive on back
  { id: "inside-glass", surcharge: 5 }, // reversed print, adhesive on front for inside window
];

const DURABILITIES = [
  { id: "indoor", surcharge: 0 },
  { id: "outdoor", surcharge: 8 },  // +$0.08/ea — UV & weather resistant
];

const SIZES = [
  { id: "small", label: '4" × 4"', w: 4, h: 4 },
  { id: "medium", label: '8" × 8"', w: 8, h: 8 },
  { id: "large", label: '12" × 12"', w: 12, h: 12 },
  { id: "xlarge", label: '24" × 24"', w: 24, h: 24 },
  { id: "banner", label: '12" × 36"', w: 12, h: 36 },
];

const QUANTITIES = [1, 5, 10, 25, 50, 100];

// ─── Icons ───

function AppIcon({ type, className = "h-8 w-8" }) {
  const common = { className, strokeWidth: 1.5, fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" };
  switch (type) {
    case "window":
      return (
        <svg {...common}>
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path strokeLinecap="round" d="M3 12h18M12 3v18" />
          <circle cx="17" cy="7" r="2" opacity="0.3" fill="currentColor" />
        </svg>
      );
    case "wall":
      return (
        <svg {...common}>
          <rect x="2" y="6" width="20" height="14" rx="1" />
          <path strokeLinecap="round" d="M6 6V4M18 6V4M12 6V4" />
          <rect x="6" y="9" width="12" height="8" rx="1" strokeDasharray="3 2" />
        </svg>
      );
    case "floor":
      return (
        <svg {...common}>
          <path d="M2 18l10-6 10 6" />
          <path d="M2 18l10 4 10-4" opacity="0.2" fill="currentColor" />
          <rect x="7" y="10" width="10" height="6" rx="1" strokeDasharray="3 2" />
        </svg>
      );
    default:
      return null;
  }
}

// ─── Main Component ───

export default function DecalOrderClient() {
  const { t } = useTranslation();
  const { addItem, openCart } = useCartStore();

  const [appId, setAppId] = useState("window");
  const [vinyl, setVinyl] = useState("white");
  const [adhesiveSide, setAdhesiveSide] = useState("front");
  const [durability, setDurability] = useState("indoor");
  const [sizeIdx, setSizeIdx] = useState(1); // 8×8
  const [quantity, setQuantity] = useState(10);
  const [customQty, setCustomQty] = useState("");
  const [uploadedFile, setUploadedFile] = useState(null);

  const [quoteData, setQuoteData] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState(null);
  const [buyNowLoading, setBuyNowLoading] = useState(false);

  const debounceRef = useRef(null);
  const abortRef = useRef(null);

  const app = useMemo(() => APPLICATIONS.find((a) => a.id === appId) || APPLICATIONS[0], [appId]);
  const size = SIZES[sizeIdx];
  const isWindow = appId === "window";
  const isFloor = appId === FLOOR_APP;

  const activeQty = useMemo(() => {
    if (customQty !== "") {
      const n = parseInt(customQty, 10);
      return n > 0 ? n : 0;
    }
    return quantity;
  }, [quantity, customQty]);

  // Floor = forced outdoor durability; non-window = no inside-glass
  useEffect(() => {
    if (isFloor) setDurability("outdoor");
    if (!isWindow) setAdhesiveSide("front");
  }, [isFloor, isWindow]);

  // ─── Quote ───

  const fetchQuote = useCallback(() => {
    if (abortRef.current) abortRef.current.abort();
    if (activeQty <= 0) { setQuoteData(null); return; }
    const ac = new AbortController();
    abortRef.current = ac;
    setQuoteLoading(true);
    setQuoteError(null);

    fetch("/api/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: app.slug, quantity: activeQty, widthIn: size.w, heightIn: size.h }),
      signal: ac.signal,
    })
      .then((r) => r.json().then((d) => ({ ok: r.ok, data: d })))
      .then(({ ok, data }) => { if (!ok) throw new Error(data.error || "Quote failed"); setQuoteData(data); })
      .catch((err) => { if (err.name === "AbortError") return; setQuoteError(err.message); })
      .finally(() => setQuoteLoading(false));
  }, [app.slug, size.w, size.h, activeQty]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(fetchQuote, DEBOUNCE_MS);
    return () => clearTimeout(debounceRef.current);
  }, [fetchQuote]);

  // ─── Pricing ───

  const subtotalCents = quoteData?.totalCents ?? 0;
  const vinylSurcharge = (VINYLS.find((v) => v.id === vinyl)?.surcharge ?? 0) * activeQty;
  const adhesiveSurcharge = (ADHESIVE_SIDES.find((a) => a.id === adhesiveSide)?.surcharge ?? 0) * activeQty;
  const durabilitySurcharge = (DURABILITIES.find((d) => d.id === durability)?.surcharge ?? 0) * activeQty;
  const floorLamSurcharge = isFloor ? 20 * activeQty : 0; // anti-slip lamination

  const adjustedSubtotal = subtotalCents + vinylSurcharge + adhesiveSurcharge + durabilitySurcharge + floorLamSurcharge;
  const totalCents = adjustedSubtotal;

  const canAddToCart = quoteData && !quoteLoading && activeQty > 0;

  function buildCartItem() {
    if (!quoteData || activeQty <= 0) return null;
    return {
      id: app.slug,
      name: `${t(`decal.app.${appId}`)} — ${size.label}`,
      slug: app.slug,
      price: Math.round(adjustedSubtotal / activeQty),
      quantity: activeQty,
      options: { application: appId, vinyl, adhesiveSide: isWindow ? adhesiveSide : "front", durability, sizeId: size.id, sizeLabel: size.label, width: size.w, height: size.h, fileName: uploadedFile?.name || null },
      forceNewLine: true,
    };
  }

  function handleAddToCart() {
    const item = buildCartItem();
    if (!item) return;
    addItem(item); openCart();
    showSuccessToast(t("decal.addedToCart"));
  }

  async function handleBuyNow() {
    const item = buildCartItem();
    if (!item || buyNowLoading) return;
    setBuyNowLoading(true);
    try {
      const meta = {};
      for (const [k, v] of Object.entries(item.options)) { if (v == null) continue; meta[k] = typeof v === "object" ? JSON.stringify(v) : v; }
      const res = await fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: [{ productId: String(item.id), slug: String(item.slug), name: item.name, unitAmount: item.price, quantity: item.quantity, meta }] }) });
      const data = await res.json();
      if (!res.ok || !data?.url) throw new Error(data?.error || "Checkout failed");
      window.location.href = data.url;
    } catch (e) { showErrorToast(e instanceof Error ? e.message : "Checkout failed"); }
    finally { setBuyNowLoading(false); }
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumbs items={[
        { label: t("nav.shop"), href: "/shop" },
        { label: t("decal.breadcrumb"), href: "/shop/stickers-labels-decals/decals" },
        { label: t("decal.order") },
      ]} />

      <h1 className="mb-8 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">{t("decal.title")}</h1>

      <div className="lg:grid lg:grid-cols-5 lg:gap-10">
        <div className="space-y-8 lg:col-span-3">

          <Section label={t("decal.app.label")}>
            <div className="grid grid-cols-3 gap-3">
              {APPLICATIONS.map((a) => (
                <button key={a.id} type="button" onClick={() => setAppId(a.id)}
                  className={`group flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-center transition-all ${appId === a.id ? "border-gray-900 bg-gray-900 text-white shadow-md" : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"}`}>
                  <AppIcon type={a.icon} className="h-8 w-8" />
                  <span className="text-sm font-semibold">{t(`decal.app.${a.id}`)}</span>
                  <span className={`text-[11px] leading-tight ${appId === a.id ? "text-gray-300" : "text-gray-400"}`}>{t(`decal.appDesc.${a.id}`)}</span>
                </button>
              ))}
            </div>
          </Section>

          <Section label={t("decal.vinyl")}>
            <div className="flex flex-wrap gap-2">
              {VINYLS.map((v) => (
                <Chip key={v.id} active={vinyl === v.id} onClick={() => setVinyl(v.id)}>
                  {t(`decal.vinyl.${v.id}`)}
                  {v.surcharge > 0 && <span className="ml-1 text-[11px] opacity-70">+{formatCad(v.surcharge)}/ea</span>}
                </Chip>
              ))}
            </div>
          </Section>

          {isWindow && (
            <Section label={t("decal.adhesive")}>
              <div className="flex flex-wrap gap-2">
                {ADHESIVE_SIDES.map((a) => (
                  <Chip key={a.id} active={adhesiveSide === a.id} onClick={() => setAdhesiveSide(a.id)}>
                    {t(`decal.adhesive.${a.id}`)}
                    {a.surcharge > 0 && <span className="ml-1 text-[11px] opacity-70">+{formatCad(a.surcharge)}/ea</span>}
                  </Chip>
                ))}
              </div>
              <p className="mt-2 text-[11px] text-gray-400">{t("decal.adhesiveHint")}</p>
            </Section>
          )}

          <Section label={t("decal.durability")}>
            <div className="flex flex-wrap gap-2">
              {DURABILITIES.map((d) => {
                const disabled = isFloor && d.id === "indoor";
                return (
                  <button key={d.id} type="button" onClick={() => !disabled && setDurability(d.id)} disabled={disabled}
                    className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${disabled ? "cursor-not-allowed border-gray-100 bg-gray-50 text-gray-300" : durability === d.id ? "border-gray-900 bg-gray-900 text-white" : "border-gray-300 bg-white text-gray-700 hover:border-gray-500"}`}>
                    {t(`decal.dur.${d.id}`)}
                    {d.surcharge > 0 && !disabled && <span className="ml-1 text-[11px] opacity-70">+{formatCad(d.surcharge)}/ea</span>}
                  </button>
                );
              })}
            </div>
            {isFloor && <p className="mt-2 text-[11px] text-gray-400">{t("decal.floorHint")}</p>}
          </Section>

          <Section label={t("decal.size")}>
            <div className="flex flex-wrap gap-2">
              {SIZES.map((s, i) => <Chip key={s.id} active={sizeIdx === i} onClick={() => setSizeIdx(i)}>{s.label}</Chip>)}
            </div>
          </Section>

          <Section label={t("decal.quantity")}>
            <div className="flex flex-wrap gap-2">
              {QUANTITIES.map((q) => <Chip key={q} active={customQty === "" && quantity === q} onClick={() => { setQuantity(q); setCustomQty(""); }}>{q.toLocaleString()}</Chip>)}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <label className="text-xs text-gray-500">{t("decal.customQty")}:</label>
              <input type="number" min="1" max="999999" value={customQty} onChange={(e) => setCustomQty(e.target.value)} placeholder="e.g. 30"
                className="w-28 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900" />
            </div>
          </Section>

          <Section label={t("decal.artwork")} optional>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <p className="mb-3 text-xs text-gray-600">{t("decal.uploadHint")}</p>
              {uploadedFile ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-800">{uploadedFile.name}</span>
                  <button type="button" onClick={() => setUploadedFile(null)} className="text-xs text-red-500 hover:text-red-700">{t("decal.remove")}</button>
                </div>
              ) : (
                <UploadButton endpoint="artworkUploader"
                  onClientUploadComplete={(res) => { const first = Array.isArray(res) ? res[0] : null; if (!first) return; setUploadedFile({ url: first.ufsUrl || first.url, key: first.key, name: first.name, size: first.size }); }}
                  onUploadError={(err) => showErrorToast(err?.message || "Upload failed")} />
              )}
            </div>
          </Section>
        </div>

        <aside className="hidden lg:col-span-2 lg:block">
          <div className="sticky top-24 space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-bold text-gray-900">{t("decal.summary")}</h2>
            <dl className="space-y-2 text-sm">
              <Row label={t("decal.app.label")} value={t(`decal.app.${appId}`)} />
              <Row label={t("decal.vinyl")} value={t(`decal.vinyl.${vinyl}`)} />
              {isWindow && adhesiveSide !== "front" && <Row label={t("decal.adhesive")} value={t(`decal.adhesive.${adhesiveSide}`)} />}
              <Row label={t("decal.durability")} value={t(`decal.dur.${durability}`)} />
              <Row label={t("decal.size")} value={size.label} />
              <Row label={t("decal.quantity")} value={activeQty > 0 ? activeQty.toLocaleString() : "\u2014"} />
            </dl>
            <hr className="border-gray-100" />
            {quoteLoading ? (
              <div className="space-y-2">{[1,2,3].map((i) => <div key={i} className="h-4 animate-pulse rounded bg-gray-100" />)}</div>
            ) : quoteError ? <p className="text-xs text-red-500">{quoteError}</p>
            : quoteData ? (
              <dl className="space-y-2 text-sm">
                <Row label={t("decal.basePrice")} value={formatCad(subtotalCents)} />
                {vinylSurcharge > 0 && <Row label={t(`decal.vinyl.${vinyl}`)} value={`+ ${formatCad(vinylSurcharge)}`} />}
                {adhesiveSurcharge > 0 && <Row label={t(`decal.adhesive.${adhesiveSide}`)} value={`+ ${formatCad(adhesiveSurcharge)}`} />}
                {durabilitySurcharge > 0 && <Row label={t(`decal.dur.${durability}`)} value={`+ ${formatCad(durabilitySurcharge)}`} />}
                {floorLamSurcharge > 0 && <Row label={t("decal.antiSlip")} value={`+ ${formatCad(floorLamSurcharge)}`} />}
                <Row label={t("decal.subtotal")} value={formatCad(adjustedSubtotal)} />
                <div className="flex justify-between border-t border-gray-100 pt-2">
                  <dt className="font-semibold text-gray-900">{t("decal.total")}</dt>
                  <dd className="text-lg font-bold text-gray-900">{formatCad(totalCents)}</dd>
                </div>
                {activeQty > 1 && <div className="pt-1"><p className="text-[11px] text-gray-400">{formatCad(Math.round(adjustedSubtotal / activeQty))}/{t("decal.each")}</p></div>}
              </dl>
            ) : <p className="text-xs text-gray-400">{t("decal.selectOptions")}</p>}
            <div className="space-y-3">
              <button type="button" onClick={handleAddToCart} disabled={!canAddToCart} className={`w-full rounded-full px-4 py-3 text-sm font-semibold uppercase tracking-[0.15em] transition-all ${canAddToCart ? "bg-gray-900 text-white hover:bg-gray-800" : "cursor-not-allowed bg-gray-200 text-gray-400"}`}>{t("decal.addToCart")}</button>
              <button type="button" onClick={handleBuyNow} disabled={!canAddToCart || buyNowLoading} className={`w-full rounded-full border-2 px-4 py-3 text-sm font-semibold uppercase tracking-[0.15em] transition-all ${canAddToCart && !buyNowLoading ? "border-gray-900 text-gray-900 hover:bg-gray-50" : "cursor-not-allowed border-gray-200 text-gray-400"}`}>{buyNowLoading ? t("decal.processing") : t("decal.buyNow")}</button>
            </div>
            <div className="flex items-center justify-center gap-4 pt-2 text-[11px] text-gray-400">
              <span>{t("decal.badge.contourCut")}</span><span className="text-gray-300">|</span><span>{t("decal.badge.shipping")}</span>
            </div>
          </div>
        </aside>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white px-4 py-3 shadow-[0_-2px_12px_rgba(0,0,0,0.08)] lg:hidden">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <div className="min-w-0 flex-1">
            {quoteLoading ? <div className="h-5 w-20 animate-pulse rounded bg-gray-200" /> : quoteData ? (
              <><p className="text-lg font-bold text-gray-900">{formatCad(totalCents)}</p><p className="truncate text-[11px] text-gray-500">{activeQty} × {t(`decal.app.${appId}`)} {size.label}</p></>
            ) : <p className="text-sm text-gray-400">{t("decal.selectOptions")}</p>}
          </div>
          <button type="button" onClick={handleAddToCart} disabled={!canAddToCart} className={`shrink-0 rounded-full px-5 py-2.5 text-xs font-semibold uppercase tracking-wider transition-all ${canAddToCart ? "bg-gray-900 text-white hover:bg-gray-800" : "cursor-not-allowed bg-gray-200 text-gray-400"}`}>{t("decal.addToCart")}</button>
        </div>
      </div>
      <div className="h-20 lg:hidden" />
    </main>
  );
}

function Section({ label, optional, children }) {
  return (<section><div className="mb-3 flex items-baseline gap-2"><h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">{label}</h2>{optional && <span className="text-[10px] text-gray-400">(optional)</span>}</div>{children}</section>);
}
function Chip({ active, onClick, children }) {
  return (<button type="button" onClick={onClick} className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${active ? "border-gray-900 bg-gray-900 text-white" : "border-gray-300 bg-white text-gray-700 hover:border-gray-500"}`}>{children}</button>);
}
function Row({ label, value }) {
  return (<div className="flex justify-between"><dt className="text-gray-500">{label}</dt><dd className="font-medium text-gray-800">{value}</dd></div>);
}
