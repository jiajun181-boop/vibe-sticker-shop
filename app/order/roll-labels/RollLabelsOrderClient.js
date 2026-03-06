"use client";

import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import {
  StepCard,
  OptionCard,
  OptionGrid,
  useStepScroll,
  ConfigHero,
  ConfigProductGallery,
  PricingSidebar,
  MobileBottomBar,
  ArtworkUpload,
} from "@/components/configurator";
import FaqAccordion from "@/components/sticker-product/FaqAccordion";
import { getConfiguratorFaqs } from "@/lib/configurator-faqs";
import DeliveryEstimate from "@/components/configurator/DeliveryEstimate";
import { useCartStore } from "@/lib/store";
import {
  LABEL_TYPES,
  SHAPES,
  STOCKS,
  INK_COLORS,
  WHITE_INK_STOCKS,
  QUANTITIES,
  FINISHINGS,
  WIND_DIRECTIONS,
  LABELS_PER_ROLL,
  TURNAROUNDS,
  calculateRollLabelPrice,
} from "@/lib/roll-labels-config";

const HST_RATE = 0.13;

const formatCad = (cents) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);

export default function RollLabelsOrderClient({ productImages = [] }) {
  const { t, locale } = useTranslation();
  const addToCart = useCartStore((s) => s.addItem);

  // ─── State ────────────────────────────────────────────────────────────────
  const [typeId, setTypeId] = useState("bopp");
  const [shapeId, setShapeId] = useState("circle");
  const [dim1, setDim1] = useState(2); // diameter or width
  const [dim2, setDim2] = useState(2); // height (for oval/rect/custom)
  const [stockId, setStockId] = useState("white-gloss-permanent");
  const [qty, setQty] = useState(250);
  const [inkId, setInkId] = useState("cmyk");
  const [finishId, setFinishId] = useState("matte-lam");
  const [windId, setWindId] = useState("any");
  const [labelsPerRoll, setLabelsPerRoll] = useState("any");
  const [customPerRoll, setCustomPerRoll] = useState(100);
  const [perforation, setPerforation] = useState(false);
  const [foodUse, setFoodUse] = useState(false);
  const [turnaroundId, setTurnaroundId] = useState("standard");
  const [uploadedFile, setUploadedFile] = useState(null);
  const [buyNowLoading, setBuyNowLoading] = useState(false);

  // ─── Derived ──────────────────────────────────────────────────────────────
  const shape = SHAPES.find((s) => s.id === shapeId) || SHAPES[0];
  const stocks = STOCKS[typeId] || [];
  // Use white ink options when stock is transparent (e.g. clear BOPP)
  const inkKey = WHITE_INK_STOCKS.includes(stockId) ? `${typeId}_clear` : typeId;
  const inks = INK_COLORS[inkKey] || INK_COLORS[typeId] || [];
  const turnaround = TURNAROUNDS.find((t) => t.id === turnaroundId) || TURNAROUNDS[0];

  // Reset stock/ink when type changes
  const handleTypeChange = useCallback((id) => {
    setTypeId(id);
    const newStocks = STOCKS[id] || [];
    const defStock = newStocks.find((s) => s.default) || newStocks[0];
    if (defStock) setStockId(defStock.id);
    const newInks = INK_COLORS[id] || [];
    const defInk = newInks.find((i) => i.default) || newInks[0];
    if (defInk) setInkId(defInk.id);
  }, []);

  // ─── Pricing ──────────────────────────────────────────────────────────────
  const quote = useMemo(() => {
    if (dim1 <= 0 || qty <= 0) return null;
    return calculateRollLabelPrice({
      type: typeId,
      shape: shapeId,
      dim1,
      dim2: shape.inputs.includes("height") ? dim2 : dim1,
      qty,
      turnaroundMultiplier: turnaround.multiplier,
    });
  }, [typeId, shapeId, dim1, dim2, qty, turnaround.multiplier, shape.inputs]);

  const subtotalCents = quote?.subtotalCents || 0;
  const taxCents = Math.round(subtotalCents * HST_RATE);
  const totalCents = subtotalCents + taxCents;
  const unitCents = quote?.unitCents || 0;
  const canAddToCart = subtotalCents > 0 && dim1 > 0;

  // ─── Summary Lines ────────────────────────────────────────────────────────
  const summaryLines = useMemo(() => {
    const lines = [];
    const typeDef = LABEL_TYPES.find((t) => t.id === typeId);
    if (typeDef) lines.push({ label: t?.("rl.type") || "Type", value: typeDef.label });
    lines.push({ label: t?.("rl.shape") || "Shape", value: shape.label });

    const sizeStr = shape.inputs.includes("height")
      ? `${dim1}" × ${dim2}"`
      : shape.id === "circle" ? `${dim1}" diameter` : `${dim1}"`;
    lines.push({ label: t?.("rl.size") || "Size", value: sizeStr });

    const stock = stocks.find((s) => s.id === stockId);
    if (stock) lines.push({ label: t?.("rl.stock") || "Stock", value: stock.label });

    const ink = inks.find((i) => i.id === inkId);
    if (ink) lines.push({ label: t?.("rl.ink") || "Ink", value: ink.label });

    const finish = FINISHINGS.find((f) => f.id === finishId);
    if (finish) lines.push({ label: t?.("rl.finishing") || "Finishing", value: finish.label });

    if (turnaroundId !== "standard") {
      lines.push({ label: t?.("rl.turnaround") || "Turnaround", value: turnaround.label });
    }
    return lines;
  }, [typeId, shapeId, dim1, dim2, stockId, inkId, finishId, turnaroundId, shape, stocks, inks, turnaround, t]);

  // ─── Cart ─────────────────────────────────────────────────────────────────
  const buildCartItem = useCallback(() => {
    const sizeStr = shape.inputs.includes("height")
      ? `${dim1}" × ${dim2}"`
      : shape.id === "circle" ? `${dim1}" dia` : `${dim1}"`;

    return {
      id: `roll-labels-${typeId}-${Date.now()}`,
      name: `Roll Labels — ${LABEL_TYPES.find((t) => t.id === typeId)?.label || typeId}`,
      slug: "roll-labels",
      price: subtotalCents,
      quantity: 1,
      image: null,
      options: {
        printQuantity: qty,
        labelType: typeId,
        shape: shapeId,
        size: sizeStr,
        stock: stockId,
        ink: inkId,
        finishing: finishId,
        wind: windId,
        labelsPerRoll: labelsPerRoll === "custom" ? String(customPerRoll) : labelsPerRoll,
        perforation,
        foodUse,
        turnaround: turnaroundId,
      },
      artworkUrl: uploadedFile?.url || null,
      forceNewLine: true,
    };
  }, [typeId, shapeId, dim1, dim2, qty, stockId, inkId, finishId, windId, labelsPerRoll, customPerRoll, perforation, foodUse, turnaroundId, subtotalCents, uploadedFile, shape]);

  const handleAddToCart = useCallback(() => {
    addToCart(buildCartItem());
  }, [addToCart, buildCartItem]);

  const handleBuyNow = useCallback(async () => {
    setBuyNowLoading(true);
    addToCart(buildCartItem());
    window.location.href = "/cart";
  }, [addToCart, buildCartItem]);

  // ─── Accordion state ───────────────────────────────────────────────────────
  const [activeStepId, setActiveStepId] = useState("step-type");
  const visibleSteps = useMemo(() => {
    const defs = [
      { id: "type", vis: true },
      { id: "shape", vis: true },
      { id: "size", vis: true },
      { id: "stock", vis: true },
      { id: "quantity", vis: true },
      { id: "ink", vis: inks.length > 1 },
      { id: "finishing", vis: true },
      { id: "wind", vis: true },
      { id: "perRoll", vis: true },
      { id: "options", vis: true },
      { id: "turnaround", vis: true },
      { id: "artwork", vis: true },
    ];
    let n = 0;
    return defs.map((d) => ({ ...d, num: d.vis ? ++n : 0 }));
  }, [inks.length]);
  const stepNumFn = (id) => visibleSteps.find((s) => s.id === id)?.num || 0;
  const stepIds = visibleSteps.filter((s) => s.vis).map((s) => "step-" + s.id);
  const advanceStep = useStepScroll(stepIds, setActiveStepId);
  const isStepOpen = (id) => activeStepId === "step-" + id;
  const toggleStep = (id) => setActiveStepId((prev) => (prev === "step-" + id ? null : "step-" + id));

  const typeSummary = LABEL_TYPES.find((lt) => lt.id === typeId)?.label || typeId;
  const shapeSummary = shape.label;
  const sizeSummary = shape.inputs.includes("height") ? `${dim1}" × ${dim2}"` : shape.id === "circle" ? `${dim1}" dia` : `${dim1}"`;
  const stockSummary = stocks.find((s) => s.id === stockId)?.label || stockId;
  const quantitySummaryText = `${qty.toLocaleString()} labels`;
  const inkSummary = inks.find((i) => i.id === inkId)?.label || inkId;
  const finishingSummaryText = FINISHINGS.find((f) => f.id === finishId)?.label || finishId;
  const windSummary = WIND_DIRECTIONS.find((w) => w.id === windId)?.label || windId;
  const perRollSummary = labelsPerRoll === "custom" ? `${customPerRoll}/roll` : LABELS_PER_ROLL.find((l) => l.id === labelsPerRoll)?.label || labelsPerRoll;
  const turnaroundSummary = turnaround.label;
  const artworkSummary = uploadedFile?.name || "Not uploaded yet";

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-[var(--color-gray-50)]">
      <ConfigHero
        breadcrumbs={[
          { label: t?.("nav.shop") || "Shop", href: "/shop" },
          { label: t?.("rl.breadcrumb") || "Stickers & Labels", href: "/shop/stickers-labels-decals" },
          { label: t?.("rl.order") || "Roll Labels" },
        ]}
        title={t?.("rl.title") || "Custom Roll Labels"}
        subtitle="BOPP, Paper & Poly — full colour, any shape, any size"
        badges={[
          t?.("rl.badge.fullColor") || "Full Colour CMYK",
          t?.("rl.badge.shipping") || "Free Shipping $99+",
          t?.("rl.badge.proof") || "Free Digital Proof",
        ]}
      />
      <ConfigProductGallery images={productImages} />

      <div className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-3 lg:gap-8">
          {/* LEFT COLUMN — Steps */}
          <div className="space-y-3 lg:col-span-2">

            {/* STEP 1: Label Type */}
            <StepCard
              stepNumber={stepNumFn("type")}
              title={t?.("rl.step.type") || "Label Type"}
              hint="Choose the label material technology"
              summaryText={typeSummary}
              open={isStepOpen("type")}
              onToggle={() => toggleStep("type")}
              stepId="step-type"
            >
              <OptionGrid columns={3}>
                {LABEL_TYPES.map((lt) => (
                  <OptionCard
                    key={lt.id}
                    label={lt.label}
                    description={lt.desc}
                    selected={typeId === lt.id}
                    onSelect={() => { handleTypeChange(lt.id); advanceStep("step-type"); }}
                  />
                ))}
              </OptionGrid>
            </StepCard>

            {/* STEP 2: Shape */}
            <StepCard
              stepNumber={stepNumFn("shape")}
              title={t?.("rl.step.shape") || "Shape"}
              hint="Select the die-cut shape for your labels"
              summaryText={shapeSummary}
              open={isStepOpen("shape")}
              onToggle={() => toggleStep("shape")}
              stepId="step-shape"
              alwaysOpen
            >
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
                {SHAPES.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => { setShapeId(s.id); advanceStep("step-shape"); }}
                    className={`group flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all ${
                      shapeId === s.id
                        ? "border-teal-500 bg-teal-50 shadow-sm"
                        : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
                    }`}
                  >
                    <svg viewBox="0 0 48 48" className="h-10 w-10" fill="none">
                      {s.id === "circle" && (
                        <circle cx="24" cy="24" r="18" className={shapeId === s.id ? "stroke-teal-500" : "stroke-gray-400 group-hover:stroke-gray-600"} strokeWidth="2.5" strokeDasharray={s.id === "custom" ? "4 3" : "none"} />
                      )}
                      {s.id === "oval" && (
                        <ellipse cx="24" cy="24" rx="20" ry="14" className={shapeId === s.id ? "stroke-teal-500" : "stroke-gray-400 group-hover:stroke-gray-600"} strokeWidth="2.5" />
                      )}
                      {s.id === "square" && (
                        <rect x="7" y="7" width="34" height="34" rx="3" className={shapeId === s.id ? "stroke-teal-500" : "stroke-gray-400 group-hover:stroke-gray-600"} strokeWidth="2.5" />
                      )}
                      {s.id === "rectangle" && (
                        <rect x="4" y="11" width="40" height="26" rx="3" className={shapeId === s.id ? "stroke-teal-500" : "stroke-gray-400 group-hover:stroke-gray-600"} strokeWidth="2.5" />
                      )}
                      {s.id === "custom" && (
                        <path d="M24 4 L42 16 L38 38 L10 38 L6 16 Z" className={shapeId === s.id ? "stroke-teal-500" : "stroke-gray-400 group-hover:stroke-gray-600"} strokeWidth="2.5" strokeDasharray="4 3" />
                      )}
                    </svg>
                    <span className={`text-xs font-semibold ${shapeId === s.id ? "text-teal-600" : "text-gray-600"}`}>
                      {s.label}
                    </span>
                  </button>
                ))}
              </div>
            </StepCard>

            {/* STEP 3: Size */}
            <StepCard
              stepNumber={stepNumFn("size")}
              title={t?.("rl.step.size") || "Size (inches)"}
              hint="Enter dimensions for your labels"
              summaryText={sizeSummary}
              open={isStepOpen("size")}
              onToggle={() => toggleStep("size")}
              stepId="step-size"
              alwaysOpen
            >
              <div className="flex flex-wrap items-end gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">
                    {shape.id === "circle" ? "Diameter" : "Width"}
                  </label>
                  <input
                    type="number"
                    min="0.5"
                    max="12"
                    step="0.25"
                    value={dim1}
                    onChange={(e) => setDim1(Math.max(0.5, Number(e.target.value)))}
                    className="w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                  />
                  <span className="ml-1 text-xs text-gray-400">in</span>
                </div>
                {shape.inputs.includes("height") && (
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">
                      {shape.id === "oval" ? "Height" : "Length"}
                    </label>
                    <input
                      type="number"
                      min="0.5"
                      max="12"
                      step="0.25"
                      value={dim2}
                      onChange={(e) => setDim2(Math.max(0.5, Number(e.target.value)))}
                      className="w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                    />
                    <span className="ml-1 text-xs text-gray-400">in</span>
                  </div>
                )}
              </div>
            </StepCard>

            {/* STEP 4: Stock */}
            <StepCard
              stepNumber={stepNumFn("stock")}
              title={t?.("rl.step.stock") || "Stock / Material"}
              hint="Choose your label stock material"
              summaryText={stockSummary}
              open={isStepOpen("stock")}
              onToggle={() => toggleStep("stock")}
              stepId="step-stock"
              alwaysOpen
            >
              <OptionGrid columns={stocks.length <= 4 ? 2 : 3}>
                {stocks.map((st) => (
                  <OptionCard
                    key={st.id}
                    label={st.label}
                    selected={stockId === st.id}
                    onSelect={() => {
                      setStockId(st.id);
                      // Reset ink when switching to/from clear (different ink options)
                      const newInkKey = WHITE_INK_STOCKS.includes(st.id) ? `${typeId}_clear` : typeId;
                      const newInks = INK_COLORS[newInkKey] || INK_COLORS[typeId] || [];
                      const defInk = newInks.find((i) => i.default) || newInks[0];
                      if (defInk) setInkId(defInk.id);
                      advanceStep("step-stock");
                    }}
                  />
                ))}
              </OptionGrid>
            </StepCard>

            {/* STEP 5: Quantity */}
            <StepCard
              stepNumber={stepNumFn("quantity")}
              title={t?.("rl.step.qty") || "Quantity"}
              hint="Select or enter your label quantity"
              summaryText={quantitySummaryText}
              open={isStepOpen("quantity")}
              onToggle={() => toggleStep("quantity")}
              stepId="step-quantity"
              alwaysOpen
            >
              <div className="flex flex-wrap gap-2">
                {QUANTITIES.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => { setQty(q); advanceStep("step-quantity"); }}
                    className={`rounded-lg border-2 px-3 py-2 text-sm font-medium transition-all ${
                      qty === q
                        ? "border-teal-500 bg-teal-50 text-gray-900"
                        : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    {q.toLocaleString()}
                  </button>
                ))}
              </div>
            </StepCard>

            {/* STEP 6: Ink Colour */}
            <StepCard
              stepNumber={stepNumFn("ink")}
              title={t?.("rl.step.ink") || "Ink Colour"}
              hint="Select ink colour mode"
              summaryText={inkSummary}
              visible={inks.length > 1}
              open={isStepOpen("ink")}
              onToggle={() => toggleStep("ink")}
              stepId="step-ink"
            >
              <OptionGrid columns={2}>
                {inks.map((ink) => (
                  <OptionCard
                    key={ink.id}
                    label={ink.label}
                    selected={inkId === ink.id}
                    onSelect={() => { setInkId(ink.id); advanceStep("step-ink"); }}
                  />
                ))}
              </OptionGrid>
            </StepCard>

            {/* STEP 7: Finishing */}
            <StepCard
              stepNumber={stepNumFn("finishing")}
              title={t?.("rl.step.finishing") || "Finishing"}
              hint="Choose the label surface finish"
              summaryText={finishingSummaryText}
              open={isStepOpen("finishing")}
              onToggle={() => toggleStep("finishing")}
              stepId="step-finishing"
            >
              <OptionGrid columns={2}>
                {FINISHINGS.map((f) => (
                  <OptionCard
                    key={f.id}
                    label={f.label}
                    selected={finishId === f.id}
                    onSelect={() => { setFinishId(f.id); advanceStep("step-finishing"); }}
                  />
                ))}
              </OptionGrid>
            </StepCard>

            {/* STEP 8: Wind Direction */}
            <StepCard
              stepNumber={stepNumFn("wind")}
              title={t?.("rl.step.wind") || "Unwind Direction"}
              hint="Select how labels unwind from the roll for your applicator"
              summaryText={windSummary}
              open={isStepOpen("wind")}
              onToggle={() => toggleStep("wind")}
              stepId="step-wind"
            >
              <p className="mb-3 text-xs text-gray-500">
                {t?.("rl.windHint") || "Select how labels unwind from the roll. This affects how labels feed into your applicator."}
              </p>
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
                {WIND_DIRECTIONS.map((wd) => (
                  <button
                    key={wd.id}
                    type="button"
                    onClick={() => { setWindId(wd.id); advanceStep("step-wind"); }}
                    className={`group flex flex-col items-center gap-2 rounded-xl border-2 p-3 transition-all ${
                      windId === wd.id
                        ? "border-teal-500 bg-teal-50 shadow-sm"
                        : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
                    }`}
                  >
                    <svg viewBox="0 0 64 64" className="h-14 w-14" fill="none">
                      {/* Roll body */}
                      <ellipse cx="32" cy="32" rx="10" ry="26" className="stroke-gray-300" strokeWidth="1.5" />
                      <ellipse cx="32" cy="32" rx="4" ry="26" className="fill-gray-100 stroke-gray-300" strokeWidth="1" />
                      {/* Label rectangle on the roll */}
                      <rect x="20" y="20" width="24" height="24" rx="2"
                        className={windId === wd.id ? "fill-teal-50 stroke-teal-500" : "fill-gray-100 stroke-gray-400 group-hover:stroke-gray-600"}
                        strokeWidth="1.5"
                      />
                      {/* "A" text in label */}
                      <text x="32" y="36" textAnchor="middle" className={windId === wd.id ? "fill-teal-600" : "fill-gray-500"} fontSize="12" fontWeight="bold">A</text>
                      {/* Direction arrow */}
                      {wd.id === "top" && (
                        <path d="M32 16 L32 4 M32 4 L27 9 M32 4 L37 9" className={windId === wd.id ? "stroke-teal-500" : "stroke-gray-500"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      )}
                      {wd.id === "bottom" && (
                        <path d="M32 48 L32 60 M32 60 L27 55 M32 60 L37 55" className={windId === wd.id ? "stroke-teal-500" : "stroke-gray-500"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      )}
                      {wd.id === "right" && (
                        <path d="M48 32 L60 32 M60 32 L55 27 M60 32 L55 37" className={windId === wd.id ? "stroke-teal-500" : "stroke-gray-500"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      )}
                      {wd.id === "left" && (
                        <path d="M16 32 L4 32 M4 32 L9 27 M4 32 L9 37" className={windId === wd.id ? "stroke-teal-500" : "stroke-gray-500"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      )}
                      {wd.id === "any" && (
                        <>
                          <path d="M32 16 L32 10 M32 10 L29 13 M32 10 L35 13" className={windId === wd.id ? "stroke-teal-500" : "stroke-gray-500"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M32 48 L32 54 M32 54 L29 51 M32 54 L35 51" className={windId === wd.id ? "stroke-teal-500" : "stroke-gray-500"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M48 32 L54 32 M54 32 L51 29 M54 32 L51 35" className={windId === wd.id ? "stroke-teal-500" : "stroke-gray-500"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M16 32 L10 32 M10 32 L13 29 M10 32 L13 35" className={windId === wd.id ? "stroke-teal-500" : "stroke-gray-500"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </>
                      )}
                    </svg>
                    <span className={`text-[11px] font-semibold leading-tight text-center ${windId === wd.id ? "text-teal-600" : "text-gray-600"}`}>
                      {wd.label}
                    </span>
                  </button>
                ))}
              </div>
            </StepCard>

            {/* STEP 9: Labels Per Roll */}
            <StepCard
              stepNumber={stepNumFn("perRoll")}
              title={t?.("rl.step.perRoll") || "Labels Per Roll"}
              hint="How many labels on each roll"
              summaryText={perRollSummary}
              open={isStepOpen("perRoll")}
              onToggle={() => toggleStep("perRoll")}
              stepId="step-perRoll"
            >
              <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-5">
                {LABELS_PER_ROLL.map((lpr) => (
                  <button
                    key={lpr.id}
                    type="button"
                    onClick={() => { setLabelsPerRoll(lpr.id); advanceStep("step-perRoll"); }}
                    className={`rounded-lg border-2 px-3 py-2.5 text-center text-sm font-medium transition-all ${
                      labelsPerRoll === lpr.id
                        ? "border-teal-500 bg-teal-50 text-gray-900"
                        : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    {lpr.label}
                  </button>
                ))}
              </div>
              {labelsPerRoll === "custom" && (
                <div className="mt-3">
                  <label className="mb-1 block text-xs font-medium text-gray-600">
                    {t?.("rl.customPerRoll") || "Enter number of labels per roll"}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10000"
                    step="1"
                    value={customPerRoll}
                    onChange={(e) => setCustomPerRoll(Math.max(1, Math.round(Number(e.target.value))))}
                    className="w-32 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              )}
            </StepCard>

            {/* STEP 10: Perforation + Food Use */}
            <StepCard
              stepNumber={stepNumFn("options")}
              title={t?.("rl.step.options") || "Additional Options"}
              hint="Perforation and food-use certification"
              summaryText={perforation ? "Perforation" : foodUse ? "Food use" : "None"}
              open={isStepOpen("options")}
              onToggle={() => toggleStep("options")}
              stepId="step-options"
            >
              <div className="space-y-3">
                <label className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 cursor-pointer hover:border-gray-300">
                  <input
                    type="checkbox"
                    checked={perforation}
                    onChange={(e) => setPerforation(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-teal-600"
                  />
                  <span className="text-sm font-medium text-gray-700">{t?.("rl.perforation") || "Perforation between labels"}</span>
                </label>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">
                    {t?.("rl.foodUse") || "Food use?"}
                    <span className="ml-1 text-red-500">*</span>
                  </label>
                  <div className="flex gap-3">
                    {[false, true].map((val) => (
                      <button
                        key={String(val)}
                        type="button"
                        onClick={() => setFoodUse(val)}
                        className={`rounded-lg border-2 px-6 py-2 text-sm font-medium transition-all ${
                          foodUse === val
                            ? "border-teal-500 bg-teal-50 text-gray-900"
                            : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                        }`}
                      >
                        {val ? (t?.("rl.yes") || "Yes") : (t?.("rl.no") || "No")}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </StepCard>

            {/* STEP 11: Turnaround */}
            <StepCard
              stepNumber={stepNumFn("turnaround")}
              title={t?.("rl.step.turnaround") || "Turnaround"}
              hint="Production speed — rush options available"
              summaryText={turnaroundSummary}
              open={isStepOpen("turnaround")}
              onToggle={() => toggleStep("turnaround")}
              stepId="step-turnaround"
              alwaysOpen
            >
              <div className="space-y-2">
                {TURNAROUNDS.map((ta) => (
                  <button
                    key={ta.id}
                    type="button"
                    onClick={() => { setTurnaroundId(ta.id); advanceStep("step-turnaround"); }}
                    className={`w-full rounded-lg border-2 px-4 py-3 text-left transition-all ${
                      turnaroundId === ta.id
                        ? "border-teal-500 bg-teal-50"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >
                    <span className="text-sm font-bold text-gray-900">{ta.label}</span>
                    {ta.multiplier > 1 && (
                      <span className="ml-2 text-xs text-amber-600">
                        +{Math.round((ta.multiplier - 1) * 100)}%
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </StepCard>

            {/* STEP 12: Artwork Upload */}
            <StepCard
              stepNumber={stepNumFn("artwork")}
              title={t?.("rl.step.artwork") || "Upload Artwork"}
              hint="Upload your print-ready file"
              summaryText={artworkSummary}
              open={isStepOpen("artwork")}
              onToggle={() => toggleStep("artwork")}
              stepId="step-artwork"
            >
              <ArtworkUpload
                uploadedFile={uploadedFile}
                onFileChange={setUploadedFile}
                hint={t?.("rl.uploadHint") || "Upload your print-ready file (PDF, AI, PNG, JPG). You can also send it later."}
              />
            </StepCard>
          </div>

          {/* RIGHT COLUMN — Pricing Sidebar */}
          <PricingSidebar
            summaryLines={summaryLines}
            quoteLoading={false}
            quoteError={null}
            unitCents={unitCents}
            subtotalCents={subtotalCents}
            taxCents={taxCents}
            totalCents={totalCents}
            quantity={qty}
            canAddToCart={canAddToCart}
            onAddToCart={handleAddToCart}
            onBuyNow={handleBuyNow}
            buyNowLoading={buyNowLoading}
            extraRows={[
              { label: t?.("rl.qty") || "Quantity", value: qty.toLocaleString() },
            ]}
            badges={[
              t?.("rl.badge.fullColor") || "Full Colour CMYK",
              t?.("rl.badge.shipping") || "Free Shipping $99+",
              t?.("rl.badge.proof") || "Free Digital Proof",
            ]}
            t={t}
            productName="Roll Labels"
            categorySlug="stickers-labels-decals"
            locale={locale}
          />
        </div>
      </div>

      {/* FAQ Section */}
      {(() => {
        const faqItems = getConfiguratorFaqs("roll-labels");
        if (!faqItems) return null;
        return (
          <div className="mx-auto max-w-4xl pb-16 pt-8">
            <FaqAccordion items={faqItems} />
          </div>
        );
      })()}

      {/* Inline mobile delivery estimate */}
      {subtotalCents > 0 && (
        <div className="mx-auto max-w-4xl px-4 pb-4 md:hidden">
          <DeliveryEstimate categorySlug="stickers-labels-decals" t={t} locale={locale} />
        </div>
      )}

      {/* Mobile Bottom Bar */}
      <MobileBottomBar
        quoteLoading={false}
        hasQuote={subtotalCents > 0}
        totalCents={subtotalCents}
        quantity={qty}
        summaryText={
          subtotalCents > 0
            ? `${formatCad(unitCents)}/ea × ${qty.toLocaleString()}`
            : null
        }
        canAddToCart={canAddToCart}
        onAddToCart={handleAddToCart}
        onBuyNow={handleBuyNow}
        productName="Roll Labels"
        summaryLines={summaryLines}
        unitCents={unitCents}
        subtotalCents={subtotalCents}
        t={t}
        categorySlug="stickers-labels-decals"
        locale={locale}
      />
    </main>
  );
}
