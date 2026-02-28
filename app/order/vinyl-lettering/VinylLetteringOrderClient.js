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

// ─── Vinyl Lettering Configuration ───

const LETTER_HEIGHTS = [
  { id: "1in", value: 1, label: '1"' },
  { id: "2in", value: 2, label: '2"' },
  { id: "3in", value: 3, label: '3"' },
  { id: "4in", value: 4, label: '4"' },
  { id: "6in", value: 6, label: '6"' },
  { id: "8in", value: 8, label: '8"' },
  { id: "12in", value: 12, label: '12"' },
];

const COLORS = [
  { id: "black", hex: "#1a1a1a", surcharge: 0 },
  { id: "white", hex: "#ffffff", surcharge: 0 },
  { id: "red", hex: "#dc2626", surcharge: 0 },
  { id: "blue", hex: "#1d4ed8", surcharge: 0 },
  { id: "orange", hex: "#ea580c", surcharge: 0 },
  { id: "green", hex: "#16a34a", surcharge: 0 },
  { id: "yellow", hex: "#eab308", surcharge: 0 },
  { id: "purple", hex: "#9333ea", surcharge: 0 },
  { id: "pink", hex: "#ec4899", surcharge: 0 },
  { id: "brown", hex: "#92400e", surcharge: 0 },
  { id: "gold", hex: "#ca8a04", surcharge: 5 },
  { id: "silver", hex: "#9ca3af", surcharge: 5 },
];

const REFLECTIVE_COLORS = ["white", "silver", "yellow", "red", "orange", "green", "blue"];

const MATERIALS = [
  { id: "standard", surcharge: 0 },
  { id: "reflective", surcharge: 15 },
];

const APPLICATIONS = [
  { id: "outdoor", surcharge: 0 },
  { id: "indoor", surcharge: 0 },
];

const QUANTITIES = [1, 2, 5, 10, 25, 50];

// googleFamily: only set for fonts that need Google Fonts loading
// System fonts (Arial, Helvetica, Times, Impact) are available natively
const FONTS = [
  { id: "arial", label: "Arial", family: "Arial, sans-serif" },
  { id: "helvetica", label: "Helvetica", family: "'Helvetica Neue', Helvetica, Arial, sans-serif" },
  { id: "times", label: "Times New Roman", family: "'Times New Roman', serif" },
  { id: "impact", label: "Impact", family: "Impact, sans-serif" },
  { id: "montserrat", label: "Montserrat", family: "'Montserrat', sans-serif", googleFamily: "Montserrat:wght@400;700" },
  { id: "roboto", label: "Roboto", family: "'Roboto', sans-serif", googleFamily: "Roboto:wght@400;700" },
  { id: "open-sans", label: "Open Sans", family: "'Open Sans', sans-serif", googleFamily: "Open+Sans:wght@400;700" },
  { id: "lobster", label: "Lobster", family: "'Lobster', cursive", googleFamily: "Lobster" },
  { id: "permanent-marker", label: "Permanent Marker", family: "'Permanent Marker', cursive", googleFamily: "Permanent+Marker" },
  { id: "oswald", label: "Oswald", family: "'Oswald', sans-serif", googleFamily: "Oswald:wght@400;700" },
  { id: "playfair", label: "Playfair Display", family: "'Playfair Display', serif", googleFamily: "Playfair+Display:wght@400;700" },
  { id: "raleway", label: "Raleway", family: "'Raleway', sans-serif", googleFamily: "Raleway:wght@400;700" },
];

const TURNAROUND_OPTIONS = [
  { id: "standard", multiplier: 1.0 },
  { id: "rush", multiplier: 1.5 },
];

// ─── Main Component ───

