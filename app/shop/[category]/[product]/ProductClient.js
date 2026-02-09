"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useCartStore } from "@/lib/store";
import { showSuccessToast } from "@/components/Toast";
import { validateDimensions } from "@/lib/materialLimits";

const HST_RATE = 0.13;
const PRESET_QUANTITIES = [50, 100, 250, 500, 1000];
const INCH_TO_CM = 2.54;

const formatCad = (cents) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);

function parseMaterials(optionsConfig) {
  if (!optionsConfig || typeof optionsConfig !== "object") return [];
  const direct = Array.isArray(optionsConfig.materials) ? optionsConfig.materials : [];
  const flattened = direct
    .map((item) => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object" && typeof item.label === "string") return item.label;
      return null;
    })
    .filter(Boolean);
  return flattened;
}

export default function ProductClient({ product, relatedProducts }) {
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openCart);

  const isPerSqft = product.pricingUnit === "per_sqft";
  const materials = parseMaterials(product.optionsConfig);

  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(100);
  const [material, setMaterial] = useState(materials[0] || "Standard Vinyl");
  const [unit, setUnit] = useState("in");
  const [widthIn, setWidthIn] = useState(product.minWidthIn || 3);
  const [heightIn, setHeightIn] = useState(product.minHeightIn || 3);
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState("");
  const [added, setAdded] = useState(false);

  // Server-driven pricing state
  const [quote, setQuote] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const debounceRef = useRef(null);

  const imageList = product.images?.length ? product.images : [];

  const widthDisplay = unit === "in" ? widthIn : Number((widthIn * INCH_TO_CM).toFixed(2));
  const heightDisplay = unit === "in" ? heightIn : Number((heightIn * INCH_TO_CM).toFixed(2));

  const sizeValidation = useMemo(() => {
    if (!isPerSqft) return { valid: true, errors: [] };
    return validateDimensions(widthIn, heightIn, material, product);
  }, [widthIn, heightIn, material, product, isPerSqft]);

  // Debounced /api/quote fetch (300ms)
  const fetchQuote = useCallback(
    async (slug, qty, w, h, mat) => {
      const body = { slug, quantity: qty };
      if (isPerSqft) {
        body.widthIn = w;
        body.heightIn = h;
      }
      if (mat) body.material = mat;

      try {
        setQuoteLoading(true);
        const res = await fetch("/api/quote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) return; // silently fail — sizeValidation shows dimension errors
        const data = await res.json();
        setQuote(data);
      } catch {
        // network error — keep previous quote
      } finally {
        setQuoteLoading(false);
      }
    },
    [isPerSqft]
  );

  useEffect(() => {
    if (!sizeValidation.valid) return;
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchQuote(product.slug, quantity, widthIn, heightIn, material);
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [product.slug, quantity, widthIn, heightIn, material, sizeValidation.valid, fetchQuote]);

  // Derive display prices from quote (fallback to basePrice estimate)
  const priceData = useMemo(() => {
    const qty = Number(quantity) || 1;
    if (quote) {
      const subtotal = quote.totalCents;
      const tax = Math.round(subtotal * HST_RATE);
      const unitAmount = quote.unitCents || Math.round(subtotal / qty);
      const sqft = quote.meta?.sqftPerUnit ?? null;
      return { unitAmount, subtotal, tax, total: subtotal + tax, sqft, breakdown: quote.breakdown };
    }
    // Fallback while loading
    const baseUnitCents = product.basePrice;
    if (isPerSqft) {
      const sqft = (Number(widthIn) * Number(heightIn)) / 144;
      const unitAmount = Math.max(1, Math.round(baseUnitCents * sqft));
      const subtotal = unitAmount * qty;
      const tax = Math.round(subtotal * HST_RATE);
      return { unitAmount, subtotal, tax, total: subtotal + tax, sqft, breakdown: null };
    }
    const unitAmount = Math.max(1, baseUnitCents);
    const subtotal = unitAmount * qty;
    const tax = Math.round(subtotal * HST_RATE);
    return { unitAmount, subtotal, tax, total: subtotal + tax, sqft: null, breakdown: null };
  }, [quote, quantity, product.basePrice, widthIn, heightIn, isPerSqft]);

  // Tier rows — quick client estimates for the tier table
  const tierRows = useMemo(
    () =>
      PRESET_QUANTITIES.map((q) => {
        const base = isPerSqft
          ? product.basePrice * ((widthIn * heightIn) / 144 || 1)
          : product.basePrice;
        // Simple volume discount estimate
        let disc = 1;
        if (q >= 1000) disc = 0.82;
        else if (q >= 500) disc = 0.88;
        else if (q >= 250) disc = 0.93;
        else if (q >= 100) disc = 0.97;
        return { qty: q, unitAmount: Math.max(1, Math.round(base * disc)) };
      }),
    [product.basePrice, isPerSqft, widthIn, heightIn]
  );

  const specs = [
    ["Product Type", product.type],
    ["Pricing Unit", product.pricingUnit === "per_sqft" ? "Per Square Foot" : "Per Piece"],
    ["Min Size", product.minWidthIn && product.minHeightIn ? `${product.minWidthIn}" x ${product.minHeightIn}"` : "N/A"],
    ["Max Size", product.maxWidthIn && product.maxHeightIn ? `${product.maxWidthIn}" x ${product.maxHeightIn}"` : "N/A"],
    ["Min DPI", product.minDpi ? String(product.minDpi) : "N/A"],
    ["Bleed", product.requiresBleed ? `${product.bleedIn || 0.125}" required` : "Not required"],
  ];

  function onFileChange(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    if (f.type.startsWith("image/")) {
      setFilePreview(URL.createObjectURL(f));
    } else {
      setFilePreview("");
    }
  }

  function setSizeValue(type, value) {
    const n = Math.max(0.5, Number(value) || 0.5);
    const inValue = unit === "in" ? n : n / INCH_TO_CM;
    if (type === "w") setWidthIn(Number(inValue.toFixed(2)));
    if (type === "h") setHeightIn(Number(inValue.toFixed(2)));
  }

  const canAddToCart = sizeValidation.valid;

  function handleAddToCart() {
    if (!canAddToCart) return;
    const item = {
      productId: product.id,
      slug: product.slug,
      name: product.name,
      unitAmount: priceData.unitAmount,
      quantity: Number(quantity),
      image: imageList[0]?.url || null,
      meta: {
        width: isPerSqft ? widthIn : null,
        height: isPerSqft ? heightIn : null,
        material,
        fileName: file?.name || null,
        pricingUnit: product.pricingUnit,
      },
      id: product.id,
      price: priceData.unitAmount,
      options: {
        width: isPerSqft ? widthIn : null,
        height: isPerSqft ? heightIn : null,
        material,
        fileName: file?.name || null,
        pricingUnit: product.pricingUnit,
      },
    };

    addItem(item);
    openCart();
    showSuccessToast("Added to cart!");
    setAdded(true);
    setTimeout(() => setAdded(false), 700);
  }

  return (
    <main className="bg-gray-50 pb-20 pt-10 text-gray-900">
      <div className="mx-auto max-w-6xl space-y-10 px-6">
        <div className="text-xs uppercase tracking-[0.2em] text-gray-500">
          <Link href="/shop" className="hover:text-gray-900">Shop</Link> / <span>{product.category}</span> / <span className="text-gray-900">{product.name}</span>
        </div>

        <section className="grid gap-10 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-7">
            <div className="relative aspect-square overflow-hidden rounded-3xl border border-gray-200 bg-white">
              {imageList[activeImage]?.url ? (
                <Image
                  src={imageList[activeImage].url}
                  alt={imageList[activeImage].alt || product.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 58vw"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm text-gray-400">No image available</div>
              )}
            </div>

            {imageList.length > 1 && (
              <div className="grid grid-cols-5 gap-2">
                {imageList.map((img, idx) => (
                  <button
                    key={img.id}
                    onClick={() => setActiveImage(idx)}
                    className={`relative aspect-square overflow-hidden rounded-xl border ${activeImage === idx ? "border-gray-900" : "border-gray-200"}`}
                  >
                    <Image src={img.url} alt={img.alt || product.name} fill className="object-cover" sizes="20vw" />
                  </button>
                ))}
              </div>
            )}

            <div className="rounded-2xl border border-gray-200 bg-white p-5">
              <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-600">Product Specifications</h3>
              <div className="mt-3 divide-y divide-gray-100">
                {specs.map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between py-2 text-sm">
                    <span className="text-gray-500">{k}</span>
                    <span className="font-medium text-gray-900">{v}</span>
                  </div>
                ))}
              </div>
              {product.templateUrl && (
                <a href={product.templateUrl} target="_blank" rel="noreferrer" className="mt-4 inline-block text-xs font-semibold uppercase tracking-[0.2em] text-gray-700 hover:text-gray-900">
                  Installation Guide
                </a>
              )}
            </div>
          </div>

          <div className="space-y-6 lg:col-span-5">
            <header>
              <h1 className="text-4xl font-semibold tracking-tight">{product.name}</h1>
              <p className="mt-3 text-sm text-gray-600">{product.description || "Professional-grade custom print product for business applications."}</p>
            </header>

            <div className="rounded-3xl border border-gray-200 bg-white p-6">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                  Realtime Pricing
                  {quoteLoading && <span className="ml-2 inline-block h-3 w-3 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />}
                </p>
                <p className={`text-sm font-semibold ${quoteLoading ? "text-gray-400" : "text-gray-900"}`}>{formatCad(priceData.unitAmount)} / unit</p>
              </div>

              {isPerSqft && (
                <div className="mt-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Size Unit</p>
                    <div className="rounded-full border border-gray-300 p-1 text-xs">
                      <button onClick={() => setUnit("in")} className={`rounded-full px-3 py-1 ${unit === "in" ? "bg-gray-900 text-white" : "text-gray-600"}`}>Inches</button>
                      <button onClick={() => setUnit("cm")} className={`rounded-full px-3 py-1 ${unit === "cm" ? "bg-gray-900 text-white" : "text-gray-600"}`}>CM</button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <label className="text-xs text-gray-600">
                      Width ({unit})
                      <input
                        type="number"
                        value={widthDisplay}
                        onChange={(e) => setSizeValue("w", e.target.value)}
                        className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
                      />
                    </label>
                    <label className="text-xs text-gray-600">
                      Height ({unit})
                      <input
                        type="number"
                        value={heightDisplay}
                        onChange={(e) => setSizeValue("h", e.target.value)}
                        className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
                      />
                    </label>
                  </div>
                  <p className="text-xs text-gray-500">Area per unit: {priceData.sqft?.toFixed(3)} sqft</p>
                  {!sizeValidation.valid && (
                    <div className="mt-1 space-y-1">
                      {sizeValidation.errors.map((err, i) => (
                        <p key={i} className="text-xs text-red-500">{err}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {materials.length > 0 && (
                <div className="mt-5">
                  <label className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Material</label>
                  <select value={material} onChange={(e) => setMaterial(e.target.value)} className="mt-2 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm">
                    {materials.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="mt-5">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Quantity</p>
                <div className="mt-2 flex items-center gap-2">
                  <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="h-9 w-9 rounded-full border border-gray-300">-</button>
                  <input type="number" value={quantity} onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))} className="w-20 rounded-xl border border-gray-300 px-3 py-2 text-center text-sm" />
                  <button onClick={() => setQuantity((q) => q + 1)} className="h-9 w-9 rounded-full border border-gray-300">+</button>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Tier Pricing</p>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                  {tierRows.map((row) => (
                    <div key={row.qty} className="flex items-center justify-between rounded-lg bg-white px-3 py-2">
                      <span>{row.qty}+ pcs</span>
                      <span className="font-semibold">{formatCad(row.unitAmount)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-5 space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Artwork Upload</label>
                <input type="file" onChange={onFileChange} className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm" />
                <p className="text-xs text-gray-500">Optional. You can also upload after checkout.</p>
                {filePreview && (
                  <div className="relative mt-2 aspect-video overflow-hidden rounded-xl border border-gray-200">
                    <Image src={filePreview} alt="Upload preview" fill className="object-contain" sizes="50vw" />
                  </div>
                )}
                {file && !filePreview && <p className="text-xs text-gray-600">File attached: {file.name}</p>}
              </div>

              <div className="mt-6 rounded-2xl border border-gray-200 p-4">
                {priceData.breakdown && priceData.breakdown.length > 0 && (
                  <div className="mb-3 space-y-1 border-b border-gray-100 pb-3">
                    {priceData.breakdown.map((line, i) => (
                      <div key={i} className="flex items-center justify-between text-xs text-gray-500">
                        <span>{line.label}</span>
                        <span>{formatCad(line.amount)}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span>Subtotal</span>
                  <span className="font-semibold">{formatCad(priceData.subtotal)}</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span>Tax (13% HST)</span>
                  <span className="font-semibold">{formatCad(priceData.tax)}</span>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-gray-200 pt-3 text-base font-semibold">
                  <span>Total</span>
                  <span>{formatCad(priceData.total)} CAD</span>
                </div>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={!canAddToCart}
                className={`mt-6 w-full rounded-full px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white transition-all duration-200 ${
                  !canAddToCart
                    ? "bg-gray-300 cursor-not-allowed"
                    : added
                      ? "bg-emerald-600"
                      : "bg-gray-900 hover:bg-black"
                }`}
              >
                {!canAddToCart ? "Fix size errors" : added ? "Added" : "Add to Cart"}
              </button>
            </div>
          </div>
        </section>

        <section>
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Related Products</h2>
            <Link href={`/shop?category=${product.category}`} className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-600 hover:text-gray-900">View Category</Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {relatedProducts.map((item) => (
              <Link key={item.id} href={`/shop/${item.category}/${item.slug}`} className="overflow-hidden rounded-2xl border border-gray-200 bg-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                <div className="relative aspect-[4/3] bg-gray-100">
                  {item.images[0]?.url ? (
                    <Image src={item.images[0].url} alt={item.images[0].alt || item.name} fill className="object-cover" sizes="25vw" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-gray-500">No image</div>
                  )}
                </div>
                <div className="p-4">
                  <p className="text-sm font-semibold">{item.name}</p>
                  <p className="mt-1 text-xs text-gray-600">From {formatCad(item.basePrice)}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
