"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import QuoteSimulatorCard from "@/components/admin/QuoteSimulatorCard";
import HardwarePricingTable from "@/components/admin/HardwarePricingTable";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { ProductCenterBreadcrumb, ProductCenterViewStrip } from "@/components/admin/ProductCenterHeader";

// ── Tab definitions ──────────────────────────────────────────────
const TABS = [
  { id: "materials", label: "Materials", labelZh: "材料库" },
  { id: "large-format", label: "Large Format", labelZh: "大幅卷料" },
  { id: "paper", label: "Paper Print", labelZh: "纸产品" },
  { id: "board", label: "Board/Sign", labelZh: "板料" },
  { id: "stamps", label: "Stamps", labelZh: "印章" },
  { id: "banner", label: "Banner", labelZh: "横幅" },
  { id: "hardware", label: "Hardware", labelZh: "配件" },
];

// ── Shared helpers ───────────────────────────────────────────────

const TYPE_COLORS = {
  "Adhesive Vinyl": "bg-blue-100 text-blue-800",
  "Non-Adhesive": "bg-green-100 text-green-800",
  "Banner": "bg-amber-100 text-amber-800",
};

function Badge({ type }) {
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${TYPE_COLORS[type] || "bg-gray-100 text-gray-700"}`}>
      {type}
    </span>
  );
}

function EditableCell({ value, field, type = "text", onSave }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value ?? "");

  useEffect(() => setVal(value ?? ""), [value]);

  const commit = () => {
    setEditing(false);
    let parsed = val;
    if (type === "number") parsed = val === "" ? null : Number(val);
    if (parsed !== value) onSave(field, parsed);
  };

  if (!editing) {
    return (
      <span
        onClick={() => setEditing(true)}
        className="cursor-pointer rounded px-1 py-0.5 hover:bg-gray-100"
        title="Click to edit"
      >
        {type === "number" && value != null ? (
          field.includes("cost") || field.includes("Cost") || field === "rollCost"
            ? `$${Number(value).toFixed(field === "costPerSqft" ? 4 : 2)}`
            : Number(value).toLocaleString()
        ) : (
          value || <span className="text-gray-300">-</span>
        )}
      </span>
    );
  }

  return (
    <input
      type={type}
      step={type === "number" ? "any" : undefined}
      value={val}
      onChange={(e) => setVal(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => e.key === "Enter" && commit()}
      autoFocus
      className="w-full rounded border border-blue-400 bg-blue-50 px-1.5 py-0.5 text-sm font-mono focus:outline-none"
    />
  );
}

// ── Reusable: Pricing Parameters Editor ──────────────────────────
// Takes an array of parameter definitions and reads/writes Settings API.

function PricingParamCard({ title, titleZh, color = "blue", params }) {
  const [values, setValues] = useState({});
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    // Initialize from defaults
    const defaults = {};
    for (const p of params) defaults[p.key] = p.defaultValue;
    // Fetch current values from settings API
    fetch("/api/admin/settings")
      .then((r) => r.ok ? r.json() : {})
      .then((data) => {
        const merged = { ...defaults };
        for (const p of params) {
          if (data[p.key] != null) merged[p.key] = Number(data[p.key]);
        }
        setValues(merged);
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const payload = {};
      for (const p of params) payload[p.key] = values[p.key];
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setMessage("Saved!");
        setTimeout(() => setMessage(null), 2000);
      } else {
        setMessage("Save failed");
      }
    } catch {
      setMessage("Save failed");
    } finally {
      setSaving(false);
    }
  };

  const borderColor = `border-${color}-200`;
  const bgColor = `bg-${color}-50`;
  const titleColor = `text-${color}-900`;
  const labelColor = `text-${color}-700`;

  if (!loaded) return <div className="h-20 animate-pulse rounded-xl bg-gray-100" />;

  return (
    <div className={`rounded-xl border ${borderColor} ${bgColor} p-4`}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className={`text-sm font-bold ${titleColor}`}>{title}</h3>
          {titleZh && <p className="text-xs text-gray-500">{titleZh}</p>}
        </div>
        <div className="flex items-center gap-2">
          {message && <span className="text-xs text-green-600 font-medium">{message}</span>}
          <button onClick={handleSave} disabled={saving}
            className={`rounded-lg bg-${color}-700 px-4 py-1.5 text-xs font-bold text-[#fff] hover:bg-${color}-800 disabled:opacity-50`}>
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
      <div className="space-y-2">
        {params.map((p) => (
          <div key={p.key} className="flex items-center gap-2">
            <label className={`w-48 text-xs ${labelColor} shrink-0`}>
              {p.label}
              {p.labelZh && <span className="text-gray-400 ml-1">({p.labelZh})</span>}
            </label>
            <input
              type="number"
              step={p.step || "0.01"}
              value={values[p.key] ?? p.defaultValue}
              onChange={(e) => setValues((prev) => ({ ...prev, [p.key]: Number(e.target.value) }))}
              className="w-28 rounded border border-gray-300 px-2 py-1 text-sm font-mono focus:border-blue-500 focus:outline-none"
            />
            {p.unit && <span className="text-xs text-gray-400">{p.unit}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── InkSettingsCard (existing) ───────────────────────────────────

function InkSettingsCard({ ink, onSave }) {
  const [costPerLiter, setCostPerLiter] = useState(ink.inkCostPerLiter);
  const [mlPerSqft, setMlPerSqft] = useState(ink.inkMlPerSqft);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setCostPerLiter(ink.inkCostPerLiter);
    setMlPerSqft(ink.inkMlPerSqft);
  }, [ink]);

  const computed = (costPerLiter / 1000) * mlPerSqft;

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/materials/ink-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inkCostPerLiter: costPerLiter, inkMlPerSqft: mlPerSqft }),
      });
      if (res.ok) onSave(await res.json());
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl border border-purple-200 bg-purple-50 p-4">
      <h3 className="mb-3 text-sm font-bold text-purple-900">Ink Cost Settings</h3>
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-xs text-purple-700">Cost per Liter (CAD)</label>
          <input type="number" step="0.01" value={costPerLiter} onChange={(e) => setCostPerLiter(Number(e.target.value))}
            className="mt-1 w-28 rounded-lg border border-purple-300 px-3 py-1.5 text-sm font-mono focus:border-purple-500 focus:outline-none" />
        </div>
        <div>
          <label className="block text-xs text-purple-700">ml per sqft</label>
          <input type="number" step="0.1" value={mlPerSqft} onChange={(e) => setMlPerSqft(Number(e.target.value))}
            className="mt-1 w-24 rounded-lg border border-purple-300 px-3 py-1.5 text-sm font-mono focus:border-purple-500 focus:outline-none" />
        </div>
        <div className="rounded-lg bg-purple-100 px-3 py-1.5">
          <span className="text-xs text-purple-600">= </span>
          <span className="text-sm font-bold text-purple-900">${computed.toFixed(4)}/sqft</span>
        </div>
        <button onClick={handleSave} disabled={saving}
          className="rounded-lg bg-purple-700 px-4 py-1.5 text-xs font-bold text-[#fff] hover:bg-purple-800 disabled:opacity-50">
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}