export default function VinylLetteringOrderClient() {
  const { t } = useTranslation();
  const { addItem, openCart } = useCartStore();

  // Type: "text" (lettering) or "logo" (logo & shape decal)
  const [type, setType] = useState("text");
  // Logo sub-mode: "cut" (single color) or "printed" (full color)
  const [logoMode, setLogoMode] = useState("cut");

  const [heightId, setHeightId] = useState("2in");
  const [color, setColor] = useState("black");
  const [material, setMaterial] = useState("standard");
  const [application, setApplication] = useState("outdoor");
  const [quantity, setQuantity] = useState(5);
  const [customQty, setCustomQty] = useState("");
  const [letteringText, setLetteringText] = useState("");
  const [fontId, setFontId] = useState("arial");
  const [turnaroundId, setTurnaroundId] = useState("standard");
  const [uploadedFile, setUploadedFile] = useState(null);

  // Logo mode dimensions
  const [logoWidth, setLogoWidth] = useState("6");
  const [logoHeight, setLogoHeight] = useState("6");

  const [quoteData, setQuoteData] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(true);
  const [quoteError, setQuoteError] = useState(null);
  const [buyNowLoading, setBuyNowLoading] = useState(false);

  const debounceRef = useRef(null);
  const abortRef = useRef(null);

  const letterHeight = useMemo(
    () => LETTER_HEIGHTS.find((h) => h.id === heightId) || LETTER_HEIGHTS[1],
    [heightId],
  );

  const activeQty = useMemo(() => {
    if (customQty !== "") {
      const n = parseInt(customQty, 10);
      return n > 0 ? n : 0;
    }
    return quantity;
  }, [quantity, customQty]);

  // Filter colors for reflective material
  const availableColors = useMemo(() => {
    if (material === "reflective") {
      return COLORS.filter((c) => REFLECTIVE_COLORS.includes(c.id));
    }
    return COLORS;
  }, [material]);

  // Reset color if not available for current material
  useEffect(() => {
    if (material === "reflective" && !REFLECTIVE_COLORS.includes(color)) {
      setColor("white");
    }
  }, [material, color]);

  const selectedFont = useMemo(() => FONTS.find((f) => f.id === fontId) || FONTS[0], [fontId]);

  // Dimensions for quote — text mode estimates from letter height, logo mode uses user input
  const parsedLogoW = Math.min(53, Math.max(0.5, parseFloat(logoWidth) || 0));
  const parsedLogoH = Math.min(53, Math.max(0.5, parseFloat(logoHeight) || 0));
  const widthIn = type === "text" ? letterHeight.value * 4 : parsedLogoW;
  const heightIn = type === "text" ? letterHeight.value : parsedLogoH;

  const turnaround = TURNAROUND_OPTIONS.find((t) => t.id === turnaroundId) || TURNAROUND_OPTIONS[0];

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
        slug: "vinyl-lettering",
        quantity: activeQty,
        widthIn,
        heightIn,
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
  }, [activeQty, widthIn, heightIn]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(fetchQuote, DEBOUNCE_MS);
    return () => clearTimeout(debounceRef.current);
  }, [fetchQuote]);

  // ─── Pricing ───

  const subtotalCents = quoteData?.totalCents ?? 0;
  const colorSurcharge = (COLORS.find((c) => c.id === color)?.surcharge ?? 0) * activeQty;
  const materialSurcharge = (MATERIALS.find((m) => m.id === material)?.surcharge ?? 0) * activeQty;
  // Printed vinyl logo surcharge (+30%)
  const printedVinylSurcharge = (type === "logo" && logoMode === "printed") ? Math.round(subtotalCents * 0.30) : 0;

  let adjustedSubtotal = subtotalCents + colorSurcharge + materialSurcharge + printedVinylSurcharge;
  if (turnaroundId === "rush") adjustedSubtotal = Math.round(adjustedSubtotal * turnaround.multiplier);
  const totalCents = adjustedSubtotal;

  const canAddToCart = quoteData && !quoteLoading && activeQty > 0;

  // ─── Cart ───

  function buildCartItem() {
    if (!quoteData || activeQty <= 0) return null;
    const isLogo = type === "logo";
    const textSnippet = letteringText.trim().slice(0, 40);
    const nameDesc = isLogo
      ? `${parsedLogoW}" × ${parsedLogoH}" ${logoMode === "printed" ? "Full Color" : t(`vl.color.${color}`)}`
      : `${letterHeight.label} ${t(`vl.color.${color}`)}${textSnippet ? ` "${textSnippet}"` : ""}`;
    return {
      id: "vinyl-lettering",
      name: `${t("vl.title")} — ${nameDesc}`,
      slug: "vinyl-lettering",
      price: Math.round(adjustedSubtotal / activeQty),
      quantity: activeQty,
      options: {
        type,
        ...(isLogo
          ? { widthIn: parsedLogoW, heightIn: parsedLogoH, logoMode }
          : { letterHeight: heightId, letterHeightLabel: letterHeight.label, letteringText: letteringText.trim() || null, font: fontId }),
        ...(!(isLogo && logoMode === "printed") && { color }),
        material,
        application,
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
    showSuccessToast(t("vl.addedToCart"));
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
      {/* Load only the selected Google Font on demand (not all 8 at once) */}
      {selectedFont.googleFamily && (
        // eslint-disable-next-line @next/next/no-page-custom-font
        <link
          key={selectedFont.id}
          rel="stylesheet"
          href={`https://fonts.googleapis.com/css2?family=${selectedFont.googleFamily}&display=swap`}
        />
      )}

      <Breadcrumbs
        items={[
          { label: t("nav.shop"), href: "/shop" },
          { label: t("vl.breadcrumb"), href: "/shop/stickers-labels-decals/vinyl-lettering" },
          { label: t("vl.order") },
        ]}
      />

      <h1 className="mb-8 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
        {t("vl.title")}
      </h1>

      <div className="lg:grid lg:grid-cols-5 lg:gap-10">
        {/* ── LEFT: Options ── */}
        <div className="space-y-8 lg:col-span-3">

          {/* Step 1: Type Selector */}
          <Section label={t("vl.type.label")}>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setType("text")}
                className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-center transition-all ${
                  type === "text"
                    ? "border-gray-900 bg-gray-50 shadow-sm"
                    : "border-gray-200 bg-white hover:border-gray-400"
                }`}
              >
                <svg className="h-8 w-8 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                </svg>
                <span className="text-sm font-semibold text-gray-900">{t("vl.type.text")}</span>
                <span className="text-[11px] text-gray-500">{t("vl.type.textDesc")}</span>
              </button>
              <button
                type="button"
                onClick={() => setType("logo")}
                className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-center transition-all ${
                  type === "logo"
                    ? "border-gray-900 bg-gray-50 shadow-sm"
                    : "border-gray-200 bg-white hover:border-gray-400"
                }`}
              >
                <svg className="h-8 w-8 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
                </svg>
                <span className="text-sm font-semibold text-gray-900">{t("vl.type.logo")}</span>
                <span className="text-[11px] text-gray-500">{t("vl.type.logoDesc")}</span>
              </button>
            </div>
          </Section>

          {/* Logo mode: Cut vs Printed sub-option */}
          {type === "logo" && (
            <Section label={t("vl.type.logo")}>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setLogoMode("cut")}
                  className={`rounded-xl border-2 p-3 text-left transition-all ${
                    logoMode === "cut" ? "border-gray-900 bg-gray-50 shadow-sm" : "border-gray-200 bg-white hover:border-gray-400"
                  }`}
                >
                  <span className="block text-xs font-bold text-gray-900">{t("vl.logo.cutVinyl")}</span>
                  <span className="block mt-0.5 text-[10px] text-gray-500">{t("vl.logo.cutVinylDesc")}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLogoMode("printed")}
                  className={`rounded-xl border-2 p-3 text-left transition-all ${
                    logoMode === "printed" ? "border-gray-900 bg-gray-50 shadow-sm" : "border-gray-200 bg-white hover:border-gray-400"
                  }`}
                >
                  <span className="block text-xs font-bold text-gray-900">{t("vl.logo.printedVinyl")}</span>
                  <span className="block mt-0.5 text-[10px] text-gray-500">{t("vl.logo.printedVinylDesc")}</span>
                </button>
              </div>
            </Section>
          )}

          {/* Text mode: Your Text input */}
          {type === "text" && (
            <Section label={t("vl.textInput")}>
              <textarea
                value={letteringText}
                onChange={(e) => setLetteringText(e.target.value)}
                placeholder={t("vl.enterText")}
                rows={3}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
              />
              <p className="mt-1.5 text-xs text-gray-500">{t("vl.textInputHint")}</p>
            </Section>
          )}

          {/* Text mode: Font Selector */}
          {type === "text" && (
            <Section label={t("vl.font.label")}>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {FONTS.map((font) => (
                  <button
                    key={font.id}
                    type="button"
                    onClick={() => setFontId(font.id)}
                    className={`rounded-lg border-2 px-3 py-2 text-left transition-all ${
                      fontId === font.id
                        ? "border-gray-900 bg-gray-50 shadow-sm"
                        : "border-gray-200 bg-white hover:border-gray-400"
                    }`}
                  >
                    <span className="block text-sm font-medium text-gray-800" style={{ fontFamily: font.family }}>{font.label}</span>
                    <span className="block text-[10px] text-gray-400" style={{ fontFamily: font.family }}>Abc 123</span>
                  </button>
                ))}
              </div>
            </Section>
          )}

          {/* Text mode: Live Preview */}
          {type === "text" && letteringText.trim() && (
            <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-5">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400">{t("vl.preview") || "Preview"}</p>
              <div
                className="flex min-h-[80px] items-center justify-center overflow-hidden rounded-xl bg-white p-4 shadow-inner"
                style={{ backgroundColor: color === "white" ? "#374151" : "#ffffff" }}
              >
                <p
                  className="text-center font-bold leading-tight whitespace-pre-line break-words"
                  style={{
                    color: COLORS.find((c) => c.id === color)?.hex || "#1a1a1a",
                    fontSize: `${Math.min(letterHeight.value * 6, 72)}px`,
                    fontFamily: selectedFont.family,
                    letterSpacing: "0.02em",
                    maxWidth: "100%",
                  }}
                >
                  {letteringText.trim()}
                </p>
              </div>
              <p className="mt-2 text-[11px] text-gray-400 text-center">
                {letterHeight.label} {t(`vl.color.${color}`)} · {selectedFont.label} · {t(`vl.material.${material}`)}
              </p>
            </div>
          )}

          {/* Text mode: Letter Height */}
          {type === "text" && (
            <Section label={t("vl.letterHeight")}>
              <div className="flex flex-wrap gap-2">
                {LETTER_HEIGHTS.map((h) => (
                  <Chip key={h.id} active={heightId === h.id} onClick={() => setHeightId(h.id)}>
                    {h.label}
                  </Chip>
                ))}
              </div>
            </Section>
          )}

          {/* Logo mode: Dimensions */}
          {type === "logo" && (
            <Section label={t("vl.logo.dimensions")}>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="mb-1 block text-xs text-gray-500">{t("vl.logo.width")}</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0.5"
                      max="53"
                      step="0.5"
                      value={logoWidth}
                      onChange={(e) => setLogoWidth(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                    />
                    <span className="text-sm text-gray-500">in</span>
                  </div>
                </div>
                <span className="mt-5 text-gray-400">×</span>
                <div className="flex-1">
                  <label className="mb-1 block text-xs text-gray-500">{t("vl.logo.height")}</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0.5"
                      max="53"
                      step="0.5"
                      value={logoHeight}
                      onChange={(e) => setLogoHeight(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                    />
                    <span className="text-sm text-gray-500">in</span>
                  </div>
                </div>
              </div>
              <p className="mt-1.5 text-xs text-gray-500">{t("vl.logo.dimensionsHint")}</p>
            </Section>
          )}

          {/* Color — hide for printed vinyl logo mode */}
          {!(type === "logo" && logoMode === "printed") && (
            <Section label={t("vl.color.label")}>
              <div className="flex flex-wrap gap-3">
                {availableColors.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setColor(c.id)}
                    className={`flex items-center gap-2 rounded-full border-2 px-4 py-2 text-sm font-medium transition-all ${
                      color === c.id
                        ? "border-gray-900 bg-gray-50 shadow-sm"
                        : "border-gray-200 bg-white hover:border-gray-400"
                    }`}
                  >
                    <span
                      className="inline-block h-4 w-4 rounded-full border border-gray-200"
                      style={{ backgroundColor: c.hex }}
                    />
                    {t(`vl.color.${c.id}`)}
                    {c.surcharge > 0 && (
                      <span className="ml-1 text-[11px] opacity-70">+{formatCad(c.surcharge)}/ea</span>
                    )}
                  </button>
                ))}
              </div>
            </Section>
          )}

          {/* Material */}
          <Section label={t("vl.material.label")}>
            <div className="flex flex-wrap gap-2">
              {MATERIALS.map((m) => (
                <Chip key={m.id} active={material === m.id} onClick={() => setMaterial(m.id)}>
                  {t(`vl.material.${m.id}`)}
                  {m.surcharge > 0 && (
                    <span className="ml-1 text-[11px] opacity-70">+{formatCad(m.surcharge)}/ea</span>
                  )}
                </Chip>
              ))}
            </div>
          </Section>

          {/* Application */}
          <Section label={t("vl.application.label")}>
            <div className="flex flex-wrap gap-2">
              {APPLICATIONS.map((a) => (
                <Chip key={a.id} active={application === a.id} onClick={() => setApplication(a.id)}>
                  {t(`vl.application.${a.id}`)}
                </Chip>
              ))}
            </div>
          </Section>

          {/* Quantity */}
          <Section label={t("vl.quantity")}>
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
              <label className="text-xs text-gray-500">{t("vl.customQty")}:</label>
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

          {/* Turnaround */}
          <Section label={t("vl.turnaround.label")}>
            <div className="flex gap-2">
              {TURNAROUND_OPTIONS.map((opt) => {
                const isActive = turnaroundId === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setTurnaroundId(opt.id)}
                    className={`flex-1 rounded-lg border-2 px-3 py-2 text-center transition-all ${
                      isActive ? "border-gray-900 bg-gray-900 text-[#fff]" : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
                    }`}
                  >
                    <span className="block text-xs font-bold">{t(`vl.turnaround.${opt.id}`)}</span>
                    <span className={`block text-[10px] ${isActive ? "text-gray-300" : "text-gray-400"}`}>
                      {t(`vl.turnaround.${opt.id}Desc`)}
                      {opt.id === "rush" && <span className="ml-1 font-bold text-amber-400">{t("vl.turnaround.rushSurcharge")}</span>}
                    </span>
                  </button>
                );
              })}
            </div>
          </Section>

          {/* Artwork Upload */}
          <Section label={t("vl.artwork")} optional>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <p className="mb-3 text-xs text-gray-600">{t("vl.uploadHint")}</p>
              {uploadedFile ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-800">{uploadedFile.name}</span>
                  <button
                    type="button"
                    onClick={() => setUploadedFile(null)}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    {t("vl.remove")}
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
            <h2 className="text-base font-bold text-gray-900">{t("vl.summary")}</h2>

            <dl className="space-y-2 text-sm">
              <Row label={t("vl.type.label")} value={type === "text" ? t("vl.type.text") : t("vl.type.logo")} />
              {type === "logo" && (
                <Row label="Mode" value={logoMode === "printed" ? t("vl.logo.printedVinyl") : t("vl.logo.cutVinyl")} />
              )}
              {type === "text" && (
                <>
                  <Row label={t("vl.letterHeight")} value={letterHeight.label} />
                  <Row label={t("vl.font.label")} value={selectedFont.label} />
                </>
              )}
              {type === "text" && letteringText.trim() && (
                <Row label={t("vl.textInput")} value={`"${letteringText.trim().slice(0, 20)}${letteringText.trim().length > 20 ? "…" : ""}"`} />
              )}
              {type === "logo" && (
                <Row label={t("vl.logo.dimensions")} value={`${parsedLogoW}" × ${parsedLogoH}"`} />
              )}
              {!(type === "logo" && logoMode === "printed") && (
                <Row
                  label={t("vl.color.label")}
                  value={
                    <span className="flex items-center gap-1.5">
                      <span
                        className="inline-block h-3 w-3 rounded-full border border-gray-200"
                        style={{ backgroundColor: COLORS.find((c) => c.id === color)?.hex }}
                      />
                      {t(`vl.color.${color}`)}
                    </span>
                  }
                />
              )}
              <Row label={t("vl.material.label")} value={t(`vl.material.${material}`)} />
              <Row label={t("vl.application.label")} value={t(`vl.application.${application}`)} />
              <Row label={t("vl.turnaround.label")} value={t(`vl.turnaround.${turnaroundId}`)} />
              <Row label={t("vl.quantity")} value={activeQty > 0 ? activeQty.toLocaleString() : "\u2014"} />
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
                <Row label={t("vl.basePrice")} value={formatCad(subtotalCents)} />
                {colorSurcharge > 0 && (
                  <Row label={t(`vl.color.${color}`)} value={`+ ${formatCad(colorSurcharge)}`} />
                )}
                {materialSurcharge > 0 && (
                  <Row label={t(`vl.material.${material}`)} value={`+ ${formatCad(materialSurcharge)}`} />
                )}
                {printedVinylSurcharge > 0 && (
                  <Row label="Full color print" value={`+ ${formatCad(printedVinylSurcharge)}`} />
                )}
                {turnaroundId === "rush" && (
                  <Row label="Rush surcharge" value="+50%" />
                )}
                <Row label={t("vl.subtotal")} value={formatCad(adjustedSubtotal)} />
                <div className="flex justify-between border-t border-gray-100 pt-2">
                  <dt className="font-semibold text-gray-900">{t("vl.total")}</dt>
                  <dd className="text-lg font-bold text-gray-900">{formatCad(totalCents)}</dd>
                </div>
                {activeQty > 1 && (
                  <div className="pt-1">
                    <p className="text-[11px] text-gray-400">
                      {formatCad(Math.round(adjustedSubtotal / activeQty))}/{t("vl.each")}
                    </p>
                  </div>
                )}
              </dl>
            ) : (
              <p className="text-xs text-gray-400">{t("vl.selectOptions")}</p>
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
                {t("vl.addToCart")}
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
                {buyNowLoading ? t("vl.processing") : t("vl.buyNow")}
              </button>
            </div>

            <div className="flex items-center justify-center gap-4 pt-2 text-[11px] text-gray-400">
              <span>{t("vl.badge.outdoor")}</span>
              <span className="text-gray-300">|</span>
              <span>{t("vl.badge.shipping")}</span>
            </div>
          </div>
        </aside>
      </div>

      {/* ── Product Content ── */}
      <div className="mt-16 space-y-12">
        <section>
          <h2 className="text-xl font-bold text-gray-900">About Vinyl Lettering & Decals</h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-gray-600">
            Custom vinyl lettering is precision-cut from premium outdoor-grade vinyl film, producing
            crisp, paint-like text for storefronts, vehicles, boats, and interior decor. Each character
            is individually cut and weeded — no background, no border — just clean letters that bond
            directly to glass, metal, plastic, or painted surfaces. Our lettering is rated for 5–8 years
            outdoors and is removable without residue.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900">Specifications</h2>
          <div className="mt-4 overflow-hidden rounded-xl border border-gray-200">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-gray-100">
                {[
                  ["Material", "Premium calendered or cast vinyl (Oracal / Avery)"],
                  ["Adhesive", "Permanent pressure-sensitive, repositionable for 10 min"],
                  ["Durability", "5–8 years outdoor, 10+ years indoor"],
                  ["Sizes", '1″ to 12″ letter height; custom sizes available'],
                  ["Colors", "12 standard + 50 more on request"],
                  ["Finish", "Gloss, Matte, or Reflective"],
                  ["Turnaround", "1–2 business days standard, same day rush"],
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
          <h2 className="text-lg font-bold text-gray-900">Popular Uses</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { title: "Storefronts", desc: "Window hours, business names, address numbers — professional look at a fraction of sign cost." },
              { title: "Vehicles", desc: "Company name, phone, and website on trucks, vans, and trailers — DOT & CVOR compliant." },
              { title: "Boats & Watercraft", desc: "Registration numbers, vessel names, and hailing ports in marine-grade vinyl." },
              { title: "Interior Decor", desc: "Wall quotes, office branding, room labels — easy to apply and remove without damage." },
            ].map((uc) => (
              <div key={uc.title} className="rounded-xl border border-gray-200 bg-white p-4">
                <h3 className="text-sm font-semibold text-gray-900">{uc.title}</h3>
                <p className="mt-1 text-xs text-gray-500 leading-relaxed">{uc.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900">FAQ</h2>
          <div className="mt-4 divide-y divide-gray-200 rounded-xl border border-gray-200">
            {[
              { q: "How do I apply vinyl lettering?", a: "Clean the surface with rubbing alcohol, peel the backing, position using the transfer tape, squeegee from center out, then peel the transfer tape at a sharp angle. Full instructions are included with every order." },
              { q: "Can vinyl lettering go on a textured wall?", a: "Vinyl adheres best to smooth, non-porous surfaces. For lightly textured walls we recommend our cast vinyl upgrade. Heavily textured surfaces like stucco or brick are not recommended." },
              { q: "How long does vinyl lettering last outdoors?", a: "Standard calendered vinyl lasts 5–7 years. Our cast vinyl option lasts 8–10 years. Reflective vinyl lasts 5+ years. All ratings assume vertical application." },
              { q: "Can I remove the lettering later?", a: "Yes. Heat the letters with a hair dryer and peel slowly. Any residue can be removed with Goo Gone or rubbing alcohol. There is no paint damage on factory finishes." },
              { q: "Do you offer custom fonts and logos?", a: "Absolutely. Upload your own vector artwork or describe the font style you want. We have 500+ fonts available and can match any brand guideline." },
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
                  {activeQty} × {type === "text" ? `${letterHeight.label} ` : `${parsedLogoW}" × ${parsedLogoH}" `}{!(type === "logo" && logoMode === "printed") && t(`vl.color.${color}`)}
                </p>
              </>
            ) : (
              <p className="text-sm text-gray-400">{t("vl.selectOptions")}</p>
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
            {t("vl.addToCart")}
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
