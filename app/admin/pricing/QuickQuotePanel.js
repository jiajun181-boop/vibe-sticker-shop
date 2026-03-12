"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslation } from "@/lib/i18n/useTranslation";

/**
 * Standalone Quick Quote / Cost Calculator.
 * Reuses the canonical pricing contract via /api/admin/pricing-contract.
 * Admin selects a product, adjusts inputs, and gets full cost/profit/floor breakdown.
 */
export default function QuickQuotePanel() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const requestedSlug = searchParams.get("slug") || "";
  const [products, setProducts] = useState([]);
  const [selectedSlug, setSelectedSlug] = useState("");
  const [productQuery, setProductQuery] = useState("");
  const [quantity, setQuantity] = useState(100);
  const [widthIn, setWidthIn] = useState(3);
  const [heightIn, setHeightIn] = useState(3);
  const [material, setMaterial] = useState("");
  const [sizeLabel, setSizeLabel] = useState("");
  const [rush, setRush] = useState(false);
  const [designHelp, setDesignHelp] = useState(false);
  const [doubleSided, setDoubleSided] = useState(false);
  const [finishing, setFinishing] = useState("");

  // B2B Simulation fields
  const [b2bUserId, setB2bUserId] = useState("");
  const [b2bCompanyName, setB2bCompanyName] = useState("");
  const [b2bPartnerTier, setB2bPartnerTier] = useState("");
  const [b2bOpen, setB2bOpen] = useState(false);

  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Save snapshot state
  const [saveNote, setSaveNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState(null); // { ok: bool, message: string }

  // Load product list on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/products?page=1&limit=500");
        if (!res.ok) return;
        const data = await res.json();
        const active = (data.products || []).filter(p => p.isActive).sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        setProducts(active);
        const requested = requestedSlug
          ? active.find((p) => p.slug === requestedSlug)
          : null;
        if (requested) {
          setSelectedSlug(requested.slug);
          setProductQuery(requested.name || requested.slug);
        } else if (active.length > 0) {
          setSelectedSlug((prev) => prev || active[0].slug);
          setProductQuery((prev) => prev || active[0].name || active[0].slug);
        }
      } catch { /* non-critical */ }
    })();
  }, [requestedSlug]);

  useEffect(() => {
    if (!requestedSlug || products.length === 0) return;
    const requested = products.find((p) => p.slug === requestedSlug);
    if (!requested || requested.slug === selectedSlug) return;
    setSelectedSlug(requested.slug);
    setProductQuery(requested.name || requested.slug);
  }, [products, requestedSlug, selectedSlug]);

  // Update defaults when product changes
  useEffect(() => {
    if (!selectedSlug) return;
    const p = products.find(pr => pr.slug === selectedSlug);
    if (!p) return;
    const cat = p.category || "";
    const unit = p.pricingUnit || "per_piece";
    if (unit === "per_sqft" || cat === "banners-displays") {
      setQuantity(1); setWidthIn(24); setHeightIn(36);
    } else if (cat === "signs-rigid-boards") {
      setQuantity(1); setWidthIn(18); setHeightIn(24);
    } else if (cat === "canvas-prints") {
      setQuantity(1); setWidthIn(16); setHeightIn(20);
    } else if (cat === "stickers-labels-decals") {
      setQuantity(100); setWidthIn(3); setHeightIn(3);
    } else if (cat === "marketing-business-print") {
      setQuantity(250); setWidthIn(3.5); setHeightIn(2);
    } else if (cat === "vehicle-graphics-fleet") {
      setQuantity(1); setWidthIn(48); setHeightIn(24);
    } else {
      setQuantity(100); setWidthIn(3); setHeightIn(3);
    }
    setMaterial("");
    setSizeLabel("");
    setRush(false);
    setDesignHelp(false);
    setDoubleSided(false);
    setFinishing("");
  }, [selectedSlug, products]);

  const filteredProducts = useMemo(() => {
    const q = productQuery.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) =>
      (p.name || "").toLowerCase().includes(q) ||
      (p.slug || "").toLowerCase().includes(q)
    );
  }, [productQuery, products]);

  const visibleProducts = useMemo(() => {
    const current = products.find((p) => p.slug === selectedSlug);
    const list = filteredProducts.slice(0, 50);
    if (current && !list.some((p) => p.slug === current.slug)) {
      return [current, ...list];
    }
    return list;
  }, [filteredProducts, products, selectedSlug]);

  const fetchContract = useCallback(async () => {
    if (!selectedSlug) return;
    setLoading(true);
    setError(null);
    try {
      const body = { slug: selectedSlug, quantity, widthIn, heightIn };
      if (material) body.material = material;
      if (sizeLabel) body.sizeLabel = sizeLabel;
      // Pass toggles as options
      const opts = {};
      if (rush) opts.rush = true;
      if (designHelp) opts.designHelp = true;
      if (doubleSided) opts.doubleSided = true;
      if (finishing) opts.finishing = finishing;
      if (Object.keys(opts).length > 0) body.options = opts;
      // B2B simulation params
      if (b2bUserId) body.b2bUserId = b2bUserId;
      if (b2bCompanyName) body.b2bCompanyName = b2bCompanyName;
      if (b2bPartnerTier) body.b2bPartnerTier = b2bPartnerTier;
      const res = await fetch("/api/admin/pricing-contract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to calculate");
      setContract(data);
    } catch (err) {
      setError(err.message);
      setContract(null);
    } finally {
      setLoading(false);
    }
  }, [selectedSlug, quantity, widthIn, heightIn, material, sizeLabel, rush, designHelp, doubleSided, finishing, b2bUserId, b2bCompanyName, b2bPartnerTier]);

  // Auto-fetch on param change (debounced)
  useEffect(() => {
    const timer = setTimeout(fetchContract, 600);
    return () => clearTimeout(timer);
  }, [fetchContract]);

  // Save quote snapshot
  const saveSnapshot = useCallback(async () => {
    if (!contract) return;
    setSaving(true);
    setSaveResult(null);
    try {
      const payload = {
        productId: contract.product?.id || null,
        productSlug: contract.product?.slug || null,
        productName: contract.product?.name || null,
        category: contract.product?.category || null,
        configInput: { quantity, widthIn, heightIn, material, sizeLabel, rush, designHelp, doubleSided, finishing },
        pricingSource: contract.source?.kind || "UNKNOWN",
        sellPriceCents: contract.sellPrice?.totalCents || 0,
        totalCostCents: contract.totalCost || 0,
        floorPriceCents: contract.floor?.priceCents || 0,
        quoteLedger: contract.quoteLedger || null,
        note: saveNote.trim() || null,
      };
      const res = await fetch("/api/admin/pricing/quote-snapshots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save snapshot");
      setSaveResult({ ok: true, message: "Snapshot saved (ID: " + data.id + ")" });
      setSaveNote("");
    } catch (err) {
      setSaveResult({ ok: false, message: err.message });
    } finally {
      setSaving(false);
    }
  }, [contract, quantity, widthIn, heightIn, material, sizeLabel, rush, designHelp, doubleSided, finishing, saveNote]);

  const fmt = (cents) => "$" + ((cents || 0) / 100).toFixed(2);
  const pct = (rate) => ((rate || 0) * 100).toFixed(1) + "%";

  const c = contract;
  const costBuckets = c?.cost || {};
  const nonZeroBuckets = Object.entries(costBuckets).filter(([, v]) => v > 0);
  const totalCost = c?.totalCost || 0;
  const sell = c?.sellPrice?.totalCents || 0;
  const profit = c?.profit || {};
  const floor = c?.floor || {};
  const completeness = c?.completeness || {};

  return (
    <div className="space-y-5">
      {/* Input controls */}
      <div className="rounded-[3px] border border-[#e0e0e0] bg-white p-5">
        <h2 className="text-base font-bold text-[#111]">{t("admin.pc.quickQuoteTitle")}</h2>
        <p className="mt-1 text-xs text-[#999]">{t("admin.pc.quickQuoteDesc")}</p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {/* Product selector */}
          <div className="sm:col-span-2 lg:col-span-1">
            <label className="block text-xs font-medium text-[#666]">{t("admin.pc.findProduct")}</label>
            <input
              type="text"
              value={productQuery}
              onChange={e => setProductQuery(e.target.value)}
              placeholder="Search name or slug"
              className="mt-1 w-full rounded-[3px] border border-[#d0d0d0] px-3 py-3 text-sm text-[#111] outline-none focus:border-black"
              style={{ minHeight: 48 }}
            />
            <label className="mt-2 block text-[10px] font-medium uppercase tracking-wide text-[#999]">
              Product Match {filteredProducts.length ? `(${Math.min(filteredProducts.length, 50)} shown)` : ""}
            </label>
            <select
              value={selectedSlug}
              onChange={e => {
                const nextSlug = e.target.value;
                setSelectedSlug(nextSlug);
                const nextProduct = products.find((p) => p.slug === nextSlug);
                if (nextProduct) {
                  setProductQuery(nextProduct.name || nextProduct.slug);
                }
              }}
              className="mt-1 w-full rounded-[3px] border border-[#d0d0d0] px-3 py-3 text-sm text-[#111] outline-none focus:border-black"
              style={{ minHeight: 48 }}
            >
              {visibleProducts.map(p => (
                <option key={p.slug} value={p.slug}>{p.name}</option>
              ))}
            </select>
            {requestedSlug && selectedSlug === requestedSlug && (
              <p className="mt-1 text-[10px] text-[#999]">Opened directly from product: {requestedSlug}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-[#666]">{t("admin.pc.quantity")}</label>
            <input
              type="number" min={1} value={quantity}
              onChange={e => setQuantity(Math.max(1, Number(e.target.value) || 1))}
              className="mt-1 w-full rounded-[3px] border border-[#d0d0d0] px-3 py-3 text-sm text-[#111] outline-none focus:border-black"
              style={{ minHeight: 48 }}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#666]">{t("admin.pc.widthIn")}</label>
            <input
              type="number" min={0.5} step={0.5} value={widthIn}
              onChange={e => setWidthIn(Number(e.target.value) || 1)}
              className="mt-1 w-full rounded-[3px] border border-[#d0d0d0] px-3 py-3 text-sm text-[#111] outline-none focus:border-black"
              style={{ minHeight: 48 }}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#666]">{t("admin.pc.heightIn")}</label>
            <input
              type="number" min={0.5} step={0.5} value={heightIn}
              onChange={e => setHeightIn(Number(e.target.value) || 1)}
              className="mt-1 w-full rounded-[3px] border border-[#d0d0d0] px-3 py-3 text-sm text-[#111] outline-none focus:border-black"
              style={{ minHeight: 48 }}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#666]">{t("admin.pc.material")}</label>
            <input
              type="text" value={material}
              onChange={e => setMaterial(e.target.value)}
              placeholder="Optional"
              className="mt-1 w-full rounded-[3px] border border-[#d0d0d0] px-3 py-3 text-sm text-[#111] outline-none focus:border-black"
              style={{ minHeight: 48 }}
            />
          </div>
        </div>

        {/* Row 2: sizeLabel + finishing + toggles */}
        <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <label className="block text-xs font-medium text-[#666]">{t("admin.pc.sizeLabel")}</label>
            <input
              type="text" value={sizeLabel}
              onChange={e => setSizeLabel(e.target.value)}
              placeholder='e.g. 4"x6"'
              className="mt-1 w-full rounded-[3px] border border-[#d0d0d0] px-3 py-3 text-sm text-[#111] outline-none focus:border-black"
              style={{ minHeight: 48 }}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#666]">{t("admin.pc.finishing")}</label>
            <input
              type="text" value={finishing}
              onChange={e => setFinishing(e.target.value)}
              placeholder="e.g. matte lamination"
              className="mt-1 w-full rounded-[3px] border border-[#d0d0d0] px-3 py-3 text-sm text-[#111] outline-none focus:border-black"
              style={{ minHeight: 48 }}
            />
          </div>
          <div className="flex items-end gap-4 sm:col-span-2 lg:col-span-3">
            <ToggleChip label={t("admin.pc.rush")} checked={rush} onChange={setRush} />
            <ToggleChip label={t("admin.pc.designHelp")} checked={designHelp} onChange={setDesignHelp} />
            <ToggleChip label={t("admin.pc.doubleSided")} checked={doubleSided} onChange={setDoubleSided} />
          </div>
        </div>

        {/* B2B Simulation (collapsible) */}
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setB2bOpen(!b2bOpen)}
            className="flex items-center gap-1.5 text-xs font-medium text-[#666] hover:text-[#111]"
          >
            <span className={`inline-block transition-transform ${b2bOpen ? "rotate-90" : ""}`}>&#9654;</span>
            {t("admin.pc.b2bSimulation")}
            {(b2bUserId || b2bCompanyName || b2bPartnerTier) && (
              <span className="ml-1 rounded-[2px] bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200">ACTIVE</span>
            )}
          </button>
          {b2bOpen && (
            <div className="mt-2 grid gap-4 sm:grid-cols-3 rounded-[3px] border border-amber-200 bg-amber-50/50 p-4">
              <div>
                <label className="block text-xs font-medium text-[#666]">B2B User ID</label>
                <input
                  type="text" value={b2bUserId}
                  onChange={e => setB2bUserId(e.target.value)}
                  placeholder="Optional"
                  className="mt-1 w-full rounded-[3px] border border-[#d0d0d0] px-3 py-3 text-sm text-[#111] outline-none focus:border-black bg-white"
                  style={{ minHeight: 48 }}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#666]">B2B Company Name</label>
                <input
                  type="text" value={b2bCompanyName}
                  onChange={e => setB2bCompanyName(e.target.value)}
                  placeholder="Optional"
                  className="mt-1 w-full rounded-[3px] border border-[#d0d0d0] px-3 py-3 text-sm text-[#111] outline-none focus:border-black bg-white"
                  style={{ minHeight: 48 }}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#666]">B2B Partner Tier</label>
                <select
                  value={b2bPartnerTier}
                  onChange={e => setB2bPartnerTier(e.target.value)}
                  className="mt-1 w-full rounded-[3px] border border-[#d0d0d0] px-3 py-3 text-sm text-[#111] outline-none focus:border-black bg-white"
                  style={{ minHeight: 48 }}
                >
                  <option value="">None</option>
                  <option value="bronze">Bronze</option>
                  <option value="silver">Silver</option>
                  <option value="gold">Gold</option>
                  <option value="platinum">Platinum</option>
                </select>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={fetchContract}
          disabled={loading || !selectedSlug}
          className="mt-4 rounded-[3px] bg-black px-6 py-3 text-sm font-semibold text-white hover:bg-[#222] disabled:opacity-50"
          style={{ minHeight: 48 }}
        >
          {loading ? t("admin.pc.calculating") : t("admin.pc.calculateQuote")}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-[3px] border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-semibold text-red-700">{t("admin.pc.quoteError")}</p>
          <p className="mt-1 text-xs text-red-600">{error}</p>
        </div>
      )}

      {/* Results */}
      {c && !error && (
        <div className="space-y-4">
          {/* Active modifiers banner */}
          {(rush || designHelp || doubleSided || finishing) && (
            <div className="flex flex-wrap gap-1.5">
              {rush && <span className="rounded-[3px] bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-orange-700 border border-orange-200">RUSH 1.3x</span>}
              {designHelp && <span className="rounded-[3px] bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-700 border border-purple-200">DESIGN HELP +$45</span>}
              {doubleSided && <span className="rounded-[3px] bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-200">DOUBLE SIDED</span>}
              {finishing && <span className="rounded-[3px] bg-cyan-100 px-2 py-0.5 text-[10px] font-bold text-cyan-700 border border-cyan-200">{finishing.toUpperCase()}</span>}
            </div>
          )}

          {/* Key metrics */}
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <MetricCard label={t("admin.pc.sellPrice")} value={fmt(sell)} sub={`Unit: ${fmt(c.sellPrice?.unitCents)}`} />
            <MetricCard label={t("admin.pc.totalCost")} value={totalCost > 0 ? fmt(totalCost) : "--"} sub={`${nonZeroBuckets.length} buckets`} />
            <MetricCard
              label={t("admin.pc.profit")}
              value={totalCost > 0 ? fmt(profit.amountCents) : "--"}
              sub={totalCost > 0 ? `${t("admin.pc.colMargin")}: ${pct(profit.rate)}` : t("admin.pc.noCostData")}
              color={profit.rate >= 0.25 ? "text-green-700" : profit.rate >= 0.10 ? "text-amber-700" : "text-red-600"}
            />
            <MetricCard
              label={t("admin.pc.floorPrice")}
              value={floor.priceCents > 0 ? fmt(floor.priceCents) : "--"}
              sub={floor.policySource || "n/a"}
              color={sell >= (floor.priceCents || 0) ? "text-green-700" : "text-red-600"}
            />
            <MetricCard
              label={t("admin.pc.completeness")}
              value={`${completeness.score ?? 0}%`}
              sub={`${(completeness.missing || []).length} missing`}
              color={completeness.score >= 90 ? "text-green-700" : completeness.score >= 70 ? "text-amber-700" : "text-red-600"}
            />
            <MetricCard
              label={t("admin.pc.source")}
              value={c.source?.kind?.replace(/_/g, " ") || "unknown"}
              sub={c.source?.template || c.source?.presetModel || ""}
            />
          </div>

          {/* B2B Adjusted Price card */}
          {c.b2bAdjustment && (
            <div className="rounded-[3px] border border-amber-300 bg-amber-50 p-5">
              <h3 className="text-sm font-bold text-amber-900">{t("admin.pc.b2bAdjusted")}</h3>
              <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <p className="text-[10px] font-medium uppercase text-amber-700">Adjusted Price</p>
                  <p className="mt-1 text-lg font-bold text-amber-900">{fmt(c.b2bAdjustment.adjustedPriceCents)}</p>
                  <p className="text-[10px] text-amber-600">Retail: {fmt(c.b2bAdjustment.retailPriceCents)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-medium uppercase text-amber-700">Discount</p>
                  <p className="mt-1 text-lg font-bold text-amber-900">{fmt(c.b2bAdjustment.discountCents)}</p>
                  <p className="text-[10px] text-amber-600">
                    {c.b2bAdjustment.retailPriceCents > 0
                      ? `${((c.b2bAdjustment.discountCents / c.b2bAdjustment.retailPriceCents) * 100).toFixed(1)}% off retail`
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-medium uppercase text-amber-700">Applied Rule</p>
                  <p className="mt-1 text-sm font-bold text-amber-900">
                    {c.b2bAdjustment.appliedRule.ruleType.replace(/_/g, " ")}
                  </p>
                  <p className="text-[10px] text-amber-600">
                    Value: {c.b2bAdjustment.appliedRule.value}
                    {c.b2bAdjustment.appliedRule.note && ` — ${c.b2bAdjustment.appliedRule.note}`}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-medium uppercase text-amber-700">B2B Profit</p>
                  <p className={`mt-1 text-lg font-bold ${
                    c.b2bAdjustment.adjustedProfit.rate >= 0.15 ? "text-green-700" : c.b2bAdjustment.adjustedProfit.rate >= 0.05 ? "text-amber-700" : "text-red-600"
                  }`}>
                    {fmt(c.b2bAdjustment.adjustedProfit.amountCents)}
                  </p>
                  <p className="text-[10px] text-amber-600">
                    Margin: {pct(c.b2bAdjustment.adjustedProfit.rate)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Cost breakdown */}
          {nonZeroBuckets.length > 0 && totalCost > 0 && (
            <div className="rounded-[3px] border border-[#e0e0e0] bg-white p-5">
              <h3 className="text-sm font-bold text-[#111]">{t("admin.pc.costBreakdown")}</h3>
              <div className="mt-3 flex h-6 overflow-hidden rounded-[3px]">
                {nonZeroBuckets.map(([bucket, cents]) => {
                  const widthPct = Math.max((cents / totalCost) * 100, 3);
                  const colors = {
                    material: "bg-blue-400", print: "bg-cyan-400", labor: "bg-amber-400",
                    finishing: "bg-purple-400", waste: "bg-red-300", setup: "bg-gray-400",
                    outsourcing: "bg-pink-400", transfer: "bg-teal-400", other: "bg-gray-300",
                  };
                  return (
                    <div
                      key={bucket}
                      className={`${colors[bucket] || "bg-gray-300"} relative`}
                      style={{ width: `${widthPct}%` }}
                      title={`${bucket}: ${fmt(cents)}`}
                    />
                  );
                })}
              </div>
              <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-4">
                {nonZeroBuckets.map(([bucket, cents]) => (
                  <div key={bucket} className="flex items-center justify-between text-xs">
                    <span className="font-medium text-[#666] capitalize">{bucket}</span>
                    <span className="font-mono text-[#111]">{fmt(cents)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Floor policy detail */}
          {floor.policyDetail && (
            <div className="rounded-[3px] border border-[#e0e0e0] bg-white p-5">
              <h3 className="text-sm font-bold text-[#111]">{t("admin.pc.floorPolicy")}</h3>
              <p className="mt-1 text-xs text-[#666]">{floor.policyDetail}</p>
              <div className="mt-2 flex items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  sell >= (floor.priceCents || 0) ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                }`}>
                  {sell >= (floor.priceCents || 0) ? t("admin.pc.aboveFloor") : t("admin.pc.belowFloorLabel")}
                </span>
                <span className="text-[10px] text-[#999]">
                  Source: {floor.policySource} | Floor: {fmt(floor.priceCents)} | Sell: {fmt(sell)}
                </span>
              </div>
            </div>
          )}

          {/* Option impacts */}
          {c.optionImpacts && c.optionImpacts.length > 0 && (
            <div className="rounded-[3px] border border-[#e0e0e0] bg-white p-5">
              <h3 className="text-sm font-bold text-[#111]">{t("admin.pc.optionImpact")}</h3>
              <div className="mt-2 overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-[#fafafa]">
                      <th className="px-3 py-2 text-left font-semibold text-[#666]">Option</th>
                      <th className="px-3 py-2 text-left font-semibold text-[#666]">Cost Buckets</th>
                      <th className="px-3 py-2 text-left font-semibold text-[#666]">Charge Type</th>
                      <th className="px-3 py-2 text-left font-semibold text-[#666]">Impact</th>
                      <th className="px-3 py-2 text-center font-semibold text-[#666]">Mapped</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#ececec]">
                    {c.optionImpacts.map((opt, i) => (
                      <tr key={i}>
                        <td className="px-3 py-2 font-medium text-[#111]">{opt.option}</td>
                        <td className="px-3 py-2 text-[#666]">
                          {(opt.costBuckets || [opt.costBucket]).join(", ")}
                        </td>
                        <td className="px-3 py-2">
                          <span className="rounded-[2px] bg-[#f0f0f0] px-1.5 py-0.5 text-[10px] font-mono text-[#666]">
                            {opt.chargeType || "—"}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-[#666]">{opt.impact}</td>
                        <td className="px-3 py-2 text-center">
                          <span className={`inline-block h-4 w-4 rounded-full text-[10px] font-bold leading-4 ${opt.mapped ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                            {opt.mapped ? "Y" : "N"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Inheritance */}
          {c.inheritance && (
            <div className="rounded-[3px] border border-[#e0e0e0] bg-white p-5">
              <h3 className="text-sm font-bold text-[#111]">{t("admin.pc.inheritanceChain")}</h3>
              <div className="mt-2 space-y-1 text-xs text-[#666]">
                {c.inheritance.templateName && (
                  <p>Template: <span className="font-medium text-[#111]">{c.inheritance.templateName}</span></p>
                )}
                {c.inheritance.presetKey && (
                  <p>Preset: <span className="font-medium text-[#111]">{c.inheritance.presetKey}</span></p>
                )}
                {c.inheritance.productOverrides?.length > 0 && (
                  <p>Product overrides: <span className="font-medium text-amber-700">{c.inheritance.productOverrides.join(", ")}</span></p>
                )}
                {(!c.inheritance.templateName && !c.inheritance.presetKey) && (
                  <p className="text-[#999]">No template or preset inheritance detected.</p>
                )}
              </div>
            </div>
          )}

          {/* Explanation (sectioned) */}
          {c.explanation && (
            <div className="rounded-[3px] border border-[#e0e0e0] bg-[#fafafa] p-4">
              <h3 className="text-sm font-bold text-[#111] mb-2">{t("admin.pc.pricingExplanation")}</h3>
              <div className="space-y-1">
                {c.explanation.split(/(?=\[(?:Path|Costs|Missing|Warnings|Floor|Modifiers|Confidence)\])/).filter(Boolean).map((section, i) => {
                  const tagMatch = section.match(/^\[(Path|Costs|Missing|Warnings|Floor|Modifiers|Confidence)\]\s*/);
                  const tag = tagMatch ? tagMatch[1] : null;
                  const text = tag ? section.replace(tagMatch[0], "") : section;
                  const tagColors = {
                    Path: "bg-blue-100 text-blue-700",
                    Costs: "bg-cyan-100 text-cyan-700",
                    Missing: "bg-red-100 text-red-700",
                    Warnings: "bg-amber-100 text-amber-700",
                    Floor: "bg-purple-100 text-purple-700",
                    Modifiers: "bg-orange-100 text-orange-700",
                    Confidence: "bg-green-100 text-green-700",
                  };
                  return (
                    <div key={i} className="flex items-start gap-2 text-xs">
                      {tag && (
                        <span className={`shrink-0 rounded-[2px] px-1.5 py-0.5 text-[10px] font-bold ${tagColors[tag] || "bg-gray-100 text-gray-700"}`}>
                          {tag}
                        </span>
                      )}
                      <span className="text-[#666]">{text.trim()}</span>
                    </div>
                  );
                })}
              </div>
              {/* Sales-Ready Summary */}
              <details className="mt-2 rounded-[3px] border border-[#e0e0e0] bg-white">
                <summary className="cursor-pointer px-4 py-2 text-xs font-medium text-[#666] hover:bg-[#fafafa]">
                  {t("admin.pc.salesSummary")}
                </summary>
                <div className="border-t border-[#e0e0e0] px-4 py-3 text-xs text-[#666] space-y-1">
                  {c.salesExplanation ? (
                    c.salesExplanation.split("\n").filter(Boolean).map((line, i) => (
                      <p key={i}>{line}</p>
                    ))
                  ) : (
                    <>
                      <p>Price: {fmt(sell)} for {quantity} units of {c.product?.name || "this product"}</p>
                      {nonZeroBuckets.length > 0 && (
                        <p>Cost breakdown: {nonZeroBuckets.map(([k, v]) => `${k} ${fmt(v)}`).join(", ")}</p>
                      )}
                      {(rush || designHelp || doubleSided || finishing) && (
                        <p>
                          Includes:{" "}
                          {[
                            rush && "rush (+30%)",
                            designHelp && "design help (+$45)",
                            doubleSided && "double-sided printing",
                            finishing && `${finishing} finishing`,
                          ].filter(Boolean).join(", ")}
                        </p>
                      )}
                      <p>
                        {sell >= (floor.priceCents || 0)
                          ? "Meets minimum pricing policy."
                          : "Below minimum \u2014 requires manager approval."}
                      </p>
                      <p>
                        {(completeness.score ?? 0) >= 90
                          ? "All cost data is verified."
                          : (completeness.score ?? 0) >= 70
                            ? "Some cost estimates are used."
                            : "Limited cost data available."}
                      </p>
                    </>
                  )}
                </div>
              </details>
            </div>
          )}

          {/* Warnings */}
          {completeness.warnings?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {completeness.warnings.map((w, i) => (
                <span key={i} className="rounded-[3px] bg-amber-50 px-2 py-0.5 text-[10px] text-amber-700 border border-amber-200">{w}</span>
              ))}
            </div>
          )}
          {completeness.missing?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {completeness.missing.map((m, i) => (
                <span key={i} className="rounded-[3px] bg-red-50 px-2 py-0.5 text-[10px] text-red-700 border border-red-200">{m}</span>
              ))}
            </div>
          )}

          {/* Save Quote Snapshot */}
          <div className="rounded-[3px] border border-[#e0e0e0] bg-white p-5">
            <h3 className="text-sm font-bold text-[#111]">{t("admin.pc.saveSnapshot")}</h3>
            <p className="mt-1 text-xs text-[#999]">{t("admin.pc.saveSnapshotDesc")}</p>
            <textarea
              value={saveNote}
              onChange={e => setSaveNote(e.target.value)}
              placeholder="Optional note (e.g. client name, context)"
              rows={2}
              className="mt-3 w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm text-[#111] outline-none focus:border-black"
            />
            <div className="mt-3 flex items-center gap-3">
              <button
                onClick={saveSnapshot}
                disabled={saving}
                className="rounded-[3px] bg-black px-5 py-2 text-sm font-semibold text-white hover:bg-[#222] disabled:opacity-50"
              >
                {saving ? t("admin.pc.saving") : t("admin.pc.saveSnapshot")}
              </button>
              {saveResult && (
                <span className={`text-xs font-medium ${saveResult.ok ? "text-green-700" : "text-red-600"}`}>
                  {saveResult.message}
                </span>
              )}
            </div>
          </div>

          {/* Raw contract (collapsible) */}
          <details className="rounded-[3px] border border-[#e0e0e0] bg-white">
            <summary className="cursor-pointer px-4 py-3 text-xs font-medium text-[#666] hover:bg-[#fafafa]">
              {t("admin.pc.rawContract")}
            </summary>
            <div className="border-t border-[#e0e0e0] px-4 py-3">
              <pre className="overflow-x-auto whitespace-pre-wrap text-[11px] text-[#666] font-mono">
                {JSON.stringify(c, null, 2)}
              </pre>
            </div>
          </details>
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, value, sub, color = "text-[#111]" }) {
  return (
    <div className="rounded-[3px] border border-[#e0e0e0] bg-white p-3">
      <p className="text-[10px] font-medium uppercase text-[#999]">{label}</p>
      <p className={`mt-1 text-lg font-bold ${color}`}>{value}</p>
      {sub && <p className="text-[10px] text-[#999]">{sub}</p>}
    </div>
  );
}

function ToggleChip({ label, checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`rounded-[3px] border px-4 py-3 text-sm font-medium transition-colors ${
        checked
          ? "border-black bg-black text-white"
          : "border-[#d0d0d0] bg-white text-[#666] hover:border-[#999]"
      }`}
      style={{ minHeight: 48 }}
    >
      {checked ? "✓ " : ""}{label}
    </button>
  );
}
