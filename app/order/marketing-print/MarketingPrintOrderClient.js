"use client";

import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import {
  PRINT_TYPES,
  getMarketingPrintType,
  FINISHING_LABELS,
} from "@/lib/marketing-print-order-config";
import {
  ConfigStep,
  ConfigHero,
  PricingSidebar,
  MobileBottomBar,
  ArtworkUpload,
  useConfiguratorQuote,
  useConfiguratorCart,
} from "@/components/configurator";

export default function MarketingPrintOrderClient({ defaultType }) {
  const { t } = useTranslation();

  // --- State ---
  const [typeId, setTypeId] = useState(defaultType || "business-cards");
  const printType = useMemo(() => getMarketingPrintType(typeId), [typeId]);

  const [sizeIdx, setSizeIdx] = useState(0);
  const [paperId, setPaperId] = useState(() => {
    const def = printType.papers.find((p) => p.default);
    return def ? def.id : printType.papers[0].id;
  });
  const [sides, setSides] = useState(printType.sides.includes("double") ? "double" : "single");
  const [finishing, setFinishing] = useState("none");
  const [quantity, setQuantity] = useState(printType.quantities[0] ?? 100);
  const [customQty, setCustomQty] = useState("");
  const [uploadedFile, setUploadedFile] = useState(null);

  // Reset dependent state when type changes
  const handleTypeChange = useCallback((newTypeId) => {
    setTypeId(newTypeId);
    const newType = getMarketingPrintType(newTypeId);
    setSizeIdx(0);
    const defPaper = newType.papers.find((p) => p.default);
    setPaperId(defPaper ? defPaper.id : newType.papers[0].id);
    setSides(newType.sides.includes("double") ? "double" : "single");
    setFinishing("none");
    setQuantity(newType.quantities[0] ?? 100);
    setCustomQty("");
  }, []);

  const selectedSize = printType.sizes[sizeIdx];
  const widthIn = selectedSize?.w ?? 3.5;
  const heightIn = selectedSize?.h ?? 2;
  const effectiveQty = customQty ? Math.max(1, parseInt(customQty) || 0) : quantity;

  // Build slug for quote API
  const quoteSlug = typeId;

  // --- Quote ---
  const { quoteData, quoteLoading, quoteError, unitCents, subtotalCents, taxCents, totalCents } =
    useConfiguratorQuote({
      slug: quoteSlug,
      quantity: effectiveQty,
      widthIn,
      heightIn,
      material: paperId,
      extra: {
        sizeLabel: selectedSize?.label,
        finishings: finishing !== "none" ? [finishing] : [],
        sides,
      },
      enabled: effectiveQty > 0,
    });

  // --- Cart ---
  const buildCartItem = useCallback(() => {
    if (effectiveQty <= 0) return null;
    return {
      id: quoteSlug,
      slug: quoteSlug,
      name: `${printType.label} — ${selectedSize?.label || "Custom"}`,
      price: unitCents || 0,
      quantity: effectiveQty,
      image: null,
      options: {
        width: widthIn,
        height: heightIn,
        material: paperId,
        sizeLabel: selectedSize?.label,
        sides,
        finishing,
      },
    };
  }, [effectiveQty, quoteSlug, printType, selectedSize, unitCents, widthIn, heightIn, paperId, sides, finishing]);

  const { handleAddToCart, handleBuyNow, buyNowLoading } = useConfiguratorCart({
    buildCartItem,
    successMessage: `${printType.label} added to cart!`,
  });

  // --- Render ---
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:flex lg:gap-8">
      {/* Left: Configurator Steps */}
      <div className="flex-1 space-y-6">
        <ConfigHero
          title={t("marketingPrint.title", "Marketing & Business Printing")}
          subtitle={t("marketingPrint.subtitle", "Business cards, flyers, postcards, brochures & more")}
        />

        {/* Step 1: Print Type */}
        <ConfigStep step={1} title={t("marketingPrint.type", "Product Type")}>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
            {PRINT_TYPES.map((pt) => (
              <button
                key={pt.id}
                onClick={() => handleTypeChange(pt.id)}
                className={`rounded-lg border-2 px-3 py-2 text-sm font-medium transition ${
                  typeId === pt.id
                    ? "border-gray-900 bg-gray-900 text-white"
                    : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
                }`}
              >
                {pt.label}
              </button>
            ))}
          </div>
        </ConfigStep>

        {/* Step 2: Size */}
        <ConfigStep step={2} title={t("marketingPrint.size", "Size")}>
          <div className="flex flex-wrap gap-2">
            {printType.sizes.map((s, idx) => (
              <button
                key={idx}
                onClick={() => setSizeIdx(idx)}
                className={`rounded-lg border-2 px-4 py-2 text-sm font-medium transition ${
                  sizeIdx === idx
                    ? "border-gray-900 bg-gray-900 text-white"
                    : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </ConfigStep>

        {/* Step 3: Paper / Stock */}
        <ConfigStep step={3} title={t("marketingPrint.paper", "Paper / Stock")}>
          <div className="flex flex-wrap gap-2">
            {printType.papers.map((p) => (
              <button
                key={p.id}
                onClick={() => setPaperId(p.id)}
                className={`rounded-lg border-2 px-4 py-2 text-sm font-medium transition ${
                  paperId === p.id
                    ? "border-gray-900 bg-gray-900 text-white"
                    : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </ConfigStep>

        {/* Step 4: Sides */}
        {printType.sides.length > 1 && (
          <ConfigStep step={4} title={t("marketingPrint.sides", "Print Sides")}>
            <div className="flex gap-2">
              <button
                onClick={() => setSides("single")}
                className={`rounded-lg border-2 px-4 py-2 text-sm font-medium transition ${
                  sides === "single"
                    ? "border-gray-900 bg-gray-900 text-white"
                    : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
                }`}
              >
                {t("marketingPrint.singleSided", "Single-Sided")}
              </button>
              <button
                onClick={() => setSides("double")}
                className={`rounded-lg border-2 px-4 py-2 text-sm font-medium transition ${
                  sides === "double"
                    ? "border-gray-900 bg-gray-900 text-white"
                    : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
                }`}
              >
                {t("marketingPrint.doubleSided", "Double-Sided")}
              </button>
            </div>
          </ConfigStep>
        )}

        {/* Step 5: Finishing */}
        <ConfigStep step={printType.sides.length > 1 ? 5 : 4} title={t("marketingPrint.finishing", "Finishing")}>
          <div className="flex flex-wrap gap-2">
            {printType.finishings.map((f) => (
              <button
                key={f}
                onClick={() => setFinishing(f)}
                className={`rounded-lg border-2 px-4 py-2 text-sm font-medium transition ${
                  finishing === f
                    ? "border-gray-900 bg-gray-900 text-white"
                    : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
                }`}
              >
                {FINISHING_LABELS[f] || f}
              </button>
            ))}
          </div>
        </ConfigStep>

        {/* Step 6: Quantity */}
        <ConfigStep step={printType.sides.length > 1 ? 6 : 5} title={t("marketingPrint.quantity", "Quantity")}>
          <div className="flex flex-wrap gap-2">
            {printType.quantities.map((q) => (
              <button
                key={q}
                onClick={() => { setQuantity(q); setCustomQty(""); }}
                className={`rounded-lg border-2 px-4 py-2 text-sm font-medium transition ${
                  quantity === q && !customQty
                    ? "border-gray-900 bg-gray-900 text-white"
                    : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
                }`}
              >
                {q.toLocaleString()}
              </button>
            ))}
            <input
              type="number"
              min={1}
              placeholder="Custom"
              value={customQty}
              onChange={(e) => setCustomQty(e.target.value)}
              className="w-24 rounded-lg border-2 border-gray-200 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
            />
          </div>
        </ConfigStep>

        {/* Step 7: Upload Artwork */}
        <ConfigStep step={printType.sides.length > 1 ? 7 : 6} title={t("marketingPrint.artwork", "Upload Artwork")}>
          <ArtworkUpload
            file={uploadedFile}
            onFileChange={setUploadedFile}
            accept=".pdf,.ai,.eps,.psd,.png,.jpg,.jpeg,.tiff,.svg"
          />
        </ConfigStep>
      </div>

      {/* Right: Pricing Sidebar */}
      <PricingSidebar
        productName={printType.label}
        specs={[
          { label: "Size", value: selectedSize?.label },
          { label: "Paper", value: printType.papers.find((p) => p.id === paperId)?.label },
          { label: "Sides", value: sides === "double" ? "Double-Sided" : "Single-Sided" },
          finishing !== "none" && { label: "Finishing", value: FINISHING_LABELS[finishing] },
          { label: "Quantity", value: effectiveQty.toLocaleString() },
        ].filter(Boolean)}
        unitCents={unitCents}
        subtotalCents={subtotalCents}
        taxCents={taxCents}
        totalCents={totalCents}
        loading={quoteLoading}
        error={quoteError}
        onAddToCart={handleAddToCart}
        onBuyNow={handleBuyNow}
        buyNowLoading={buyNowLoading}
      />

      {/* Mobile bottom bar */}
      <MobileBottomBar
        totalCents={totalCents}
        loading={quoteLoading}
        onAddToCart={handleAddToCart}
        onBuyNow={handleBuyNow}
        buyNowLoading={buyNowLoading}
      />
    </div>
  );
}
