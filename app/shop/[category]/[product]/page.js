"use client";

export const runtime = 'edge';

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PRODUCTS } from "../../../../config/products";
import { calculatePrice } from "../../../../lib/pricing/calculatePrice";
import { UploadButton } from "../../../../utils/uploadthing";
import { useCartStore } from "../../../../app/store/useCartStore";

// 定义预设选项
const PRESET_QUANTITIES = [50, 100, 250, 500, 1000];
const PRESET_SIZES = [
  { w: 2, h: 2, label: '2" x 2"' },
  { w: 3, h: 3, label: '3" x 3"' },
  { w: 4, h: 4, label: '4" x 4"' },
  { w: 5, h: 5, label: '5" x 5"' },
];

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const category = String(params?.category || "");
  const productSlug = String(params?.product || "");

  const addItem = useCartStore((state) => state.addItem);
  const openCart = useCartStore((state) => state.openCart);

  const product = useMemo(() => {
    return PRODUCTS.find((p) => p.category === category && p.product === productSlug);
  }, [category, productSlug]);

  const [width, setWidth] = useState("3");
  const [height, setHeight] = useState("3");
  const [quantity, setQuantity] = useState(50);
  const [sizeLabel, setSizeLabel] = useState("");
  const [addons, setAddons] = useState([]);
  
  // ⭐ 新增：控制是否显示自定义输入框的状态
  const [isCustomSize, setIsCustomSize] = useState(false);
  const [isCustomQty, setIsCustomQty] = useState(false);
  
  const [fileKey, setFileKey] = useState(""); 
  const [fileName, setFileName] = useState("");
  const [fileType, setFileType] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [priceData, setPriceData] = useState(null);

  // 初始化：如果是固定尺寸产品，默认选第一个
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

  const handleAddToCart = () => {
    if (!fileKey || !priceData) return;
    const cartItem = {
      productId: productSlug,
      name: product.name,
      price: Math.round(priceData.total * 100), 
      quantity: Number(quantity),
      width: Number(width),
      height: Number(height),
      sizeLabel: sizeLabel,
      addons: addons,
      fileKey: fileKey,
      fileUrl: previewUrl,
      fileName: fileName,
      fileType: fileType,
    };
    addItem(cartItem);
    openCart();
  };

  const copyToClipboard = async (text) => { /* 省略 */ };

  if (!product) return null;

  return (
    <div className="pb-20 pt-10">
      <div className="max-w-7xl mx-auto px-6 mb-8 text-[10px] text-gray-400 uppercase tracking-[0.2em]">
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
            
            {/* ⭐ 1. 尺寸选择区 */}
            {product.pricingModel === "area_tier" ? (
              <div className="space-y-4">
                 <label className="text-[10px] font-black uppercase tracking-widest text-gray-300">Size (Inches)</label>
                 
                 {/* 尺寸按钮组 */}
                 <div className="flex flex-wrap gap-2">
                    {PRESET_SIZES.map(s => (
                      <button 
                        key={s.label}
                        onClick={() => { 
                          setWidth(s.w); 
                          setHeight(s.h); 
                          setIsCustomSize(false); // 关掉自定义框
                        }}
                        className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                          !isCustomSize && Number(width) === s.w && Number(height) === s.h 
                          ? "bg-black text-white border-black ring-2 ring-offset-2 ring-black" 
                          : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                    
                    {/* Custom 按钮 */}
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

                 {/* 自定义尺寸输入框 (只在 isCustomSize 为 true 时显示) */}
                 {isCustomSize && (
                   <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2 fade-in duration-300">
                      <div className="relative">
                        <input type="number" value={width} onChange={(e)=>setWidth(e.target.value)} className="w-full bg-gray-50 rounded-2xl p-4 text-xl font-bold outline-none focus:ring-2 focus:ring-black/5" />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-300 pointer-events-none">W</span>
                      </div>
                      <div className="relative">
                        <input type="number" value={height} onChange={(e)=>setHeight(e.target.value)} className="w-full bg-gray-50 rounded-2xl p-4 text-xl font-bold outline-none focus:ring-2 focus:ring-black/5" />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-300 pointer-events-none">H</span>
                      </div>
                   </div>
                 )}
              </div>
            ) : (
              // 固定尺寸下拉框 (Sign类产品)
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-300">Select Standard Size</label>
                <select value={sizeLabel} onChange={(e)=>setSizeLabel(e.target.value)} className="w-full bg-gray-50 rounded-2xl p-4 font-bold appearance-none outline-none focus:ring-2 focus:ring-black/5">
                  {product.config?.sizes?.map(s => <option key={s.label} value={s.label}>{s.label}</option>)}
                </select>
              </div>
            )}

            {/* ⭐ 2. 数量选择区 */}
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-300">Quantity</label>
              
              {/* 数量按钮组 */}
              <div className="flex flex-wrap gap-2">
                 {PRESET_QUANTITIES.map(q => (
                   <button 
                     key={q} 
                     onClick={() => {
                       setQuantity(q);
                       setIsCustomQty(false); // 关掉自定义框
                     }}
                     className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                       !isCustomQty && quantity === q 
                       ? "bg-black text-white border-black ring-2 ring-offset-2 ring-black" 
                       : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                     }`}
                   >
                     {q} pcs
                   </button>
                 ))}

                 {/* Custom 按钮 */}
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

              {/* 自定义数量输入 + 滑块 (只在 isCustomQty 为 true 时显示) */}
              {isCustomQty && (
                <div className="flex items-center gap-4 bg-gray-50 p-2 rounded-2xl animate-in slide-in-from-top-2 fade-in duration-300">
                   <input 
                     type="range" 
                     min="1" max="5000" step="1" 
                     value={quantity} 
                     onChange={(e)=>setQuantity(Number(e.target.value))} 
                     className="flex-1 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black ml-2" 
                   />
                   <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 flex items-center gap-2">
                      <input 
                        type="number" 
                        value={quantity} 
                        onChange={(e)=>setQuantity(Number(e.target.value))}
                        className="w-16 text-right font-black outline-none"
                      />
                      <span className="text-[10px] font-bold text-gray-400">PCS</span>
                   </div>
                </div>
              )}
            </div>

            {/* Addons (保持不变) */}
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

          {/* 价格明细 & 底部按钮 */}
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
               </div>

              <button 
                onClick={handleAddToCart}
                disabled={!fileKey || !priceData}
                className={`w-full py-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] transition-all ${(fileKey && priceData) ? "bg-white text-black hover:invert active:scale-[0.98]" : "bg-gray-900 text-gray-700 cursor-not-allowed"}`}
              >
                {!fileKey ? "Upload Image First" : "Add to Cart"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}