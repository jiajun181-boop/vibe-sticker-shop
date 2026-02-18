"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

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
          className="rounded-lg bg-purple-700 px-4 py-1.5 text-xs font-bold text-white hover:bg-purple-800 disabled:opacity-50">
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}

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

function FormulaCard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetch("/api/admin/materials/formula").then((r) => r.json()).then(setData).finally(() => setLoading(false));
  }, []);

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

          {/* Area-based Markup Tiers (interpolated — smooth curve) */}
          <div className="rounded-lg bg-white p-3 space-y-3">
            <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">Markup (by area — smooth interpolation)</p>
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

          {/* Waste Tiers (interpolated) + Labor */}
          <div className="rounded-lg bg-white p-3 space-y-3">
            <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">Waste (by area — smooth interpolation)</p>
            <TiersEditor
              label="Waste % Tiers"
              tiers={data.waste?.tiers || [{ maxSqft: 2, factor: 15 }, { maxSqft: 16, factor: 8 }, { maxSqft: 50, factor: 5 }, { maxSqft: 9999, factor: 4 }]}
              onChange={(tiers) => setData((p) => ({ ...p, waste: { ...p.waste, tiers } }))}
            />
            <p className="text-xs font-bold text-gray-700 uppercase tracking-wider mt-4">Machine Labor</p>
            <F label="Hourly Rate" value={data.machineLabor?.hourlyRate ?? 60}
              onChange={(e) => setData((p) => ({ ...p, machineLabor: { hourlyRate: Number(e.target.value) } }))} unit="$/hr" />
          </div>

          {/* Quantity Efficiency (bulk discount on labor+cutting) */}
          <div className="rounded-lg bg-white p-3 space-y-3">
            <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">Quantity Efficiency (labor+cutting discount)</p>
            <p className="text-xs text-gray-500">Large runs cost less per piece for labor & cutting. 1.0 = full cost, 0.5 = half.</p>
            <TiersEditor
              label="Qty Efficiency"
              tiers={data.qtyEfficiency?.tiers || [{ maxQty: 2, factor: 1.0 }, { maxQty: 10, factor: 0.8 }, { maxQty: 50, factor: 0.5 }, { maxQty: 9999, factor: 0.35 }]}
              onChange={(tiers) => setData((p) => ({ ...p, qtyEfficiency: { ...p.qtyEfficiency, tiers } }))}
              maxKey="maxQty" unit="pcs" factorUnit="x" factorStep="0.05"
            />
          </div>

          {/* Cutting */}
          <div className="rounded-lg bg-white p-3 space-y-2">
            <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">Cutting</p>
            <F label="Rectangular" value={data.cutting?.rectangularPerFt ?? 0.5}
              onChange={(e) => setData((p) => ({ ...p, cutting: { ...p.cutting, rectangularPerFt: Number(e.target.value) } }))} unit="$/ft" />
            <F label="Contour" value={data.cutting?.contourPerSqft ?? 2.0}
              onChange={(e) => setData((p) => ({ ...p, cutting: { ...p.cutting, contourPerSqft: Number(e.target.value) } }))} unit="$/sqft" />
            <F label="Contour Minimum" value={data.cutting?.contourMinimum ?? 15}
              onChange={(e) => setData((p) => ({ ...p, cutting: { ...p.cutting, contourMinimum: Number(e.target.value) } }))} unit="$" />
          </div>

          {/* Fees */}
          <div className="rounded-lg bg-white p-3 space-y-2">
            <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">Fees</p>
            <F label="File / Setup Fee" value={data.fileFee ?? 10}
              onChange={(e) => setData((p) => ({ ...p, fileFee: Number(e.target.value) }))} unit="$" />
            <F label="Minimum Price" value={data.minimumPrice ?? 25}
              onChange={(e) => setData((p) => ({ ...p, minimumPrice: Number(e.target.value) }))} unit="$" />
          </div>

          {/* Ink Costs per print mode */}
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
            className="rounded-lg bg-orange-700 px-6 py-2 text-sm font-bold text-white hover:bg-orange-800 disabled:opacity-50">
            {saving ? "Saving..." : "Save All Formula Settings"}
          </button>
        </div>
      )}
    </div>
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

export default function MaterialsPage() {
  const [materials, setMaterials] = useState([]);
  const [inkSettings, setInkSettings] = useState({ inkCostPerLiter: 234, inkMlPerSqft: 1, inkCostPerSqft: 0.234 });
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("all");
  const [saving, setSaving] = useState(null);

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
      // If rollCost or sqftPerRoll changed, send both for auto-compute
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
    if (!confirm(`Delete "${name}"?`)) return;
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Materials</h1>
          <p className="text-sm text-gray-500">Manage material inventory and cost per sqft for COST_PLUS pricing</p>
        </div>
        <button onClick={handleAdd}
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-bold text-white hover:bg-gray-800">
          + Add Material
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-4">
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

      {/* Ink settings */}
      <InkSettingsCard ink={inkSettings} onSave={setInkSettings} />

      {/* Pricing formula */}
      <FormulaCard />

      {/* Filter tabs */}
      <div className="flex gap-2">
        <button onClick={() => setFilterType("all")}
          className={`rounded-lg px-3 py-1.5 text-xs font-bold ${filterType === "all" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
          All ({materials.length})
        </button>
        {types.map((t) => (
          <button key={t} onClick={() => setFilterType(t)}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold ${filterType === t ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
            {t} ({materials.filter((m) => m.type === t).length})
          </button>
        ))}
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
              <th className="px-3 py-2.5 text-right">Width"</th>
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
