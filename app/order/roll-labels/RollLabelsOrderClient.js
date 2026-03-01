"use client";

import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import {
  ConfigStep,
  ConfigHero,
  ConfigProductGallery,
  PricingSidebar,
  MobileBottomBar,
  ArtworkUpload,
  TemplateDownloadButton,
} from "@/components/configurator";
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
  const { t } = useTranslation();
  const addToCart = useCartStore((s) => s.addToCart);

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

  // ─── Radio helper ─────────────────────────────────────────────────────────
  const RadioGroup = ({ options, value, onChange, cols = 3 }) => (
    <div className={`grid gap-2 ${cols === 5 ? "grid-cols-5" : cols === 4 ? "grid-cols-4" : cols === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          onClick={() => onChange(opt.id)}
          className={`rounded-lg border-2 px-3 py-2.5 text-center text-sm font-medium transition-all ${
            value === opt.id
              ? "border-[var(--color-brand)] bg-[var(--color-brand)]/5 text-[var(--color-brand)]"
              : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
          }`}
        >
          {opt.icon && <span className="mr-1">{opt.icon}</span>}
          {opt.label}
        </button>
      ))}
    </div>
  );

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
          <div className="space-y-6 lg:col-span-2">

            {/* STEP 1: Label Type */}
            <ConfigStep number={1} title={t?.("rl.step.type") || "Label Type"}>
              <div className="grid gap-3 sm:grid-cols-3">
                {LABEL_TYPES.map((lt) => (
                  <button
                    key={lt.id}
                    type="button"
                    onClick={() => handleTypeChange(lt.id)}
                    className={`rounded-xl border-2 p-4 text-left transition-all ${
                      typeId === lt.id
                        ? "border-[var(--color-brand)] bg-[var(--color-brand)]/5 shadow-sm"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >
                    <span className="text-sm font-bold text-gray-900">{lt.label}</span>
                    <p className="mt-1 text-xs text-gray-500">{lt.desc}</p>
                  </button>
                ))}
              </div>
            </ConfigStep>

            {/* STEP 2: Shape */}
            <ConfigStep number={2} title={t?.("rl.step.shape") || "Shape"}>
              <RadioGroup options={SHAPES} value={shapeId} onChange={setShapeId} cols={5} />
            </ConfigStep>

            {/* STEP 3: Size */}
            <ConfigStep number={3} title={t?.("rl.step.size") || "Size (inches)"}>
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
                    className="w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[var(--color-brand)] focus:ring-1 focus:ring-[var(--color-brand)]"
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
                      className="w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[var(--color-brand)] focus:ring-1 focus:ring-[var(--color-brand)]"
                    />
                    <span className="ml-1 text-xs text-gray-400">in</span>
                  </div>
                )}
              </div>
            </ConfigStep>

            {/* Template Download */}
            {dim1 > 0 && (
              <TemplateDownloadButton
                width={dim1}
                height={shape.inputs.includes("height") ? dim2 : dim1}
                bleed={0.125}
                unit="in"
                dpi={300}
                product="Roll Labels"
                slug="roll-labels"
              />
            )}

            {/* STEP 4: Stock */}
            <ConfigStep number={4} title={t?.("rl.step.stock") || "Stock / Material"}>
              <RadioGroup
                options={stocks}
                value={stockId}
                onChange={(id) => {
                  setStockId(id);
                  // Reset ink when switching to/from clear (different ink options)
                  const newInkKey = WHITE_INK_STOCKS.includes(id) ? `${typeId}_clear` : typeId;
                  const newInks = INK_COLORS[newInkKey] || INK_COLORS[typeId] || [];
                  const defInk = newInks.find((i) => i.default) || newInks[0];
                  if (defInk) setInkId(defInk.id);
                }}
                cols={stocks.length <= 4 ? 2 : 3}
              />
            </ConfigStep>

            {/* STEP 5: Quantity */}
            <ConfigStep number={5} title={t?.("rl.step.qty") || "Quantity"}>
              <div className="flex flex-wrap gap-2">
                {QUANTITIES.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setQty(q)}
                    className={`rounded-lg border-2 px-3 py-2 text-sm font-medium transition-all ${
                      qty === q
                        ? "border-[var(--color-brand)] bg-[var(--color-brand)]/5 text-[var(--color-brand)]"
                        : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    {q.toLocaleString()}
                  </button>
                ))}
              </div>
            </ConfigStep>

            {/* STEP 6: Ink Colour */}
            {inks.length > 1 && (
              <ConfigStep number={6} title={t?.("rl.step.ink") || "Ink Colour"}>
                <RadioGroup options={inks} value={inkId} onChange={setInkId} cols={2} />
              </ConfigStep>
            )}

            {/* STEP 7: Finishing */}
            <ConfigStep number={inks.length > 1 ? 7 : 6} title={t?.("rl.step.finishing") || "Finishing"}>
              <RadioGroup options={FINISHINGS} value={finishId} onChange={setFinishId} cols={2} />
            </ConfigStep>

            {/* STEP 8: Wind Direction */}
            <ConfigStep number={inks.length > 1 ? 8 : 7} title={t?.("rl.step.wind") || "Wind Direction"}>
              <RadioGroup options={WIND_DIRECTIONS} value={windId} onChange={setWindId} cols={5} />
            </ConfigStep>

            {/* STEP 9: Labels Per Roll */}
            <ConfigStep number={inks.length > 1 ? 9 : 8} title={t?.("rl.step.perRoll") || "Labels Per Roll"}>
              <RadioGroup options={LABELS_PER_ROLL} value={labelsPerRoll} onChange={setLabelsPerRoll} cols={5} />
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
                    className="w-32 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[var(--color-brand)] focus:ring-1 focus:ring-[var(--color-brand)]"
                  />
                </div>
              )}
            </ConfigStep>

            {/* STEP 10: Perforation + Food Use */}
            <ConfigStep number={inks.length > 1 ? 10 : 9} title={t?.("rl.step.options") || "Additional Options"}>
              <div className="space-y-3">
                <label className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 cursor-pointer hover:border-gray-300">
                  <input
                    type="checkbox"
                    checked={perforation}
                    onChange={(e) => setPerforation(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-[var(--color-brand)]"
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
                            ? "border-[var(--color-brand)] bg-[var(--color-brand)]/5 text-[var(--color-brand)]"
                            : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                        }`}
                      >
                        {val ? (t?.("rl.yes") || "Yes") : (t?.("rl.no") || "No")}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </ConfigStep>

            {/* STEP 11: Turnaround */}
            <ConfigStep number={inks.length > 1 ? 11 : 10} title={t?.("rl.step.turnaround") || "Turnaround"}>
              <div className="space-y-2">
                {TURNAROUNDS.map((ta) => (
                  <button
                    key={ta.id}
                    type="button"
                    onClick={() => setTurnaroundId(ta.id)}
                    className={`w-full rounded-lg border-2 px-4 py-3 text-left transition-all ${
                      turnaroundId === ta.id
                        ? "border-[var(--color-brand)] bg-[var(--color-brand)]/5"
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
            </ConfigStep>

            {/* STEP 12: Artwork Upload */}
            <ConfigStep number={inks.length > 1 ? 12 : 11} title={t?.("rl.step.artwork") || "Upload Artwork"}>
              <ArtworkUpload
                uploadedFile={uploadedFile}
                onFileChange={setUploadedFile}
                hint={t?.("rl.uploadHint") || "Upload your print-ready file (PDF, AI, PNG, JPG). You can also send it later."}
              />
            </ConfigStep>
          </div>

          {/* RIGHT COLUMN — Pricing Sidebar */}
          <div className="hidden lg:block">
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
            />
          </div>
        </div>
      </div>

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
      />
    </main>
  );
}
