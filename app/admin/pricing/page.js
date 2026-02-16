"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";

const MODEL_LABELS = {
  AREA_TIERED: "Area Tiered ($/sqft)",
  QTY_TIERED: "Qty Tiered ($/ea)",
  QTY_OPTIONS: "Qty + Options",
};
const MODEL_ORDER = ["QTY_OPTIONS", "QTY_TIERED", "AREA_TIERED"];
const DEFAULT_ADJUST_FLAGS = {
  tiers: true,
  addons: false,
  finishings: false,
  minimumPrice: false,
  fileFee: false,
};

const FINISHING_TYPES = ["flat", "per_unit", "per_sqft"];

function MaterialsEditor({ materials, onChange, t }) {
  function addRow() {
    onChange([...materials, { id: "", name: "", multiplier: 1.0 }]);
  }
  function removeRow(idx) {
    onChange(materials.filter((_, i) => i !== idx));
  }
  function updateRow(idx, field, value) {
    const next = [...materials];
    next[idx] = { ...next[idx], [field]: field === "multiplier" ? (Number(value) || 1) : value };
    onChange(next);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-gray-600 uppercase tracking-widest">{t("pricing.materials")}</span>
          <p className="text-[11px] text-gray-400 mt-0.5">{t("pricing.materialsDesc")}</p>
        </div>
        <button type="button" onClick={addRow} className="text-xs text-blue-600 hover:underline">{t("pricing.addMaterial")}</button>
      </div>
      {materials.length > 0 && (
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-gray-500">
              <th className="pb-1 pr-2">ID</th>
              <th className="pb-1 pr-2">{t("pricing.materialName")}</th>
              <th className="pb-1 pr-2">{t("pricing.materialMultiplier")}</th>
              <th className="pb-1 w-8"></th>
            </tr>
          </thead>
          <tbody>
            {materials.map((m, i) => (
              <tr key={i} className="border-t border-gray-100">
                <td className="py-1 pr-2">
                  <input value={m.id || ""} onChange={(e) => updateRow(i, "id", e.target.value)} className="w-full rounded border border-gray-300 px-2 py-1 text-xs" placeholder="e.g. vinyl_13oz" />
                </td>
                <td className="py-1 pr-2">
                  <input value={m.name || ""} onChange={(e) => updateRow(i, "name", e.target.value)} className="w-full rounded border border-gray-300 px-2 py-1 text-xs" placeholder="13oz Vinyl" />
                </td>
                <td className="py-1 pr-2">
                  <input type="number" step="0.01" min="0.1" value={m.multiplier ?? 1} onChange={(e) => updateRow(i, "multiplier", e.target.value)} className="w-20 rounded border border-gray-300 px-2 py-1 text-xs" />
                </td>
                <td className="py-1 text-center">
                  <button type="button" onClick={() => removeRow(i)} className="text-red-400 hover:text-red-600 text-sm leading-none">&times;</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function FinishingsEditor({ finishings, onChange, t }) {
  function addRow() {
    onChange([...finishings, { id: "", name: "", type: "flat", price: 0 }]);
  }
  function removeRow(idx) {
    onChange(finishings.filter((_, i) => i !== idx));
  }
  function updateRow(idx, field, value) {
    const next = [...finishings];
    next[idx] = { ...next[idx], [field]: field === "price" ? (Number(value) || 0) : value };
    onChange(next);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-gray-600 uppercase tracking-widest">{t("pricing.finishings")}</span>
          <p className="text-[11px] text-gray-400 mt-0.5">{t("pricing.finishingsDesc")}</p>
        </div>
        <button type="button" onClick={addRow} className="text-xs text-blue-600 hover:underline">{t("pricing.addFinishing")}</button>
      </div>
      {finishings.length > 0 && (
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-gray-500">
              <th className="pb-1 pr-2">ID</th>
              <th className="pb-1 pr-2">{t("pricing.finishingName")}</th>
              <th className="pb-1 pr-2">{t("pricing.finishingType")}</th>
              <th className="pb-1 pr-2">{t("pricing.finishingPrice")}</th>
              <th className="pb-1 w-8"></th>
            </tr>
          </thead>
          <tbody>
            {finishings.map((f, i) => (
              <tr key={i} className="border-t border-gray-100">
                <td className="py-1 pr-2">
                  <input value={f.id || ""} onChange={(e) => updateRow(i, "id", e.target.value)} className="w-full rounded border border-gray-300 px-2 py-1 text-xs" placeholder="e.g. lamination" />
                </td>
                <td className="py-1 pr-2">
                  <input value={f.name || ""} onChange={(e) => updateRow(i, "name", e.target.value)} className="w-full rounded border border-gray-300 px-2 py-1 text-xs" placeholder="Gloss Lamination" />
                </td>
                <td className="py-1 pr-2">
                  <select value={f.type || "flat"} onChange={(e) => updateRow(i, "type", e.target.value)} className="w-full rounded border border-gray-300 px-2 py-1 text-xs bg-white">
                    {FINISHING_TYPES.map((tp) => (
                      <option key={tp} value={tp}>{t(`pricing.type${tp.charAt(0).toUpperCase()}${tp.slice(1).replace(/_([a-z])/g, (_, c) => c.toUpperCase())}`)}</option>
                    ))}
                  </select>
                </td>
                <td className="py-1 pr-2">
                  <input type="number" step="0.01" min="0" value={f.price ?? 0} onChange={(e) => updateRow(i, "price", e.target.value)} className="w-20 rounded border border-gray-300 px-2 py-1 text-xs" />
                </td>
                <td className="py-1 text-center">
                  <button type="button" onClick={() => removeRow(i)} className="text-red-400 hover:text-red-600 text-sm leading-none">&times;</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default function PricingPresetsPage() {
  const { t } = useTranslation();
  const [presets, setPresets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // preset id being edited
  const [editJson, setEditJson] = useState("");
  const [editName, setEditName] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [categories, setCategories] = useState([]);
  const [bulkCategory, setBulkCategory] = useState("");
  const [bulkPercent, setBulkPercent] = useState("");
  const [includeShared, setIncludeShared] = useState(false);
  const [adjustFlags, setAdjustFlags] = useState(DEFAULT_ADJUST_FLAGS);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkPreview, setBulkPreview] = useState(null);
  const [bulkMessage, setBulkMessage] = useState(null);
  const [quickPresetId, setQuickPresetId] = useState("");
  const [quickOverwrite, setQuickOverwrite] = useState(false);
  const [quickAssignLoading, setQuickAssignLoading] = useState(false);
  const [quickAssignMsg, setQuickAssignMsg] = useState(null);

  // Parsed config for structured editors (derived from editJson)
  const parsedConfig = useMemo(() => {
    try { return JSON.parse(editJson); } catch { return null; }
  }, [editJson]);

  function updateConfigField(field, value) {
    if (!parsedConfig) return;
    const next = { ...parsedConfig, [field]: value };
    setEditJson(JSON.stringify(next, null, 2));
  }

  const groupedPresets = useMemo(() => {
    const groups = MODEL_ORDER.map((model) => ({
      model,
      label: MODEL_LABELS[model] || model,
      items: presets.filter((p) => p.model === model),
    })).filter((g) => g.items.length);
    const leftovers = presets.filter((p) => !MODEL_ORDER.includes(p.model));
    if (leftovers.length) {
      groups.push({ model: "OTHER", label: "Other", items: leftovers });
    }
    return groups;
  }, [presets]);

  useEffect(() => {
    fetchPresets();
    fetchCategories();
  }, []);

  useEffect(() => {
    if (!quickPresetId && presets.length > 0) {
      setQuickPresetId(presets[0].id);
    }
  }, [quickPresetId, presets]);

  async function fetchPresets() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/pricing");
      const text = await res.text();
      const data = JSON.parse(text);
      setPresets(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load presets:", err);
      setPresets([]);
    } finally {
      setLoading(false);
    }
  }

  async function fetchCategories() {
    try {
      const res = await fetch("/api/admin/pricing/bulk-adjust");
      if (!res.ok) throw new Error("Failed to load categories");
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      setCategories(list);
      if (!bulkCategory && list.length) setBulkCategory(list[0].category);
    } catch (err) {
      console.error("Failed to load categories:", err);
      setCategories([]);
    }
  }

  function startEdit(preset) {
    setEditing(preset.id);
    setEditName(preset.name);
    setEditJson(JSON.stringify(preset.config, null, 2));
    setMessage(null);
  }

  function cancelEdit() {
    setEditing(null);
    setEditJson("");
    setEditName("");
    setMessage(null);
  }

  async function handleSave(presetId) {
    let parsed;
    try {
      parsed = JSON.parse(editJson);
    } catch {
      setMessage({ type: "error", text: "Invalid JSON" });
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/pricing/${presetId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName, config: parsed }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Save failed");
      }
      setMessage({ type: "success", text: "Saved!" });
      setEditing(null);
      fetchPresets();
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(preset) {
    try {
      await fetch(`/api/admin/pricing/${preset.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !preset.isActive }),
      });
      fetchPresets();
    } catch (err) {
      console.error("Toggle failed:", err);
    }
  }

  async function runBulk(mode) {
    if (!bulkCategory) {
      setBulkMessage({ type: "error", text: "Please select a category." });
      return;
    }
    const percent = Number(bulkPercent);
    if (!Number.isFinite(percent) || percent <= -95 || percent > 500) {
      setBulkMessage({ type: "error", text: "Percent must be between -95 and 500." });
      return;
    }

    setBulkLoading(true);
    setBulkMessage(null);
    try {
      const res = await fetch("/api/admin/pricing/bulk-adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          category: bulkCategory,
          percent,
          includeSharedPresets: includeShared,
          adjust: adjustFlags,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Bulk operation failed");
      }
      setBulkPreview(data);
      if (mode === "apply") {
        setBulkMessage({
          type: "success",
          text: `Applied to ${data.applied || 0} preset(s).`,
        });
        await fetchPresets();
      } else {
        setBulkMessage({
          type: "success",
          text: `Preview ready: ${data.results?.length || 0} preset(s) analyzed.`,
        });
      }
    } catch (err) {
      setBulkMessage({ type: "error", text: err.message || "Bulk operation failed" });
    } finally {
      setBulkLoading(false);
    }
  }

  async function handleQuickAssign() {
    if (!bulkCategory || !quickPresetId) {
      setQuickAssignMsg({ type: "error", text: "Choose category and preset first." });
      return;
    }
    setQuickAssignLoading(true);
    setQuickAssignMsg(null);
    try {
      const res = await fetch("/api/admin/pricing/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: bulkCategory,
          presetId: quickPresetId,
          overwriteExisting: quickOverwrite,
          activeOnly: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Quick assign failed");
      setQuickAssignMsg({
        type: "success",
        text: `Assigned preset to ${data.updated} products in ${data.category}.`,
      });
      await fetchCategories();
    } catch (err) {
      setQuickAssignMsg({ type: "error", text: err.message || "Quick assign failed" });
    } finally {
      setQuickAssignLoading(false);
    }
  }

  function updateAdjustFlag(flag, checked) {
    setAdjustFlags((prev) => ({ ...prev, [flag]: checked }));
  }

  if (loading) {
    return (
      <div className="p-8 text-gray-500 text-sm">Loading pricing presets...</div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pricing Presets</h1>
          <p className="text-sm text-gray-500 mt-1">
            Edit pricing rules. Changes affect all products linked to each preset.
          </p>
        </div>
        <span className="bg-gray-100 px-3 py-1 rounded-full text-xs font-bold text-gray-600">
          {presets.length} presets
        </span>
      </div>

      {message && (
        <div
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            message.type === "error"
              ? "bg-red-50 text-red-700 border border-red-200"
              : "bg-green-50 text-green-700 border border-green-200"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-widest text-gray-600">Quick Assign Preset</span>
            <select
              value={quickPresetId}
              onChange={(e) => setQuickPresetId(e.target.value)}
              className="rounded border border-gray-300 bg-white px-2 py-1 text-xs"
            >
              {presets.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.key})
                </option>
              ))}
            </select>
            <button
              onClick={handleQuickAssign}
              disabled={quickAssignLoading || !quickPresetId || !bulkCategory}
              className="rounded bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-black disabled:opacity-50"
            >
              {quickAssignLoading ? "Applying..." : "Apply to Category"}
            </button>
            <label className="inline-flex items-center gap-1 text-xs text-gray-600">
              <input
                type="checkbox"
                checked={quickOverwrite}
                onChange={(e) => setQuickOverwrite(e.target.checked)}
              />
              Overwrite existing preset links
            </label>
          </div>
          {quickAssignMsg && (
            <p className={`mt-2 text-xs ${quickAssignMsg.type === "error" ? "text-red-600" : "text-green-700"}`}>
              {quickAssignMsg.text}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-900">Bulk Price Adjustment</h2>
            <p className="text-xs text-gray-500 mt-1">
              Adjust an entire category by percentage. Run preview first, then apply.
            </p>
          </div>
          <span className="rounded-full bg-gray-100 px-3 py-1 text-[11px] font-semibold text-gray-600">
            Safe mode: shared presets protected
          </span>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <label className="block">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-500">Category</span>
            <select
              value={bulkCategory}
              onChange={(e) => setBulkCategory(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white"
            >
              {categories.map((c) => (
                <option key={c.category} value={c.category}>
                  {c.category} ({c.productCount})
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-500">Percent Change</span>
            <div className="mt-1 flex items-center rounded-lg border border-gray-300 px-3 py-2">
              <input
                type="number"
                step="0.1"
                value={bulkPercent}
                onChange={(e) => setBulkPercent(e.target.value)}
                className="w-full text-sm outline-none"
                placeholder="e.g. 8 or -5"
              />
              <span className="text-sm text-gray-500">%</span>
            </div>
          </label>

          <div className="flex flex-col justify-end gap-2">
            <label className="inline-flex items-center gap-2 text-xs text-gray-700">
              <input
                type="checkbox"
                checked={includeShared}
                onChange={(e) => setIncludeShared(e.target.checked)}
                className="rounded border-gray-300"
              />
              Also adjust shared presets (cross-category)
            </label>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-700">
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={adjustFlags.tiers} onChange={(e) => updateAdjustFlag("tiers", e.target.checked)} />
            Tier prices
          </label>
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={adjustFlags.addons} onChange={(e) => updateAdjustFlag("addons", e.target.checked)} />
            Add-ons
          </label>
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={adjustFlags.finishings} onChange={(e) => updateAdjustFlag("finishings", e.target.checked)} />
            Finishings
          </label>
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={adjustFlags.minimumPrice} onChange={(e) => updateAdjustFlag("minimumPrice", e.target.checked)} />
            Minimum price
          </label>
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={adjustFlags.fileFee} onChange={(e) => updateAdjustFlag("fileFee", e.target.checked)} />
            File fee
          </label>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => runBulk("preview")}
            disabled={bulkLoading}
            className="rounded-lg border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {bulkLoading ? "Running..." : "Preview"}
          </button>
          <button
            onClick={() => runBulk("apply")}
            disabled={bulkLoading || !bulkPreview}
            className="rounded-lg bg-gray-900 px-4 py-2 text-xs font-semibold text-white hover:bg-black disabled:opacity-50"
          >
            {bulkLoading ? "Applying..." : "Apply"}
          </button>
        </div>

        {bulkMessage && (
          <div className={`rounded-lg border px-3 py-2 text-xs ${bulkMessage.type === "error" ? "border-red-200 bg-red-50 text-red-700" : "border-green-200 bg-green-50 text-green-700"}`}>
            {bulkMessage.text}
          </div>
        )}

        {bulkPreview && (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
            <div className="flex flex-wrap gap-3 text-xs text-gray-600">
              <span>Touched presets: {bulkPreview.touchedPresets}</span>
              <span>Touched products: {bulkPreview.touchedProducts}</span>
              <span>Applied: {bulkPreview.applied || 0}</span>
              <span>Skipped shared: {bulkPreview.skippedShared}</span>
              <span>Invalid: {bulkPreview.invalidConfigs}</span>
            </div>
            {!!bulkPreview.results?.length && (
              <div className="mt-3 max-h-40 overflow-auto rounded border border-gray-200 bg-white">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 text-gray-500">
                    <tr>
                      <th className="px-2 py-1 text-left">Preset</th>
                      <th className="px-2 py-1 text-left">Status</th>
                      <th className="px-2 py-1 text-left">Sample</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bulkPreview.results.map((r) => (
                      <tr key={r.presetId} className="border-t border-gray-100">
                        <td className="px-2 py-1.5 font-mono">{r.key}</td>
                        <td className="px-2 py-1.5">{r.status}</td>
                        <td className="px-2 py-1.5">
                          {r.sample ? `${r.sample.field}: ${r.sample.before} → ${r.sample.after}` : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="space-y-4">
        {groupedPresets.map((group) => (
          <section key={group.model} className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-gray-700">{group.label}</h2>
              <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-semibold text-gray-600">
                {group.items.length} preset{group.items.length !== 1 ? "s" : ""}
              </span>
            </div>
            {group.items.map((preset) => {
          const isEditing = editing === preset.id;
          const productCount = preset._count?.products ?? 0;

          return (
            <div
              key={preset.id}
              className="border border-gray-200 rounded-xl bg-white overflow-hidden"
            >
              {/* Header */}
              <div className="px-5 py-4 flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base">{preset.name}</h3>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        preset.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {preset.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="font-mono bg-gray-50 px-2 py-0.5 rounded">
                      {preset.key}
                    </span>
                    <span>{MODEL_LABELS[preset.model] || preset.model}</span>
                    <span>{productCount} product{productCount !== 1 ? "s" : ""}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleActive(preset)}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 hover:bg-gray-50"
                  >
                    {preset.isActive ? "Deactivate" : "Activate"}
                  </button>
                  {isEditing ? (
                    <button
                      onClick={cancelEdit}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  ) : (
                    <button
                      onClick={() => startEdit(preset)}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-900 text-white hover:bg-black"
                    >
                      Edit Config
                    </button>
                  )}
                </div>
              </div>

              {/* Editor */}
              {isEditing && (
                <div className="border-t border-gray-200 px-5 py-4 space-y-4 bg-gray-50">
                  <label className="block">
                    <span className="text-xs font-semibold text-gray-600 uppercase tracking-widest">
                      Preset Name
                    </span>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    />
                  </label>

                  {/* Structured editors for materials & finishings */}
                  {parsedConfig && (
                    <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-4">
                      <MaterialsEditor
                        materials={Array.isArray(parsedConfig.materials) ? parsedConfig.materials : []}
                        onChange={(mats) => updateConfigField("materials", mats)}
                        t={t}
                      />
                      <div className="border-t border-gray-100" />
                      <FinishingsEditor
                        finishings={Array.isArray(parsedConfig.finishings) ? parsedConfig.finishings : []}
                        onChange={(fins) => updateConfigField("finishings", fins)}
                        t={t}
                      />
                    </div>
                  )}

                  <label className="block">
                    <span className="text-xs font-semibold text-gray-600 uppercase tracking-widest">
                      Config JSON
                    </span>
                    <textarea
                      value={editJson}
                      onChange={(e) => setEditJson(e.target.value)}
                      rows={16}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono leading-relaxed"
                      spellCheck={false}
                    />
                  </label>
                  <div className="flex justify-end">
                    <button
                      onClick={() => handleSave(preset.id)}
                      disabled={saving}
                      className="px-5 py-2 rounded-lg bg-gray-900 text-white text-xs font-bold uppercase tracking-widest hover:bg-black disabled:bg-gray-300"
                    >
                      {saving ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </div>
              )}

              {/* Preview (collapsed) */}
              {!isEditing && (
                <div className="border-t border-gray-100 px-5 py-3">
                  <pre className="text-[11px] text-gray-500 font-mono max-h-24 overflow-auto whitespace-pre-wrap">
                    {JSON.stringify(preset.config, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          );
        })}
          </section>
        ))}

        {presets.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <p className="text-lg font-semibold">No pricing presets found.</p>
            <p className="text-sm mt-1">
              Run the seed script to create default presets.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
