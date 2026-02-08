"use client";

import { useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/lib/store";

// --- Constants ---
const HST_RATE = 0.13;
const PRESET_QUANTITIES = [50, 100, 250, 500, 1000];
const PRESET_SIZES = [
  { w: 2, h: 2, label: '2" x 2"' },
  { w: 3, h: 3, label: '3" x 3"' },
  { w: 4, h: 4, label: '4" x 4"' },
  { w: 5, h: 5, label: '5" x 5"' },
];

const cad = (cents) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);

// --- File specs helper ---
function getAcceptString(formats) {
  if (!formats || !Array.isArray(formats) || formats.length === 0) return undefined;
  const mimeMap = {
    ai: ".ai", eps: ".eps", pdf: ".pdf", svg: ".svg",
    tiff: ".tiff,.tif", jpg: ".jpg,.jpeg", png: ".png",
  };
  return formats.map((f) => mimeMap[f] || `.${f}`).join(",");
}

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ============================================================
export default function ProductClient({ product }) {
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openCart);

  const isPricePerSqft = product.pricingUnit === "per_sqft";

  // --- Form state ---
  const [width, setWidth] = useState(3);
  const [height, setHeight] = useState(3);
  const [quantity, setQuantity] = useState(50);
  const [isCustomSize, setIsCustomSize] = useState(false);
  const [isCustomQty, setIsCustomQty] = useState(false);

  // --- File state ---
  const [file, setFile] = useState(null);      // { name, size, type }
  const [fileUrl, setFileUrl] = useState("");   // object URL for preview
  const [addedToCart, setAddedToCart] = useState(false);

  // --- Dimension validation ---
  const dimErrors = useMemo(() => {
    if (!isPricePerSqft) return {};
    const errs = {};
    const w = Number(width);
    const h = Number(height);
    if (product.minWidthIn && w < product.minWidthIn)
      errs.width = `Min width is ${product.minWidthIn}"`;
    if (product.maxWidthIn && w > product.maxWidthIn)
      errs.width = `Max width is ${product.maxWidthIn}"`;
    if (product.minHeightIn && h < product.minHeightIn)
      errs.height = `Min height is ${product.minHeightIn}"`;
    if (product.maxHeightIn && h > product.maxHeightIn)
      errs.height = `Max height is ${product.maxHeightIn}"`;
    if (w <= 0) errs.width = "Width must be > 0";
    if (h <= 0) errs.height = "Height must be > 0";
    return errs;
  }, [width, height, product, isPricePerSqft]);

  const hasDimErrors = Object.keys(dimErrors).length > 0;

  // --- Price calculation ---
  const priceData = useMemo(() => {
    const qty = Number(quantity);
    if (qty <= 0) return null;

    const baseDollars = product.basePrice / 100;

    if (isPricePerSqft) {
      const w = Number(width);
      const h = Number(height);
      if (w <= 0 || h <= 0) return null;
      const sqft = (w * h) / 144;
      const unitPrice = baseDollars * sqft;
      const subtotal = unitPrice * qty;
      const tax = subtotal * HST_RATE;
      return { subtotal, tax, total: subtotal + tax, unitPrice, sqft, rate: baseDollars };
    }

    const subtotal = baseDollars * qty;
    const tax = subtotal * HST_RATE;
    return { subtotal, tax, total: subtotal + tax, unitPrice: baseDollars, sqft: null, rate: null };
  }, [product, width, height, quantity, isPricePerSqft]);

  // --- Cut-line preview box ---
  const boxStyles = useMemo(() => {
    const w = Number(width) || 3;
    const h = Number(height) || 3;
    const ratio = w / h;
    const bw = ratio >= 1 ? 75 : 75 * ratio;
    const bh = ratio >= 1 ? 75 / ratio : 75;
    return { width: `${bw}%`, height: `${bh}%` };
  }, [width, height]);

  // --- File handler ---
  const handleFileChange = useCallback((e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile({ name: f.name, size: f.size, type: f.type });
    if (f.type.startsWith("image/")) {
      setFileUrl(URL.createObjectURL(f));
    } else {
      setFileUrl("");
    }
  }, []);

  // --- Add to cart ---
  const canAddToCart = priceData && !hasDimErrors && Number(quantity) > 0;

  const handleAddToCart = () => {
    if (!canAddToCart) return;
    addItem({
      id: product.id,
      name: product.name,
      price: Math.round(priceData.unitPrice * 100), // unit price in cents
      quantity: Number(quantity),
      image: null,
      options: {
        ...(isPricePerSqft ? { width: Number(width), height: Number(height), sqft: priceData.sqft } : {}),
        pricingUnit: product.pricingUnit,
        fileName: file?.name || null,
      },
    });
    openCart();
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  // --- Accepted formats ---
  const formats = Array.isArray(product.acceptedFormats) ? product.acceptedFormats : [];
  const acceptStr = getAcceptString(formats);

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="pb-20 pt-10">
      {/* Breadcrumbs */}
      <div className="max-w-7xl mx-auto px-6 mb-8 text-[10px] text-gray-400 uppercase tracking-[0.2em]">
        <span onClick={() => router.push("/shop")} className="cursor-pointer hover:text-black transition-colors">
          Shop
        </span>
        {" / "}
        {product.category}
        {" / "}
        <span className="text-black font-bold">{product.name}</span>
      </div>

      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* ======== LEFT: Preview ======== */}
        <div className="lg:col-span-7 space-y-4">
          <div className="aspect-square bg-white rounded-3xl border border-gray-100 shadow-sm flex items-center justify-center relative overflow-hidden">
            <div
              className="absolute inset-0 opacity-[0.05] pointer-events-none"
              style={{ backgroundImage: "radial-gradient(#000 1px, transparent 1px)", backgroundSize: "24px 24px" }}
            />
            {fileUrl ? (
              <div className="relative z-10 w-full h-full flex items-center justify-center p-12">
                <img src={fileUrl} className="max-w-full max-h-full object-contain shadow-2xl" alt="Preview" />
                {isPricePerSqft && (
                  <div
                    className="absolute border-2 border-red-500 shadow-[0_0_0_9999px_rgba(255,255,255,0.85)] transition-all duration-500"
                    style={boxStyles}
                  >
                    <div className="absolute -top-6 left-0 text-[10px] font-mono text-red-500 bg-white px-1 whitespace-nowrap">
                      CUT_LINE: {width}&quot; x {height}&quot;
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center space-y-4 p-8">
                <div className="text-6xl opacity-20">🖨️</div>
                <p className="text-gray-400 text-sm font-medium">Upload your artwork to preview</p>
                <label className="inline-block cursor-pointer bg-black text-white px-10 py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-gray-800 transition-all">
                  Choose File
                  <input
                    type="file"
                    className="hidden"
                    accept={acceptStr}
                    onChange={handleFileChange}
                  />
                </label>
                {formats.length > 0 && (
                  <p className="text-[10px] text-gray-300 uppercase tracking-wider">
                    Accepted: {formats.join(", ")}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* File info + preflight warnings */}
          {file && (
            <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-400 flex-shrink-0">
                    {file.name.split(".").pop()?.toUpperCase() || "?"}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold truncate">{file.name}</p>
                    <p className="text-xs text-gray-400">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <button
                  onClick={() => { setFile(null); setFileUrl(""); }}
                  className="text-xs font-bold text-gray-400 hover:text-red-500 transition-colors px-2"
                >
                  Remove
                </button>
              </div>

              {/* Preflight warnings */}
              {(product.minDpi || product.requiresBleed) && (
                <div className="space-y-1.5 pt-2 border-t border-gray-50">
                  <p className="text-[10px] font-black uppercase tracking-widest text-amber-500">Preflight Notes</p>
                  {product.minDpi && (
                    <p className="text-xs text-gray-500">
                      <span className="font-bold text-amber-600">DPI:</span> Minimum {product.minDpi} DPI required for print quality
                    </p>
                  )}
                  {product.requiresBleed && (
                    <p className="text-xs text-gray-500">
                      <span className="font-bold text-amber-600">Bleed:</span> Add {product.bleedIn || 0.125}&quot; bleed on all sides
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ======== RIGHT: Config ======== */}
        <div className="lg:col-span-5 space-y-8">
          <header>
            <h1 className="text-4xl font-black tracking-tighter mb-2 italic">{product.name}</h1>
            <p className="text-gray-400 text-sm tracking-tight">{product.description}</p>
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs font-bold bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full uppercase">
                {product.type}
              </span>
              {isPricePerSqft ? (
                <span className="text-xs font-mono font-bold text-gray-500">
                  From {cad(product.basePrice)}/sqft
                </span>
              ) : (
                <span className="text-xs font-mono font-bold text-gray-500">
                  {cad(product.basePrice)}/ea
                </span>
              )}
            </div>
          </header>

          <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-2xl shadow-gray-200/40 space-y-8">
            {/* === 1. SIZE (only for per_sqft) === */}
            {isPricePerSqft && (
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-300">
                  Size (Inches)
                </label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_SIZES.map((s) => (
                    <button
                      key={s.label}
                      onClick={() => { setWidth(s.w); setHeight(s.h); setIsCustomSize(false); }}
                      className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                        !isCustomSize && Number(width) === s.w && Number(height) === s.h
                          ? "bg-black text-white border-black ring-2 ring-offset-2 ring-black"
                          : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                  <button
                    onClick={() => setIsCustomSize(true)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                      isCustomSize
                        ? "bg-black text-white border-black ring-2 ring-offset-2 ring-black"
                        : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                    }`}
                  >
                    Custom Size
                  </button>
                </div>

                {isCustomSize && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="relative">
                        <input
                          type="number"
                          value={width}
                          min={product.minWidthIn || 0.5}
                          max={product.maxWidthIn || 999}
                          step="0.5"
                          onChange={(e) => setWidth(e.target.value)}
                          className={`w-full bg-gray-50 rounded-2xl p-4 text-xl font-bold outline-none focus:ring-2 ${
                            dimErrors.width ? "focus:ring-red-500/30 border border-red-300" : "focus:ring-black/5"
                          }`}
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-300 pointer-events-none">
                          W
                        </span>
                      </div>
                      {dimErrors.width && (
                        <p className="text-[11px] text-red-500 mt-1 pl-1">{dimErrors.width}</p>
                      )}
                    </div>
                    <div>
                      <div className="relative">
                        <input
                          type="number"
                          value={height}
                          min={product.minHeightIn || 0.5}
                          max={product.maxHeightIn || 999}
                          step="0.5"
                          onChange={(e) => setHeight(e.target.value)}
                          className={`w-full bg-gray-50 rounded-2xl p-4 text-xl font-bold outline-none focus:ring-2 ${
                            dimErrors.height ? "focus:ring-red-500/30 border border-red-300" : "focus:ring-black/5"
                          }`}
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-300 pointer-events-none">
                          H
                        </span>
                      </div>
                      {dimErrors.height && (
                        <p className="text-[11px] text-red-500 mt-1 pl-1">{dimErrors.height}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Sqft readout */}
                {priceData?.sqft != null && !hasDimErrors && (
                  <div className="text-xs text-gray-400 font-mono bg-gray-50 px-4 py-2 rounded-xl">
                    {Number(width)}&quot; &times; {Number(height)}&quot; = {priceData.sqft.toFixed(3)} sqft per piece
                  </div>
                )}
              </div>
            )}

            {/* === 2. QUANTITY === */}
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-300">
                Quantity
              </label>
              <div className="flex flex-wrap gap-2">
                {PRESET_QUANTITIES.map((q) => (
                  <button
                    key={q}
                    onClick={() => { setQuantity(q); setIsCustomQty(false); }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                      !isCustomQty && quantity === q
                        ? "bg-black text-white border-black ring-2 ring-offset-2 ring-black"
                        : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                    }`}
                  >
                    {q} pcs
                  </button>
                ))}
                <button
                  onClick={() => setIsCustomQty(true)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                    isCustomQty
                      ? "bg-black text-white border-black ring-2 ring-offset-2 ring-black"
                      : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                  }`}
                >
                  Custom Qty
                </button>
              </div>

              {isCustomQty && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 bg-gray-50 px-3 py-2 rounded-2xl">
                    <button
                      onClick={() => setQuantity(Math.max(1, Number(quantity) - 1))}
                      className="w-10 h-10 rounded-xl bg-white border border-gray-200 font-black text-lg hover:bg-gray-100 transition-colors flex items-center justify-center"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                      className="flex-1 text-center text-xl font-black bg-transparent outline-none"
                    />
                    <button
                      onClick={() => setQuantity(Number(quantity) + 1)}
                      className="w-10 h-10 rounded-xl bg-white border border-gray-200 font-black text-lg hover:bg-gray-100 transition-colors flex items-center justify-center"
                    >
                      +
                    </button>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5000"
                    step="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black"
                  />
                </div>
              )}
            </div>

            {/* === 3. FILE UPLOAD (if no file yet, show inline) === */}
            {!file && (
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-300">
                  Upload Artwork
                </label>
                <label className="flex items-center justify-center gap-3 p-6 border-2 border-dashed border-gray-200 rounded-2xl cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-all">
                  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 16V4m0 0l-4 4m4-4l4 4M4 20h16" />
                  </svg>
                  <span className="text-sm text-gray-500 font-medium">
                    {formats.length > 0 ? `Accepts: ${formats.join(", ").toUpperCase()}` : "Choose a file"}
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    accept={acceptStr}
                    onChange={handleFileChange}
                  />
                </label>
              </div>
            )}
          </div>

          {/* === 4. PRICE BREAKDOWN === */}
          {priceData && !hasDimErrors && (
            <div className="bg-black text-white rounded-[2.5rem] p-8 space-y-6 shadow-2xl shadow-black/30">
              {/* Price lines */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] uppercase tracking-widest text-gray-500">
                    {isPricePerSqft ? `${cad(Math.round(priceData.unitPrice * 100))}/pc` : `${cad(product.basePrice)}/ea`}
                    {" "}&times; {quantity}
                  </span>
                  <span className="text-sm font-mono font-bold">{cad(Math.round(priceData.subtotal * 100))}</span>
                </div>
                {isPricePerSqft && priceData.rate && (
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] uppercase tracking-widest text-gray-500">Rate</span>
                    <span className="inline-block bg-gray-800 rounded px-2 py-0.5 text-[10px] font-mono text-gray-300 border border-gray-700">
                      {cad(Math.round(priceData.rate * 100))}/sqft
                    </span>
                  </div>
                )}
                <div className="border-t border-gray-800 pt-3 flex justify-between items-center">
                  <span className="text-[10px] uppercase tracking-widest text-gray-500">Subtotal</span>
                  <span className="text-sm font-mono font-bold">{cad(Math.round(priceData.subtotal * 100))}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] uppercase tracking-widest text-gray-500">HST (13%)</span>
                  <span className="text-sm font-mono text-gray-400">{cad(Math.round(priceData.tax * 100))}</span>
                </div>
                <div className="border-t border-gray-700 pt-3 flex justify-between items-start">
                  <span className="text-[9px] uppercase tracking-[0.3em] text-gray-500">Total (CAD)</span>
                  <div className="text-4xl font-black tracking-tighter">{cad(Math.round(priceData.total * 100))}</div>
                </div>
              </div>

              {/* Add to cart */}
              <button
                onClick={handleAddToCart}
                disabled={!canAddToCart}
                className={`w-full py-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] transition-all ${
                  canAddToCart
                    ? addedToCart
                      ? "bg-green-500 text-white"
                      : "bg-white text-black hover:invert active:scale-[0.98]"
                    : "bg-gray-900 text-gray-700 cursor-not-allowed"
                }`}
              >
                {addedToCart ? "Added to Cart!" : "Add to Cart"}
              </button>
            </div>
          )}

          {/* Dim error state — show message instead of price */}
          {hasDimErrors && (
            <div className="bg-gray-100 rounded-[2.5rem] p-8 text-center">
              <p className="text-sm text-gray-400">Fix dimension errors above to see pricing</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
