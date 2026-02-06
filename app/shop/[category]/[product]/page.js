"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

// 👇 引用物理路径的组件
import { PRODUCTS } from "../../../../config/products";
import { calculatePrice } from "../../../../lib/pricing/calculatePrice";
import { UploadButton } from "../../../../utils/uploadthing";

function parseSizeLabelToRatio(label) {
  const m = String(label || "").match(/(\d+(\.\d+)?)\s*[xX]\s*(\d+(\.\d+)?)/);
  if (!m) return 1;
  const w = Number(m[1]);
  const h = Number(m[3]);
  if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) return 1;
  return w / h;
}

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();

  const category = String(params?.category || "");
  const productSlug = String(params?.product || "");

  const product = useMemo(() => {
    const safeProducts = Array.isArray(PRODUCTS) ? PRODUCTS : [];
    return safeProducts.find((p) => p.category === category && p.product === productSlug);
  }, [category, productSlug]);

  useEffect(() => {
    if (!product) {
      console.error("Product not found for:", category, productSlug);
    }
  }, [product, category, productSlug]);

  // --- 状态管理 ---
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [sizeLabel, setSizeLabel] = useState("");
  const [addons, setAddons] = useState([]);
  
  // 上传与预检状态
  const [fileKey, setFileKey] = useState(""); 
  const [previewUrl, setPreviewUrl] = useState("");
  const [imgDims, setImgDims] = useState({ w: 0, h: 0 }); 
  
  const [priceData, setPriceData] = useState(null);
  const [calcError, setCalcError] = useState("");
  const [loadingCheckout, setLoadingCheckout] = useState(false);

  // 初始化默认 Size
  useEffect(() => {
    if (!product) return;
    if (product.pricingModel === "fixed_size_tier") {
      const first = product.config?.sizes?.[0]?.label;
      if (first) setSizeLabel(first);
    }
  }, [product]);

  // --- 1. 实时计价引擎 ---
  useEffect(() => {
    if (!product) return;

    const inputs = {
      width: Number(width),
      height: Number(height),
      quantity: Number(quantity),
      sizeLabel,
      addons,
    };

    try {
      setCalcError("");
      const result = calculatePrice(product, inputs);
      setPriceData(result);
    } catch (e) {
      setPriceData(null);
      const msg = String(e?.message || "");
      if (
        (product.pricingModel === "area_tier" && (width || height)) ||
        (product.pricingModel !== "area_tier" && quantity)
      ) {
        setCalcError(msg);
      }
    }
  }, [product, width, height, quantity, sizeLabel, addons]);

  // --- 2. 比例计算 (Visuals) ---
  const productRatio = useMemo(() => {
    if (!product) return 1;
    if (product.pricingModel === "fixed_size_tier") return parseSizeLabelToRatio(sizeLabel);

    const w = Number(width);
    const h = Number(height);
    if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) return 1;
    return w / h;
  }, [product, width, height, sizeLabel]);

  // --- 3. DPI 实时计算 (Preflight V1) ---
  const dpiStatus = useMemo(() => {
    if (!previewUrl || imgDims.w === 0) return null;

    let targetW = 0;
    let targetH = 0;

    if (product.pricingModel === "area_tier") {
      targetW = Number(width);
      targetH = Number(height);
    } else if (product.pricingModel === "fixed_size_tier") {
      const m = String(sizeLabel).match(/(\d+(\.\d+)?)\s*[xX]\s*(\d+(\.\d+)?)/);
      if (m) {
        targetW = Number(m[1]);
        targetH = Number(m[3]);
      }
    }

    if (targetW <= 0 || targetH <= 0) return null;

    const dpiW = imgDims.w / targetW;
    const dpiH = imgDims.h / targetH;
    const estDpi = Math.min(dpiW, dpiH); 
    const minDpi = product.fileRules?.minDPI || 72;
    
    return {
      value: Math.round(estDpi),
      isLow: estDpi < minDpi,
      min: minDpi
    };
  }, [previewUrl, imgDims, width, height, sizeLabel, product]);

  // --- 4. 结账逻辑 ---
  const canCheckout = !!product && !!priceData && !!fileKey && !loadingCheckout;

  async function handleCheckout() {
    if (!product || !priceData) return;
    setLoadingCheckout(true);

    try {
      const inputs = {
        width: Number(width),
        height: Number(height),
        quantity: Number(quantity),
        sizeLabel,
        addons,
      };

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: product.category,
          product: product.product,
          inputs,
          fileKey,
        }),
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "Checkout failed");
      }

      const data = await res.json();
      if (!data?.url) throw new Error("Missing Stripe checkout url");
      window.location.href = data.url;
    } catch (e) {
      alert(`Checkout failed: ${String(e?.message || e)}`);
      setLoadingCheckout(false);
    }
  }

  const onImageLoad = (e) => {
    setImgDims({ w: e.target.naturalWidth, h: e.target.naturalHeight });
  };

  if (!product) {
    return <div className="p-10 text-center text-red-500">Error: Product Not Found ({category}/{productSlug})</div>;
  }

  const breakdown = priceData?.breakdown;
  const qtyRequested = breakdown?.qtyRequested ?? Number(quantity);
  const qtyBillable = breakdown?.qtyBillable ?? Number(quantity);
  const showMoq = Number.isFinite(qtyBillable) && qtyBillable > qtyRequested;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 font-sans">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* 左侧：可视化与上传 */}
        <div className="space-y-6">
          <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 p-6 min-h-[400px] flex flex-col items-center justify-center relative overflow-hidden group">
            {previewUrl ? (
              <div className="relative w-full h-full flex items-center justify-center min-h-[300px]">
                <img src={previewUrl} onLoad={onImageLoad} alt="Upload preview" className="max-w-full max-h-[350px] object-contain opacity-80" />
                <div className="absolute border-2 border-red-500 shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] pointer-events-none transition-all duration-500 ease-in-out"
                  style={{
                    aspectRatio: `${productRatio}`,
                    width: productRatio >= 1 ? '80%' : 'auto',
                    height: productRatio < 1 ? '80%' : 'auto',
                    maxWidth: '100%',
                    maxHeight: '100%'
                  }}
                >
                  <span className="absolute top-0 left-0 bg-red-600 text-white text-[10px] uppercase font-bold px-2 py-0.5">Print Area</span>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-400 mb-4">
                <p>Preview area</p>
                <p className="text-xs">Upload artwork to see print area overlay</p>
              </div>
            )}

            <div className={`mt-4 z-20 ${previewUrl ? "absolute bottom-4 right-4" : ""}`}>
              <UploadButton
                endpoint="imageUploader"
                onClientUploadComplete={(res) => {
                  if (res && res[0]) {
                    setFileKey(res[0].key);
                    setPreviewUrl(res[0].url);
                  }
                }}
                onUploadError={(error) => alert(`Upload failed: ${error.message}`)}
                appearance={{ button: "bg-black text-white text-sm px-4 py-2 rounded hover:bg-gray-800 transition-all", allowedContent: "hidden" }}
              />
            </div>
          </div>

          {dpiStatus && (
            <div className={`rounded-lg p-4 border flex items-center justify-between ${dpiStatus.isLow ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"}`}>
              <div>
                <div className={`font-bold ${dpiStatus.isLow ? "text-red-700" : "text-green-700"}`}>Quality Check: {dpiStatus.value} DPI</div>
                <div className="text-xs text-gray-600">Target: {dpiStatus.min} DPI</div>
              </div>
              {dpiStatus.isLow && <div className="text-xs bg-white px-2 py-1 rounded border border-red-200 text-red-600 font-medium">Low Quality Warning</div>}
            </div>
          )}
        </div>

        {/* 右侧：配置与报价 */}
        <div className="space-y-8">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">{product.name}</h1>
            <p className="text-gray-500 mt-2">Configure your product options below.</p>
          </div>

          <div className="bg-white rounded-xl border shadow-sm p-6 space-y-6">
            {product.pricingModel === "area_tier" && (
              <div className="grid grid-cols-2 gap-6">
                <div><label className="block text-sm font-semibold text-gray-900 mb-2">Width (in)</label><input type="number" min="0" value={width} onChange={(e) => setWidth(e.target.value)} className="block w-full rounded-lg border-gray-300 shadow-sm p-3 border" placeholder="e.g. 12" /></div>
                <div><label className="block text-sm font-semibold text-gray-900 mb-2">Height (in)</label><input type="number" min="0" value={height} onChange={(e) => setHeight(e.target.value)} className="block w-full rounded-lg border-gray-300 shadow-sm p-3 border" placeholder="e.g. 12" /></div>
              </div>
            )}
            {product.pricingModel === "fixed_size_tier" && (
              <div><label className="block text-sm font-semibold text-gray-900 mb-2">Select Size</label><select value={sizeLabel} onChange={(e) => setSizeLabel(e.target.value)} className="block w-full rounded-lg border-gray-300 shadow-sm p-3 border">{(product.config?.sizes || []).map((s) => (<option key={s.label} value={s.label}>{s.label}</option>))}</select></div>
            )}
            <div><label className="block text-sm font-semibold text-gray-900 mb-2">Quantity</label><input type="number" min="1" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} className="block w-full rounded-lg border-gray-300 shadow-sm p-3 border" /></div>
            
            {(product.options?.addons || []).length > 0 && (
              <div className="pt-4 border-t border-gray-100">
                <div className="text-sm font-semibold text-gray-900 mb-3">Finishing Options</div>
                <div className="space-y-3">{product.options.addons.map((a) => (<label key={a.id} className="flex items-center gap-3 cursor-pointer group"><input type="checkbox" className="accent-black w-4 h-4" checked={addons.includes(a.id)} onChange={(e) => { if (e.target.checked) setAddons([...addons, a.id]); else setAddons(addons.filter((x) => x !== a.id)); }} /><span className="text-sm text-gray-700">{a.name} <span className="text-gray-400 ml-1">(+${Number(a.price || 0).toFixed(2)})</span></span></label>))}</div>
              </div>
            )}
          </div>

          {priceData ? (
            <div className="bg-gray-50 rounded-xl p-6 border space-y-3">
              <div className="flex justify-between text-sm text-gray-600"><span>Requested Qty:</span><span className="font-medium">{qtyRequested}</span></div>
              {showMoq && (<div className="flex items-start gap-2 bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800"><span className="text-lg">⚠️</span><div><span className="font-bold">Minimum Billed Quantity: {qtyBillable}</span><p className="text-xs mt-1 text-yellow-700 opacity-90">Based on our bulk pricing tiers.</p></div></div>)}
              {Number.isFinite(breakdown?.fileFee) && breakdown.fileFee > 0 && (<div className="flex justify-between text-sm text-gray-600"><span>File Setup Fee:</span><span>${breakdown.fileFee.toFixed(2)}</span></div>)}
              <div className="pt-4 border-t border-gray-200 mt-2 flex items-center justify-between"><div className="text-gray-900 font-semibold">Total Price</div><div className="text-3xl font-extrabold text-gray-900 tracking-tight">${priceData.total.toFixed(2)}</div></div>
            </div>
          ) : (calcError && <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm border border-red-100">{calcError}</div>)}

          <button onClick={handleCheckout} disabled={!canCheckout} className={`w-full py-4 rounded-xl text-white font-bold text-lg shadow-lg transition-all transform hover:-translate-y-0.5 ${canCheckout ? "bg-black hover:bg-gray-800 shadow-gray-900/10" : "bg-gray-300 text-gray-500 cursor-not-allowed shadow-none"}`}>{loadingCheckout ? "Processing..." : fileKey ? "Proceed to Checkout" : "Upload Artwork to Continue"}</button>
        </div>
      </div>
    </div>
  );
}