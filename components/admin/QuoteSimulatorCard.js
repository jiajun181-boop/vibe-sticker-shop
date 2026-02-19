"use client";

import { useMemo, useState } from "react";
import { compute } from "@/lib/pricing/models/costPlus";

export default function QuoteSimulatorCard({ formulaConfig, materials }) {
  const [open, setOpen] = useState(true);
  const [widthIn, setWidthIn] = useState(12);
  const [heightIn, setHeightIn] = useState(12);
  const [quantity, setQuantity] = useState(10);
  const [materialId, setMaterialId] = useState("");
  const [printMode, setPrintMode] = useState("");
  const [cutType, setCutType] = useState("rectangular");
  const [isB2B, setIsB2B] = useState(false);

  // Pick first material / print mode if not yet selected
  const selectedMat = materials?.find((m) => m.id === materialId) || materials?.[0];
  const inkModes = formulaConfig?.inkCosts ? Object.keys(formulaConfig.inkCosts) : [];
  const selectedMode = printMode || inkModes[0] || "cmyk";

  const result = useMemo(() => {
    if (!formulaConfig || !selectedMat) return null;
    const w = Number(widthIn);
    const h = Number(heightIn);
    const q = Number(quantity);
    if (!w || w <= 0 || !h || h <= 0 || !q || q <= 0) return null;

    try {
      const config = {
        ...formulaConfig,
        materials: { [selectedMat.name]: { costPerSqft: selectedMat.costPerSqft } },
        defaultMaterial: selectedMat.name,
      };
      return compute(config, { widthIn: w, heightIn: h, quantity: q, material: selectedMat.name, printMode: selectedMode, cutType, isB2B });
    } catch {
      return null;
    }
  }, [formulaConfig, selectedMat, widthIn, heightIn, quantity, selectedMode, cutType, isB2B]);

  if (!formulaConfig || !materials?.length) return null;

  const areaSqft = (Number(widthIn) * Number(heightIn)) / 144;
  const perimeterFt = (2 * (Number(widthIn) + Number(heightIn))) / 12;
  const ink = formulaConfig.inkCosts?.[selectedMode];

  return (
    <div className="rounded-xl border border-teal-200 bg-teal-50 p-4">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between">
        <h3 className="text-sm font-bold text-teal-900">Quote Simulator</h3>
        <svg className={`h-4 w-4 text-teal-500 transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {open && (
        <div className="mt-4 space-y-4">
          {/* Input controls */}
          <div className="flex flex-wrap items-end gap-3">
            {/* Material */}
            <div>
              <label className="block text-xs text-teal-700">Material</label>
              <select
                value={selectedMat?.id || ""}
                onChange={(e) => setMaterialId(e.target.value)}
                className="mt-1 rounded-lg border border-teal-300 bg-white px-2 py-1.5 text-sm focus:border-teal-500 focus:outline-none"
              >
                {materials.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} (${m.costPerSqft.toFixed(4)}/sqft)
                  </option>
                ))}
              </select>
            </div>

            {/* Print Mode */}
            <div>
              <label className="block text-xs text-teal-700">Print Mode</label>
              <select
                value={selectedMode}
                onChange={(e) => setPrintMode(e.target.value)}
                className="mt-1 rounded-lg border border-teal-300 bg-white px-2 py-1.5 text-sm focus:border-teal-500 focus:outline-none"
              >
                {inkModes.map((k) => (
                  <option key={k} value={k}>
                    {formulaConfig.inkCosts[k]?.label || k}
                  </option>
                ))}
              </select>
            </div>

            {/* Cut Type */}
            <div>
              <label className="block text-xs text-teal-700">Cut Type</label>
              <select
                value={cutType}
                onChange={(e) => setCutType(e.target.value)}
                className="mt-1 rounded-lg border border-teal-300 bg-white px-2 py-1.5 text-sm focus:border-teal-500 focus:outline-none"
              >
                <option value="rectangular">Rectangular</option>
                <option value="contour">Contour</option>
              </select>
            </div>

            {/* Width */}
            <div>
              <label className="block text-xs text-teal-700">Width (in)</label>
              <input
                type="number" min="0.5" step="0.5" value={widthIn}
                onChange={(e) => setWidthIn(e.target.value)}
                className="mt-1 w-20 rounded-lg border border-teal-300 px-2 py-1.5 text-sm font-mono focus:border-teal-500 focus:outline-none"
              />
            </div>

            {/* Height */}
            <div>
              <label className="block text-xs text-teal-700">Height (in)</label>
              <input
                type="number" min="0.5" step="0.5" value={heightIn}
                onChange={(e) => setHeightIn(e.target.value)}
                className="mt-1 w-20 rounded-lg border border-teal-300 px-2 py-1.5 text-sm font-mono focus:border-teal-500 focus:outline-none"
              />
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-xs text-teal-700">Qty</label>
              <input
                type="number" min="1" step="1" value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="mt-1 w-20 rounded-lg border border-teal-300 px-2 py-1.5 text-sm font-mono focus:border-teal-500 focus:outline-none"
              />
            </div>

            {/* B2B toggle */}
            <div className="flex items-center gap-2 pb-1">
              <button
                onClick={() => setIsB2B(false)}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold ${!isB2B ? "bg-teal-700 text-white" : "bg-teal-100 text-teal-700 hover:bg-teal-200"}`}
              >
                Retail
              </button>
              <button
                onClick={() => setIsB2B(true)}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold ${isB2B ? "bg-teal-700 text-white" : "bg-teal-100 text-teal-700 hover:bg-teal-200"}`}
              >
                B2B
              </button>
            </div>
          </div>

          {/* Results table */}
          {result ? (
            <div className="overflow-x-auto rounded-lg border border-teal-200 bg-white">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-teal-50 text-[11px] font-bold uppercase tracking-wider text-teal-600">
                    <th className="px-3 py-2 text-left">Item</th>
                    <th className="px-3 py-2 text-left">Formula</th>
                    <th className="px-3 py-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-teal-100">
                  {/* Material */}
                  <Row
                    label="Material"
                    formula={`$${selectedMat.costPerSqft.toFixed(4)}/sqft × ${areaSqft.toFixed(2)} sqft × ${quantity}`}
                    amount={result.meta.materialCostCents}
                  />
                  {/* Ink */}
                  <Row
                    label={`Ink (${selectedMode})`}
                    formula={`$${ink?.inkPerSqft?.toFixed(3) || "?"}/sqft × ${areaSqft.toFixed(2)} sqft × ${quantity}`}
                    amount={result.meta.inkCostCents}
                  />
                  {/* Labor */}
                  {result.meta.laborCostCents > 0 && (
                    <Row
                      label="Labor"
                      formula={`machine time × $${formulaConfig.machineLabor?.hourlyRate || 60}/hr`}
                      amount={result.meta.laborCostCents}
                    />
                  )}
                  {/* Cutting */}
                  <Row
                    label={cutType === "contour" ? "Contour cutting" : "Cutting"}
                    formula={cutType === "contour"
                      ? `$${formulaConfig.cutting?.contourPerSqft || "?"}/sqft × ${areaSqft.toFixed(2)} sqft × ${quantity}`
                      : `${perimeterFt.toFixed(2)} ft × $${formulaConfig.cutting?.rectangularPerFt || "?"}/ft × ${quantity}`}
                    amount={result.meta.cuttingCostCents}
                  />
                  {/* Qty efficiency */}
                  <tr className="text-xs text-gray-500">
                    <td className="px-3 py-1.5">Qty efficiency</td>
                    <td className="px-3 py-1.5 font-mono">× {result.meta.qtyEfficiency.toFixed(3)}</td>
                    <td className="px-3 py-1.5 text-right">—</td>
                  </tr>
                  {/* Subtotal */}
                  <tr className="bg-teal-50 font-bold">
                    <td className="px-3 py-1.5" colSpan={2}>Subtotal</td>
                    <td className="px-3 py-1.5 text-right font-mono">
                      ${((result.meta.materialCostCents + result.meta.inkCostCents + result.meta.laborCostCents + result.meta.cuttingCostCents) / 100).toFixed(2)}
                    </td>
                  </tr>
                  {/* Waste */}
                  <Row
                    label="Waste"
                    formula={`+${(result.meta.wasteFactor * 100).toFixed(1)}%`}
                    amount={result.meta.wasteCostCents}
                  />
                  {/* Raw cost */}
                  <tr className="bg-teal-50 font-bold">
                    <td className="px-3 py-1.5" colSpan={2}>Raw cost</td>
                    <td className="px-3 py-1.5 text-right font-mono">${(result.meta.rawCostCents / 100).toFixed(2)}</td>
                  </tr>
                  {/* Markup */}
                  <tr className="text-xs text-gray-500">
                    <td className="px-3 py-1.5">Markup</td>
                    <td className="px-3 py-1.5 font-mono">× {result.meta.markupFactor.toFixed(3)} ({isB2B ? "B2B" : "Retail"})</td>
                    <td className="px-3 py-1.5 text-right">—</td>
                  </tr>
                  {/* File/setup fee */}
                  {result.meta.fileFee > 0 && (
                    <Row label="File / setup fee" formula="" amount={result.meta.fileFee} />
                  )}
                  {/* Final price */}
                  <tr className="bg-teal-700 text-white font-bold">
                    <td className="px-3 py-2" colSpan={2}>Final price (roundTo99)</td>
                    <td className="px-3 py-2 text-right font-mono text-base">${(result.totalCents / 100).toFixed(2)}</td>
                  </tr>
                  {/* Unit price */}
                  <tr className="text-xs text-gray-600">
                    <td className="px-3 py-1.5" colSpan={2}>Unit price</td>
                    <td className="px-3 py-1.5 text-right font-mono font-semibold">${(result.meta.unitCents / 100).toFixed(2)}/ea</td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-teal-600">Enter valid dimensions and quantity to see pricing breakdown.</p>
          )}
        </div>
      )}
    </div>
  );
}

function Row({ label, formula, amount }) {
  return (
    <tr className="text-xs">
      <td className="px-3 py-1.5 text-gray-700">{label}</td>
      <td className="px-3 py-1.5 font-mono text-gray-500">{formula}</td>
      <td className="px-3 py-1.5 text-right font-mono">${(amount / 100).toFixed(2)}</td>
    </tr>
  );
}
