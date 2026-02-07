"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PRODUCTS } from "../../../../config/products";
import { calculatePrice } from "../../../../lib/pricing/calculatePrice";
import { UploadButton } from "../../../../utils/uploadthing";

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const category = String(params?.category || "");
  const productSlug = String(params?.product || "");

  const product = useMemo(() => {
    return PRODUCTS.find((p) => p.category === category && p.product === productSlug);
  }, [category, productSlug]);

  const [width, setWidth] = useState("3");
  const [height, setHeight] = useState("3");
  const [quantity, setQuantity] = useState(50);
  const [sizeLabel, setSizeLabel] = useState("");
  const [addons, setAddons] = useState([]);
  
  const [fileKey, setFileKey] = useState(""); 
  const [fileName, setFileName] = useState("");
  const [fileType, setFileType] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  
  const [priceData, setPriceData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (product?.pricingModel === "fixed_size_tier") {
      setSizeLabel(product.config?.sizes?.[0]?.label || "");
    }
  }, [product]);

  useEffect(() => {
    if (category && productSlug && !product) router.replace("/"); 
  }, [product, category, productSlug, router]);

  useEffect(() => {
    if (!product) return;
    try {
      const result = calculatePrice(product, {
        width: Number(width),
        height: Number(height),
        quantity: Number(quantity),
        sizeLabel,
        addons
      });
      setPriceData(result);
    } catch (e) {
      setPriceData(null);
    }
  }, [product, width, height, quantity, sizeLabel, addons]);

  const boxStyles = useMemo(() => {
    let wVal = Number(width), hVal = Number(height);
    if (product?.pricingModel === "fixed_size_tier" && sizeLabel) {
      const m = sizeLabel.match(/(\d+(\.\d+)?)\s*["']?\s*[xX]\s*(\d+(\.\d+)?)/);
      if (m) { wVal = Number(m[1]); hVal = Number(m[3]); }
    }
    const ratio = (wVal && hVal) ? wVal / hVal : 1;
    const boxW = ratio >= 1 ? 75 : 75 * ratio;
    const boxH = ratio >= 1 ? 75 / ratio : 75;
    return { width: `${boxW}%`, height: `${boxH}%` };
  }, [width, height, sizeLabel, product]);

  // 剪贴板复制 (Safari 兼容版)
  const copyToClipboard = async (text) => {
    const s = String(text || "");
    if (!s) return;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(s);
        return;
      }
    } catch (err) {}
    try {
      const ta = document.createElement("textarea");
      ta.value = s;
      ta.setAttribute("readonly", "");
      ta.style.position = "absolute";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    } catch (err) {}
  };

  async function handleCheckout() {
    if (!fileKey || !priceData || loading) return;
    setLoading(true);
    let isRedirecting = false;

    try {
      const cleanInputs = {
        quantity: Number(quantity),
        addons,
        ...(product.pricingModel === "fixed_size_tier" ? { sizeLabel } : { width: Number(width), height: Number(height) })
      };

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category, product: productSlug, fileKey, fileName, fileType, inputs: cleanInputs
        }),
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || `Checkout failed (${res.status})`);
      }

      const data = await res.json();
      if (!data?.url) throw new Error("Missing Stripe checkout url");
      isRedirecting = true;
      window.location.href = data.url;
    } catch (e) {
      alert(`Error: ${String(e?.message || e)}`);
    } finally {
      if (!isRedirecting) setLoading(false);
    }
  }

  if (!product) return null;

  return (
    <div className="min-h-screen bg-[#fafafa] text-slate-900 pb-20">
      <div className="max-w-7xl mx-auto px-6 py-4 text-[10px] text-gray-400 uppercase tracking-[0.2em]">
        Shop / {category} / <span className="text-black font-bold">{product.name}</span>
      </div>

      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* 左侧预览 */}
        <div className="lg:col-span-7 space-y-4">
          <div className="aspect-square bg-white rounded-3xl border border-gray-100 shadow-sm flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
            {previewUrl ? (
              <div className="relative z-10 w-full h-full flex items-center justify-center p-12">
                <img src={previewUrl} className="max-w-full max-h-full object-contain shadow-2xl" alt="Preview" />
                <div className="absolute border-2 border-red-500 shadow-[0_0_0_9999px_rgba(255,255,255,0.85)] transition-all duration-500" style={boxStyles}>
                  <div className="absolute -top-6 left-0 text-[10px] font-mono text-red-500 bg-white px-1 whitespace-nowrap">
                    CUT_LINE: {product.pricingModel === 'area_tier' ? `${width}x${height}in` : sizeLabel}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-6">
                <div className="text-6xl opacity-20">🖨️</div>
                <div className="space-y-2">
                  <p className="text-gray-400 text-sm font-medium">Ready to print your design?</p>
                  <UploadButton
                    endpoint="imageUploader"
                    onClientUploadComplete={(res) => { 
                      const r = res?.[0];
                      if (r) {
                        setFileKey(r.key || r.fileKey || "");
                        setPreviewUrl(r.url || "");
                        setFileName(r.name || r.fileName || "uploaded-file");
                        setFileType(r.type || r.mime || "image/unknown");
                      }
                    }}
                    appearance={{ button: "bg-black text-white px-10 py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-gray-800 transition-all" }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 右侧配置 */}
        <div className="lg:col-span-5 space-y-8">
          <header>
            <h1 className="text-5xl font-black tracking-tighter mb-2 italic">{product.name}</h1>
            <p className="text-gray-400 text-sm tracking-tight">Industrial Grade {product.category} Production.</p>
          </header>

          <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-2xl shadow-gray-200/40 space-y-8">
            {/* 输入 */}
            {product.pricingModel === "area_tier" ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-300">Width (in)</label>
                  <input type="number" value={width} onChange={(e)=>setWidth(e.target.value)} className="w-full bg-gray-50 rounded-2xl p-4 text-xl font-bold outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-300">Height (in)</label>
                  <input type="number" value={height} onChange={(e)=>setHeight(e.target.value)} className="w-full bg-gray-50 rounded-2xl p-4 text-xl font-bold outline-none" />
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-300">Select Standard Size</label>
                <select value={sizeLabel} onChange={(e)=>setSizeLabel(e.target.value)} className="w-full bg-gray-50 rounded-2xl p-4 font-bold appearance-none">
                  {product.config?.sizes?.map(s => <option key={s.label} value={s.label}>{s.label}</option>)}
                </select>
              </div>
            )}

            {/* 数量 */}
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-300">Quantity</label>
                <span className="text-2xl font-black">{quantity} <span className="text-xs text-gray-300 font-normal">PCS</span></span>
              </div>
              <input type="range" min="1" max="500" step="1" value={quantity} onChange={(e)=>setQuantity(Number(e.target.value))} className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-black" />
            </div>

            {/* Addons */}
            <div className="space-y-3 pt-4 border-t border-gray-50">
              {product.options?.addons?.map(addon => {
                const unitLabel = addon.type === 'flat' ? 'flat' : addon.type === 'per_area' ? 'in²' : 'unit';
                return (
                  <label key={addon.id} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 hover:bg-gray-100 cursor-pointer transition-all group">
                    <div className="flex items-center gap-4">
                      <input type="checkbox" className="w-5 h-5 accent-black rounded-lg" 
                        checked={addons.includes(addon.id)} 
                        onChange={(e)=>{
                          const checked = e.target.checked;
                          const id = addon.id;
                          setAddons(prev => checked ? (prev.includes(id) ? prev : [...prev, id]) : prev.filter(i => i !== id));
                        }} 
                      />
                      <span className="text-sm font-bold">{addon.name}</span>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-gray-400">+${addon.price}/{unitLabel}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* 价格明细 */}
          {priceData && (
            <div className="bg-black text-white rounded-[2.5rem] p-8 space-y-6 shadow-2xl shadow-black/30">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[9px] uppercase tracking-[0.3em] text-gray-500 mb-1">Total Estimate</p>
                    <div className="text-5xl font-black tracking-tighter">${priceData.total.toFixed(2)}</div>
                  </div>
                  {product.pricingModel === "fixed_size_tier" && priceData.breakdown.tierMinQty > 0 && (
                    <div className="text-right">
                      <div className="inline-block bg-gray-800 rounded px-2 py-1 text-[10px] font-mono text-gray-300 border border-gray-700">TIER: {priceData.breakdown.tierMinQty}+</div>
                      <div className="text-[10px] text-gray-500 mt-1 font-mono">${Number(priceData.breakdown.unitPrice || 0).toFixed(2)} / unit</div>
                    </div>
                  )}
                  {product.pricingModel === "area_tier" && (
                    <div className="text-right">
                      <div className="inline-block bg-gray-800 rounded px-2 py-1 text-[10px] font-mono text-gray-300 border border-gray-700">RATE: ${Number(priceData.breakdown.unitPrice || 0).toFixed(4)}/in²</div>
                      <div className="text-[10px] text-gray-500 mt-1 font-mono">Unit: ${(Number(priceData.breakdown.unitPrice || 0) * Number(priceData.breakdown.areaPerUnit || 0)).toFixed(2)}</div>
                    </div>
                  )}
                </div>

                {priceData.breakdown.qtyBillable > Number(quantity) && (
                  <div className="bg-yellow-900/30 border border-yellow-600/50 rounded-xl p-3 flex items-start gap-3">
                    <div className="text-xl">⚠️</div>
                    <div>
                      <div className="text-xs font-bold text-yellow-500 uppercase tracking-wide">MOQ Adjustment</div>
                      <div className="text-[10px] text-yellow-200/80 font-mono mt-0.5 leading-relaxed">
                        Requested: {quantity} pcs<br/>Billed: <span className="text-white font-bold">{priceData.breakdown.qtyBillable} pcs</span>
                      </div>
                      <div className="text-[10px] text-yellow-200/70 font-mono mt-1">Pricing is tier-based. This tier minimum is {priceData.breakdown.tierMinQty} pcs.</div>
                    </div>
                  </div>
                )}
                
                <div className="pt-4 border-t border-gray-800">
                   <div onClick={() => copyToClipboard(priceData.breakdown.tierApplied)} title="Click to copy spec" className="text-[9px] text-gray-600 font-mono truncate opacity-60 cursor-pointer hover:opacity-100 hover:text-white transition-all">
                     SPEC: {priceData.breakdown.tierApplied || "Standard"}
                   </div>
                </div>
              </div>

              <button 
                onClick={handleCheckout}
                disabled={!fileKey || !priceData || loading}
                className={`w-full py-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] transition-all ${(fileKey && priceData) ? "bg-white text-black hover:invert active:scale-[0.98]" : "bg-gray-900 text-gray-700 cursor-not-allowed"}`}
              >
                {loading ? "Processing..." : "Proceed to Checkout"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}