// ── TiersEditor (existing) ───────────────────────────────────────

function TiersEditor({ label, tiers, onChange, maxKey = "maxSqft", unit = "sqft", factorUnit = "x", factorStep = "0.1" }) {
  const updateTier = (idx, field, val) => {
    const next = tiers.map((t, i) => i === idx ? { ...t, [field]: Number(val) } : t);
    onChange(next);
  };
  const addTier = () => {
    const last = tiers[tiers.length - 1];
    onChange([...tiers, { [maxKey]: (last?.[maxKey] || 36) + 20, factor: Math.max((last?.factor || 2.0) - 0.2, 0.3) }]);
  };
  const removeTier = (idx) => {
    if (tiers.length <= 1) return;
    onChange(tiers.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-semibold text-gray-600">{label}</p>
      {tiers.map((t, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="text-xs text-gray-400 w-8 shrink-0">{i === 0 ? "0 -" : `${tiers[i - 1][maxKey]} -`}</span>
          <input type="number" step="1" value={t[maxKey]}
            onChange={(e) => updateTier(i, maxKey, e.target.value)}
            className="w-20 rounded border border-gray-300 px-2 py-1 text-sm font-mono focus:border-blue-500 focus:outline-none" />
          <span className="text-xs text-gray-400">{unit}</span>
          <input type="number" step={factorStep} value={t.factor}
            onChange={(e) => updateTier(i, "factor", e.target.value)}
            className="w-20 rounded border border-gray-300 px-2 py-1 text-sm font-mono focus:border-blue-500 focus:outline-none" />
          <span className="text-xs text-gray-400">{factorUnit}</span>
          {tiers.length > 1 && (
            <button onClick={() => removeTier(i)} className="text-gray-400 hover:text-red-500 text-xs">x</button>
          )}
        </div>
      ))}
      <button onClick={addTier} className="text-xs text-blue-600 hover:text-blue-800">+ Add tier</button>
    </div>
  );
}

// ── FormulaCard (existing) ───────────────────────────────────────

function FormulaCard({ data, setData, loading }) {
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(true);

  const save = async (patch) => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/materials/formula", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (res.ok) {
        const { config } = await res.json();
        setData((prev) => ({ ...prev, ...config }));
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading || !data) return null;

  const defaultRetailTiers = [
    { maxSqft: 4, factor: 3.0 },
    { maxSqft: 12, factor: 2.5 },
    { maxSqft: 36, factor: 2.2 },
    { maxSqft: 9999, factor: 2.0 },
  ];
  const defaultB2bTiers = [
    { maxSqft: 4, factor: 2.2 },
    { maxSqft: 12, factor: 1.8 },
    { maxSqft: 36, factor: 1.6 },
    { maxSqft: 9999, factor: 1.5 },
  ];

  const F = ({ label, value, onChange, unit, step = "0.01" }) => (
    <div className="flex items-center gap-2">
      <label className="w-40 text-xs text-gray-600 shrink-0">{label}</label>
      <input type="number" step={step} value={value} onChange={onChange}
        className="w-24 rounded border border-gray-300 px-2 py-1 text-sm font-mono focus:border-blue-500 focus:outline-none" />
      {unit && <span className="text-xs text-gray-400">{unit}</span>}
    </div>
  );

  return (
    <div className="rounded-xl border border-orange-200 bg-orange-50 p-4">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between">
        <h3 className="text-sm font-bold text-orange-900">Pricing Formula (COST_PLUS)</h3>
        <svg className={`h-4 w-4 text-orange-500 transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
      {open && (
        <div className="mt-4 space-y-4">
          <p className="text-xs text-orange-700">price = roundTo99((material + ink + labor + cutting) x (1 + waste) x areaMarkup + fileFee)</p>

          <div className="rounded-lg bg-white p-3 space-y-3">
            <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">Markup (by area)</p>
            <F label="Minimum Markup Floor" value={data.markup?.floor ?? 1.5}
              onChange={(e) => setData((p) => ({ ...p, markup: { ...p.markup, floor: Number(e.target.value) } }))} unit="x" step="0.1" />
            <TiersEditor
              label="Retail Tiers"
              tiers={data.markup?.retailTiers || defaultRetailTiers}
              onChange={(tiers) => setData((p) => ({ ...p, markup: { ...p.markup, retailTiers: tiers } }))}
            />
            <TiersEditor
              label="B2B Tiers"
              tiers={data.markup?.b2bTiers || defaultB2bTiers}
              onChange={(tiers) => setData((p) => ({ ...p, markup: { ...p.markup, b2bTiers: tiers } }))}
            />
          </div>

          <div className="rounded-lg bg-white p-3 space-y-3">
            <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">Waste (by area)</p>
            <TiersEditor
              label="Waste % Tiers"
              tiers={data.waste?.tiers || [{ maxSqft: 2, factor: 15 }, { maxSqft: 16, factor: 8 }, { maxSqft: 50, factor: 5 }, { maxSqft: 9999, factor: 4 }]}
              onChange={(tiers) => setData((p) => ({ ...p, waste: { ...p.waste, tiers } }))}
            />
            <p className="text-xs font-bold text-gray-700 uppercase tracking-wider mt-4">Machine Labor</p>
            <F label="Hourly Rate" value={data.machineLabor?.hourlyRate ?? 60}
              onChange={(e) => setData((p) => ({ ...p, machineLabor: { hourlyRate: Number(e.target.value) } }))} unit="$/hr" />
          </div>

          <div className="rounded-lg bg-white p-3 space-y-3">
            <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">Quantity Efficiency</p>
            <p className="text-xs text-gray-500">Large runs cost less per piece. 1.0 = full cost, 0.5 = half.</p>
            <TiersEditor
              label="Qty Efficiency"
              tiers={data.qtyEfficiency?.tiers || [{ maxQty: 2, factor: 1.0 }, { maxQty: 10, factor: 0.8 }, { maxQty: 50, factor: 0.5 }, { maxQty: 9999, factor: 0.35 }]}
              onChange={(tiers) => setData((p) => ({ ...p, qtyEfficiency: { ...p.qtyEfficiency, tiers } }))}
              maxKey="maxQty" unit="pcs" factorUnit="x" factorStep="0.05"
            />
          </div>

          <div className="rounded-lg bg-white p-3 space-y-2">
            <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">Cutting</p>
            <F label="Rectangular" value={data.cutting?.rectangularPerFt ?? 0.5}
              onChange={(e) => setData((p) => ({ ...p, cutting: { ...p.cutting, rectangularPerFt: Number(e.target.value) } }))} unit="$/ft" />
            <F label="Contour" value={data.cutting?.contourPerSqft ?? 2.0}
              onChange={(e) => setData((p) => ({ ...p, cutting: { ...p.cutting, contourPerSqft: Number(e.target.value) } }))} unit="$/sqft" />
            <F label="Contour Minimum" value={data.cutting?.contourMinimum ?? 15}
              onChange={(e) => setData((p) => ({ ...p, cutting: { ...p.cutting, contourMinimum: Number(e.target.value) } }))} unit="$" />
          </div>

          <div className="rounded-lg bg-white p-3 space-y-2">
            <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">Fees</p>
            <F label="File / Setup Fee" value={data.fileFee ?? 10}
              onChange={(e) => setData((p) => ({ ...p, fileFee: Number(e.target.value) }))} unit="$" />
            <F label="Minimum Price" value={data.minimumPrice ?? 25}
              onChange={(e) => setData((p) => ({ ...p, minimumPrice: Number(e.target.value) }))} unit="$" />
          </div>

          <div className="rounded-lg bg-white p-3 space-y-2">
            <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">Ink Cost by Print Mode</p>
            {Object.entries(data.inkCosts || {}).map(([key, ink]) => (
              <div key={key} className="flex items-center gap-2">
                <span className="w-40 text-xs text-gray-600 shrink-0">{ink.label || key}</span>
                <input type="number" step="0.001" value={ink.inkPerSqft}
                  onChange={(e) => setData((p) => ({
                    ...p, inkCosts: { ...p.inkCosts, [key]: { ...p.inkCosts[key], inkPerSqft: Number(e.target.value) } }
                  }))}
                  className="w-24 rounded border border-gray-300 px-2 py-1 text-sm font-mono focus:border-blue-500 focus:outline-none" />
                <span className="text-xs text-gray-400">$/sqft</span>
                <input type="number" step="1" value={ink.sqmPerHour}
                  onChange={(e) => setData((p) => ({
                    ...p, inkCosts: { ...p.inkCosts, [key]: { ...p.inkCosts[key], sqmPerHour: Number(e.target.value) } }
                  }))}
                  className="w-20 rounded border border-gray-300 px-2 py-1 text-sm font-mono focus:border-blue-500 focus:outline-none" />
                <span className="text-xs text-gray-400">sqm/hr</span>
              </div>
            ))}
          </div>

          <button onClick={() => save(data)} disabled={saving}
            className="rounded-lg bg-orange-700 px-6 py-2 text-sm font-bold text-[#fff] hover:bg-orange-800 disabled:opacity-50">
            {saving ? "Saving..." : "Save All Formula Settings"}
          </button>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// TAB 1: Materials (existing material table + ink settings)
// ═══════════════════════════════════════════════════════════════════

function MaterialsTab({ materials, inkSettings, setInkSettings, saving, filterType, setFilterType, types, filtered, totals, handleCellSave, handleAdd, handleDelete }) {
  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border bg-white p-4">
          <p className="text-xs text-gray-500">Total Materials</p>
          <p className="text-2xl font-black">{totals.count}</p>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <p className="text-xs text-gray-500">Avg Cost/sqft</p>
          <p className="text-2xl font-black">${totals.avgCost.toFixed(2)}</p>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <p className="text-xs text-gray-500">Ink Cost/sqft</p>
          <p className="text-2xl font-black">${inkSettings.inkCostPerSqft.toFixed(3)}</p>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <p className="text-xs text-gray-500">Total Roll Value</p>
          <p className="text-2xl font-black">${totals.totalRollValue.toLocaleString("en-CA", { minimumFractionDigits: 0 })}</p>
        </div>
      </div>

      <InkSettingsCard ink={inkSettings} onSave={setInkSettings} />

      {/* Filter + Add */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button onClick={() => setFilterType("all")}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold ${filterType === "all" ? "bg-gray-900 text-[#fff]" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
            All ({materials.length})
          </button>
          {types.map((t) => (
            <button key={t} onClick={() => setFilterType(t)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold ${filterType === t ? "bg-gray-900 text-[#fff]" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
              {t} ({materials.filter((m) => m.type === t).length})
            </button>
          ))}
        </div>
        <button onClick={handleAdd}
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-bold text-[#fff] hover:bg-gray-800">
          + Add Material
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-[11px] font-bold uppercase tracking-wider text-gray-500">
              <th className="px-3 py-2.5 w-8">#</th>
              <th className="px-3 py-2.5">Type</th>
              <th className="px-3 py-2.5">Material</th>
              <th className="px-3 py-2.5">Family</th>
              <th className="px-3 py-2.5">Roll Spec</th>
              <th className="px-3 py-2.5 text-right">Width&quot;</th>
              <th className="px-3 py-2.5 text-right">Length ft</th>
              <th className="px-3 py-2.5">Thickness</th>
              <th className="px-3 py-2.5">Texture</th>
              <th className="px-3 py-2.5 text-right">Roll Cost</th>
              <th className="px-3 py-2.5 text-right">Sqft/Roll</th>
              <th className="px-3 py-2.5 text-right font-black text-gray-900">$/sqft</th>
              <th className="px-3 py-2.5 text-right">$/m&sup2;</th>
              <th className="px-3 py-2.5">Lamination</th>
              <th className="px-3 py-2.5">Print Mode</th>
              <th className="px-3 py-2.5 w-8"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((m) => (
              <tr key={m.id} className={`border-b transition-colors hover:bg-blue-50/50 ${saving === m.id ? "bg-yellow-50" : ""}`}>
                <td className="px-3 py-2 text-xs text-gray-400 font-mono">{m.sortOrder}</td>
                <td className="px-3 py-2"><Badge type={m.type} /></td>
                <td className="px-3 py-2 font-medium text-gray-900">
                  <EditableCell value={m.name} field="name" onSave={(f, v) => handleCellSave(m.id, f, v)} />
                </td>
                <td className="px-3 py-2 text-gray-600">
                  <EditableCell value={m.family} field="family" onSave={(f, v) => handleCellSave(m.id, f, v)} />
                </td>
                <td className="px-3 py-2 text-xs text-gray-500 font-mono max-w-[180px] truncate" title={m.rollSpec}>
                  {m.rollSpec || "-"}
                </td>
                <td className="px-3 py-2 text-right font-mono text-xs">
                  <EditableCell value={m.widthIn} field="widthIn" type="number" onSave={(f, v) => handleCellSave(m.id, f, v)} />
                </td>
                <td className="px-3 py-2 text-right font-mono text-xs">
                  <EditableCell value={m.lengthFt} field="lengthFt" type="number" onSave={(f, v) => handleCellSave(m.id, f, v)} />
                </td>
                <td className="px-3 py-2 text-xs">
                  <EditableCell value={m.thickness} field="thickness" onSave={(f, v) => handleCellSave(m.id, f, v)} />
                </td>
                <td className="px-3 py-2 text-xs">
                  <EditableCell value={m.texture} field="texture" onSave={(f, v) => handleCellSave(m.id, f, v)} />
                </td>
                <td className="px-3 py-2 text-right font-mono">
                  <EditableCell value={m.rollCost} field="rollCost" type="number" onSave={(f, v) => handleCellSave(m.id, f, v)} />
                </td>
                <td className="px-3 py-2 text-right font-mono text-xs">
                  <EditableCell value={m.sqftPerRoll} field="sqftPerRoll" type="number" onSave={(f, v) => handleCellSave(m.id, f, v)} />
                </td>
                <td className="px-3 py-2 text-right">
                  <span className="font-mono font-bold text-gray-900">
                    <EditableCell value={m.costPerSqft} field="costPerSqft" type="number" onSave={(f, v) => handleCellSave(m.id, f, v)} />
                  </span>
                </td>
                <td className="px-3 py-2 text-right font-mono text-xs text-gray-500">
                  ${m.costPerSqm?.toFixed(2) || "0.00"}
                </td>
                <td className="px-3 py-2 text-xs">
                  <EditableCell value={m.lamination} field="lamination" onSave={(f, v) => handleCellSave(m.id, f, v)} />
                </td>
                <td className="px-3 py-2 text-xs">
                  <EditableCell value={m.printMode} field="printMode" onSave={(f, v) => handleCellSave(m.id, f, v)} />
                </td>
                <td className="px-3 py-2">
                  <button onClick={() => handleDelete(m.id, m.name)}
                    className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600" title="Delete">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-sm text-gray-400 py-8">No materials found.</p>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// TAB 2: Large Format (COST_PLUS formula + simulator + sticker params)
// ═══════════════════════════════════════════════════════════════════

const LARGE_FORMAT_PARAMS = [
  { key: "pricing.setup.sticker", label: "Sticker Setup Fee", labelZh: "贴纸设置费", defaultValue: 12.00, unit: "$", step: "0.50" },
  { key: "pricing.surcharge.customShape", label: "Custom Shape Surcharge", labelZh: "自定义形状加价", defaultValue: 0.15, unit: "(0.15 = 15%)", step: "0.01" },
  { key: "pricing.ink.whiteColor", label: "White+Color Multiplier", labelZh: "白+彩倍率", defaultValue: 1.30, unit: "x", step: "0.05" },
  { key: "pricing.ink.colorWhiteColor", label: "Color+White+Color Multiplier", labelZh: "彩+白+彩倍率", defaultValue: 1.60, unit: "x", step: "0.05" },
  { key: "pricing.material.holographic", label: "Holographic Markup", labelZh: "全息材料加价", defaultValue: 1.35, unit: "x", step: "0.05" },
  { key: "pricing.minPrice.stickers", label: "Min Price (Stickers)", labelZh: "贴纸最低价", defaultValue: 25.00, unit: "$", step: "1.00" },
  { key: "pricing.minPrice.general", label: "Min Price (General)", labelZh: "通用最低价", defaultValue: 15.00, unit: "$", step: "1.00" },
];

function LargeFormatTab({ formulaConfig, setFormulaConfig, formulaLoading, materials }) {
  return (
    <div className="space-y-6">
      <FormulaCard data={formulaConfig} setData={setFormulaConfig} loading={formulaLoading} />
      <QuoteSimulatorCard formulaConfig={formulaConfig} materials={materials} />
      <PricingParamCard
        title="Sticker & Vinyl Parameters"
        titleZh="贴纸/乙烯基参数"
        color="blue"
        params={LARGE_FORMAT_PARAMS}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// TAB 3: Paper Print (processing costs + surcharges)
// ═══════════════════════════════════════════════════════════════════

const PAPER_PRINT_PARAMS = [
  { key: "pricing.ink.colorClick", label: "Color Ink per Click", labelZh: "彩色墨水/click", defaultValue: 0.05, unit: "$", step: "0.01" },
  { key: "pricing.surcharge.doubleSided", label: "Double-Sided Multiplier", labelZh: "双面加价倍率", defaultValue: 1.20, unit: "x", step: "0.05" },
  { key: "pricing.surcharge.foilFull", label: "Foil Full Coverage", labelZh: "金箔全面烫", defaultValue: 1.30, unit: "x", step: "0.05" },
  { key: "pricing.surcharge.foilBothSides", label: "Foil Both Sides", labelZh: "金箔双面", defaultValue: 1.50, unit: "x", step: "0.05" },
  { key: "pricing.labor.scoring", label: "Scoring", labelZh: "压痕", defaultValue: 0.01, unit: "$/pc", step: "0.005" },
  { key: "pricing.labor.saddleStitch", label: "Saddle Stitch", labelZh: "骑马钉", defaultValue: 0.15, unit: "$/pc", step: "0.01" },
  { key: "pricing.labor.perfectBind", label: "Perfect Bind", labelZh: "胶装", defaultValue: 0.50, unit: "$/pc", step: "0.05" },
  { key: "pricing.labor.coilBind", label: "Coil Bind", labelZh: "线圈装", defaultValue: 0.75, unit: "$/pc", step: "0.05" },
  { key: "pricing.labor.roundedCorner", label: "Rounded Corner", labelZh: "圆角", defaultValue: 0.02, unit: "$/corner", step: "0.005" },
  { key: "pricing.labor.holePunch", label: "Hole Punch", labelZh: "打孔", defaultValue: 0.01, unit: "$/pc", step: "0.005" },
  { key: "pricing.labor.fold", label: "Fold", labelZh: "折叠", defaultValue: 0.01, unit: "$/fold/pc", step: "0.005" },
];

function PaperPrintTab() {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <h3 className="text-sm font-bold text-gray-900 mb-2">Paper Print Pricing 纸品定价</h3>
        <p className="text-xs text-gray-500 mb-4">
          price = (paper + ink + lamination + finishing) x doubleSidedMultiplier / (1 - margin)
        </p>
        <p className="text-xs text-gray-400">
          These parameters control cost calculations for business cards, postcards, flyers, brochures, booklets, notepads, letterhead, etc.
        </p>
      </div>
      <PricingParamCard
        title="Processing Costs & Surcharges"
        titleZh="加工费与附加费"
        color="indigo"
        params={PAPER_PRINT_PARAMS}
      />
      <PricingBreakdownSimulator
        presets={[
          { label: "Business Card", slug: "classic-business-cards", widthIn: 3.5, heightIn: 2, material: "14pt-gloss", sizeLabel: '3.5" x 2" - Double Sided' },
          { label: "Postcard (Single)", slug: "postcards", widthIn: 6, heightIn: 4, material: "14pt-gloss", options: { doubleSided: false } },
          { label: "Postcard (Double)", slug: "postcards", widthIn: 6, heightIn: 4, material: "14pt-gloss", options: { doubleSided: true } },
          { label: "Flyer", slug: "flyers", widthIn: 8.5, heightIn: 11, material: "100lb-gloss-text" },
          { label: "Poster (Gloss)", slug: "posters", widthIn: 24, heightIn: 36, material: "100lb-gloss" },
        ]}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// TAB 4: Board/Sign (labor costs)
// ═══════════════════════════════════════════════════════════════════

const BOARD_SIGN_PARAMS = [
  { key: "pricing.labor.boardCut", label: "Board Cutting", labelZh: "板材切割", defaultValue: 0.50, unit: "$/pc", step: "0.05" },
  { key: "pricing.labor.faceSmall", label: "Face Application (<=2 sqft)", labelZh: "贴面≤2sqft", defaultValue: 0.50, unit: "$/pc", step: "0.05" },
  { key: "pricing.labor.faceMedium", label: "Face Application (2-6 sqft)", labelZh: "贴面2-6sqft", defaultValue: 0.75, unit: "$/pc", step: "0.05" },
  { key: "pricing.labor.faceLarge", label: "Face Application (>6 sqft)", labelZh: "贴面>6sqft", defaultValue: 1.00, unit: "$/pc", step: "0.05" },
];

function BoardSignTab() {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <h3 className="text-sm font-bold text-gray-900 mb-2">Board / Sign Pricing 板料定价</h3>
        <p className="text-xs text-gray-500 mb-4">
          price = (board + vinyl face + ink + labor) / (1 - margin)
        </p>
        <p className="text-xs text-gray-400">
          Covers Coroplast, Foam Board, PVC board signs. Board cost comes from material table, vinyl face cost from material table.
        </p>
      </div>
      <PricingParamCard
        title="Board Labor Costs"
        titleZh="板材加工费"
        color="violet"
        params={BOARD_SIGN_PARAMS}
      />
      <PricingBreakdownSimulator
        presets={[
          { label: "Yard Sign (Coroplast)", slug: "yard-signs", widthIn: 24, heightIn: 18, material: "4mm-coroplast" },
          { label: "Foam Board Sign", slug: "foam-board-prints", widthIn: 18, heightIn: 24, material: "3-16in-foam" },
        ]}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// TAB 5: Stamps (fixed per-model pricing)
// ═══════════════════════════════════════════════════════════════════

const STAMP_PARAMS = [
  { key: "pricing.stamp.S510", label: 'S-510 (0.5" x 0.5")', labelZh: "小方章", defaultValue: 19.99, unit: "$", step: "0.50" },
  { key: "pricing.stamp.S520", label: 'S-520 (0.75" x 0.75")', labelZh: "方章", defaultValue: 24.99, unit: "$", step: "0.50" },
  { key: "pricing.stamp.S542", label: 'S-542 (1.625" x 1.625")', labelZh: "大方章", defaultValue: 44.99, unit: "$", step: "0.50" },
  { key: "pricing.stamp.S827", label: 'S-827 (1.1875" x 2")', labelZh: "长方章", defaultValue: 39.99, unit: "$", step: "0.50" },
  { key: "pricing.stamp.R512", label: 'R-512 (0.5" Round)', labelZh: "小圆章", defaultValue: 19.99, unit: "$", step: "0.50" },
  { key: "pricing.stamp.R524", label: 'R-524 (1" Round)', labelZh: "圆章", defaultValue: 27.99, unit: "$", step: "0.50" },
  { key: "pricing.stamp.R532", label: 'R-532 (1.25" Round)', labelZh: "大圆章", defaultValue: 34.99, unit: "$", step: "0.50" },
  { key: "pricing.stamp.R552", label: 'R-552 (2" Round)', labelZh: "特大圆章", defaultValue: 59.99, unit: "$", step: "0.50" },
];

function StampsTab() {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <h3 className="text-sm font-bold text-gray-900 mb-2">Stamp Pricing 印章定价</h3>
        <p className="text-xs text-gray-500">
          Self-inking stamps use fixed per-model pricing. Each model has a set price regardless of quantity.
        </p>
      </div>
      <PricingParamCard
        title="Stamp Model Prices"
        titleZh="印章型号价格"
        color="rose"
        params={STAMP_PARAMS}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// TAB 6: Banner (setup fees + finishing + accessories)
// ═══════════════════════════════════════════════════════════════════

const BANNER_PARAMS = [
  { key: "pricing.banner.polePocket", label: "Pole Pocket", labelZh: "杆套", defaultValue: 0.50, unit: "$/ea", step: "0.05" },
  { key: "pricing.banner.windSlit", label: "Wind Slit", labelZh: "风口", defaultValue: 0.25, unit: "$/ea", step: "0.05" },
  { key: "pricing.banner.setup1_2", label: "Setup Fee (1-2 pcs)", labelZh: "设置费1-2个", defaultValue: 28, unit: "$", step: "1" },
  { key: "pricing.banner.setup3_5", label: "Setup Fee (3-5 pcs)", labelZh: "设置费3-5个", defaultValue: 15, unit: "$", step: "1" },
  { key: "pricing.banner.setup6plus", label: "Setup Fee (6+ pcs)", labelZh: "设置费6+个", defaultValue: 10, unit: "$", step: "1" },
  { key: "pricing.accessories.markup", label: "Accessory Markup", labelZh: "配件加价倍率", defaultValue: 2.5, unit: "x cost", step: "0.1" },
  { key: "pricing.minPrice.canvas", label: "Min Price (Canvas)", labelZh: "画布最低价", defaultValue: 49.00, unit: "$", step: "1" },
];

function BannerTab() {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <h3 className="text-sm font-bold text-gray-900 mb-2">Banner & Display Pricing 横幅定价</h3>
        <p className="text-xs text-gray-500 mb-4">
          price = (material + ink + finishing) / (1 - margin) + setupFee + accessories x markup
        </p>
        <p className="text-xs text-gray-400">
          Covers vinyl banners, mesh banners, retractable banners, X-frame stands. Also includes canvas min price.
        </p>
      </div>
      <PricingParamCard
        title="Banner Fees & Finishing"
        titleZh="横幅设置费与加工"
        color="amber"
        params={BANNER_PARAMS}
      />
      <PricingBreakdownSimulator
        presets={[
          { label: "Vinyl Banner (6'x3')", slug: "vinyl-banners", widthIn: 72, heightIn: 36, material: "13oz-vinyl" },
          { label: "Mesh Banner (4'x8')", slug: "mesh-banners", widthIn: 48, heightIn: 96, material: "mesh-vinyl" },
          { label: "Retractable Banner", slug: "retractable-banners", widthIn: 33, heightIn: 81, material: "13oz-vinyl" },
        ]}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// PRICING BREAKDOWN SIMULATOR (calls /api/pricing/calculate)
// ═══════════════════════════════════════════════════════════════════

const SIMULATOR_PRESETS = [
  { label: "Sticker (Die-Cut)", slug: "custom-stickers", widthIn: 3, heightIn: 3, material: "white-vinyl", options: { cutType: "die_cut", isSticker: true } },
  { label: "Business Card", slug: "classic-business-cards", widthIn: 3.5, heightIn: 2, material: "14pt-gloss", sizeLabel: '3.5" x 2" - Double Sided' },
  { label: "Postcard (Single)", slug: "postcards", widthIn: 6, heightIn: 4, material: "14pt-gloss", options: { doubleSided: false } },
  { label: "Postcard (Double)", slug: "postcards", widthIn: 6, heightIn: 4, material: "14pt-gloss", options: { doubleSided: true } },
  { label: "Yard Sign (Coroplast)", slug: "yard-signs", widthIn: 24, heightIn: 18, material: "4mm-coroplast" },
  { label: "Vinyl Banner", slug: "vinyl-banners", widthIn: 72, heightIn: 36, material: "13oz-vinyl" },
  { label: "Poster (Gloss)", slug: "posters", widthIn: 24, heightIn: 36, material: "100lb-gloss" },
  { label: "Flyer", slug: "flyers", widthIn: 8.5, heightIn: 11, material: "100lb-gloss-text" },
];

function PricingBreakdownSimulator({ presets = SIMULATOR_PRESETS }) {
  const [preset, setPreset] = useState(0);
  const [quantity, setQuantity] = useState(100);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const calculate = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    const p = presets[preset];
    try {
      const body = {
        slug: p.slug,
        widthIn: p.widthIn,
        heightIn: p.heightIn,
        quantity,
        material: p.material,
        options: p.options || {},
      };
      if (p.sizeLabel) body.sizeLabel = p.sizeLabel;
      const res = await fetch("/api/pricing/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Pricing failed");
      } else {
        setResult(data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fmt = (cents) => `$${(cents / 100).toFixed(2)}`;

  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
      <h3 className="text-sm font-bold text-emerald-900 mb-3">Pricing Breakdown Simulator</h3>
      <p className="text-xs text-emerald-700 mb-4">Select a product type, enter quantity, and see the full price breakdown.</p>

      <div className="flex flex-wrap items-end gap-3 mb-4">
        <div>
          <label className="block text-xs text-emerald-700">Product</label>
          <select
            value={preset}
            onChange={(e) => setPreset(Number(e.target.value))}
            className="mt-1 rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-sm focus:border-emerald-500 focus:outline-none"
          >
            {presets.map((p, i) => (
              <option key={i} value={i}>{p.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-emerald-700">Quantity</label>
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value) || 1)}
            className="mt-1 w-24 rounded-lg border border-emerald-300 px-3 py-1.5 text-sm font-mono focus:border-emerald-500 focus:outline-none"
          />
        </div>
        <button
          onClick={calculate}
          disabled={loading}
          className="rounded-lg bg-emerald-700 px-5 py-1.5 text-sm font-bold text-[#fff] hover:bg-emerald-800 disabled:opacity-50"
        >
          {loading ? "Calculating..." : "Calculate"}
        </button>
      </div>

      {error && <p className="text-xs text-red-600 mb-2">{error}</p>}

      {result && (
        <div className="rounded-lg bg-white border border-emerald-100 p-3">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-gray-500 uppercase">Template: {result.template}</span>
            <span className="text-lg font-black text-emerald-800">{fmt(result.totalCents)}</span>
          </div>

          {/* Breakdown table */}
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-gray-400 border-b">
                <th className="pb-1">Component</th>
                <th className="pb-1 text-right">Value</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(result.breakdown || {}).map(([key, val]) => (
                <tr key={key} className="border-b border-gray-50">
                  <td className="py-1 text-gray-600">{key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}</td>
                  <td className="py-1 text-right font-mono">
                    {typeof val === "number" && key !== "profitMargin"
                      ? fmt(val)
                      : typeof val === "number"
                        ? `${(val * 100).toFixed(0)}%`
                        : String(val)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Meta info */}
          {result.meta && Object.keys(result.meta).length > 0 && (
            <div className="mt-2 pt-2 border-t border-gray-100">
              <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Details</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-gray-500">
                {Object.entries(result.meta).filter(([, v]) => v != null).map(([key, val]) => (
                  <span key={key}>
                    <span className="font-medium text-gray-600">{key}:</span>{" "}
                    {typeof val === "object" ? JSON.stringify(val) : String(val)}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mt-2 pt-2 border-t border-gray-100 flex justify-between text-xs">
            <span className="text-gray-500">Unit price:</span>
            <span className="font-bold">{fmt(result.unitCents)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════

export default function MaterialsPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("materials");
  const [materials, setMaterials] = useState([]);
  const [inkSettings, setInkSettings] = useState({ inkCostPerLiter: 234, inkMlPerSqft: 1, inkCostPerSqft: 0.234 });
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("all");
  const [saving, setSaving] = useState(null);
  const [formulaConfig, setFormulaConfig] = useState(null);
  const [formulaLoading, setFormulaLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/materials");
      if (!res.ok) return;
      const data = await res.json();
      setMaterials(data.materials);
      setInkSettings(data.inkSettings);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    fetch("/api/admin/materials/formula")
      .then((r) => r.json())
      .then(setFormulaConfig)
      .finally(() => setFormulaLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (filterType === "all") return materials;
    return materials.filter((m) => m.type === filterType);
  }, [materials, filterType]);

  const types = useMemo(() => {
    const set = new Set(materials.map((m) => m.type));
    return [...set];
  }, [materials]);

  const handleCellSave = async (materialId, field, value) => {
    setSaving(materialId);
    try {
      const body = { id: materialId, [field]: value };
      if (field === "rollCost" || field === "sqftPerRoll") {
        const mat = materials.find((m) => m.id === materialId);
        if (mat) {
          body.rollCost = field === "rollCost" ? value : mat.rollCost;
          body.sqftPerRoll = field === "sqftPerRoll" ? value : mat.sqftPerRoll;
        }
      }
      const res = await fetch("/api/admin/materials", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const { material } = await res.json();
        setMaterials((prev) => prev.map((m) => (m.id === materialId ? material : m)));
      }
    } finally {
      setSaving(null);
    }
  };

  const handleAdd = async () => {
    const maxSort = materials.reduce((max, m) => Math.max(max, m.sortOrder), 0);
    const res = await fetch("/api/admin/materials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sortOrder: maxSort + 1, type: filterType === "all" ? "Adhesive Vinyl" : filterType }),
    });
    if (res.ok) fetchData();
  };

  const handleDelete = async (id, name) => {
    if (!confirm(t("admin.materials.deleteConfirm").replace("{name}", name))) return;
    const res = await fetch(`/api/admin/materials?id=${id}`, { method: "DELETE" });
    if (res.ok) setMaterials((prev) => prev.filter((m) => m.id !== id));
  };

  const totals = useMemo(() => {
    const active = filtered.filter((m) => m.costPerSqft > 0);
    const avgCost = active.length > 0 ? active.reduce((s, m) => s + m.costPerSqft, 0) / active.length : 0;
    const totalRollValue = filtered.reduce((s, m) => s + m.rollCost, 0);
    return { count: filtered.length, avgCost, totalRollValue };
  }, [filtered]);

  if (loading) {
    return (
      <div className="p-8">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-12 animate-pulse rounded-lg bg-gray-100" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <ProductCenterBreadcrumb />
        <h1 className="text-xl font-semibold text-black">{t("admin.materials.title")}</h1>
        <p className="mt-0.5 text-sm text-[#999]">{t("admin.materials.subtitle")}</p>
      </div>
      <ProductCenterViewStrip activeView="materials" />

      {/* Tab Navigation */}
      <div className="flex gap-1 overflow-x-auto border-b border-gray-200 pb-px">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`shrink-0 rounded-t-lg px-4 py-2.5 text-sm font-bold transition-colors ${
              activeTab === tab.id
                ? "bg-white text-gray-900 border border-gray-200 border-b-white -mb-px"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
            {tab.label}
            <span className="ml-1 text-xs text-gray-400">{tab.labelZh}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "materials" && (
        <MaterialsTab
          materials={materials}
          inkSettings={inkSettings}
          setInkSettings={setInkSettings}
          saving={saving}
          filterType={filterType}
          setFilterType={setFilterType}
          types={types}
          filtered={filtered}
          totals={totals}
          handleCellSave={handleCellSave}
          handleAdd={handleAdd}
          handleDelete={handleDelete}
        />
      )}

      {activeTab === "large-format" && (
        <LargeFormatTab
          formulaConfig={formulaConfig}
          setFormulaConfig={setFormulaConfig}
          formulaLoading={formulaLoading}
          materials={materials}
        />
      )}

      {activeTab === "paper" && <PaperPrintTab />}
      {activeTab === "board" && <BoardSignTab />}
      {activeTab === "stamps" && <StampsTab />}
      {activeTab === "banner" && <BannerTab />}
      {activeTab === "hardware" && <HardwarePricingTable />}
    </div>
  );
}
