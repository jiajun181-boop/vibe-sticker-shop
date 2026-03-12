"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "@/lib/i18n/useTranslation";

const MODEL_LABELS = {
  AREA_TIERED: "admin.pc.modelAreaTiered",
  QTY_TIERED: "admin.pc.modelQtyTiered",
  QTY_OPTIONS: "admin.pc.modelQtyOptions",
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
          <span className="text-xs font-semibold text-[#666] uppercase tracking-[0.14em]">{t("pricing.materials")}</span>
          <p className="text-[11px] text-[#999] mt-0.5">{t("pricing.materialsDesc")}</p>
        </div>
        <button type="button" onClick={addRow} className="text-xs text-black underline hover:no-underline">{t("pricing.addMaterial")}</button>
      </div>
      {materials.length > 0 && (
        <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-[#999]">
              <th className="pb-1 pr-2">ID</th>
              <th className="pb-1 pr-2">{t("pricing.materialName")}</th>
              <th className="pb-1 pr-2">{t("pricing.materialMultiplier")}</th>
              <th className="pb-1 w-8"></th>
            </tr>
          </thead>
          <tbody>
            {materials.map((m, i) => (
              <tr key={i} className="border-t border-[#e0e0e0]">
                <td className="py-1 pr-2">
                  <input value={m.id || ""} onChange={(e) => updateRow(i, "id", e.target.value)} className="w-full rounded border border-[#d0d0d0] px-2 py-1 text-xs" placeholder="e.g. vinyl_13oz" />
                </td>
                <td className="py-1 pr-2">
                  <input value={m.name || ""} onChange={(e) => updateRow(i, "name", e.target.value)} className="w-full rounded border border-[#d0d0d0] px-2 py-1 text-xs" placeholder="13oz Vinyl" />
                </td>
                <td className="py-1 pr-2">
                  <input type="number" step="0.01" min="0.1" value={m.multiplier ?? 1} onChange={(e) => updateRow(i, "multiplier", e.target.value)} className="w-20 rounded border border-[#d0d0d0] px-2 py-1 text-xs" />
                </td>
                <td className="py-1 text-center">
                  <button type="button" onClick={() => removeRow(i)} className="text-red-400 hover:text-red-600 text-sm leading-none">&times;</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
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
          <span className="text-xs font-semibold text-[#666] uppercase tracking-[0.14em]">{t("pricing.finishings")}</span>
          <p className="text-[11px] text-[#999] mt-0.5">{t("pricing.finishingsDesc")}</p>
        </div>
        <button type="button" onClick={addRow} className="text-xs text-black underline hover:no-underline">{t("pricing.addFinishing")}</button>
      </div>
      {finishings.length > 0 && (
        <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-[#999]">
              <th className="pb-1 pr-2">ID</th>
              <th className="pb-1 pr-2">{t("pricing.finishingName")}</th>
              <th className="pb-1 pr-2">{t("pricing.finishingType")}</th>
              <th className="pb-1 pr-2">{t("pricing.finishingPrice")}</th>
              <th className="pb-1 w-8"></th>
            </tr>
          </thead>
          <tbody>
            {finishings.map((f, i) => (
              <tr key={i} className="border-t border-[#e0e0e0]">
                <td className="py-1 pr-2">
                  <input value={f.id || ""} onChange={(e) => updateRow(i, "id", e.target.value)} className="w-full rounded border border-[#d0d0d0] px-2 py-1 text-xs" placeholder="e.g. lamination" />
                </td>
                <td className="py-1 pr-2">
                  <input value={f.name || ""} onChange={(e) => updateRow(i, "name", e.target.value)} className="w-full rounded border border-[#d0d0d0] px-2 py-1 text-xs" placeholder="Gloss Lamination" />
                </td>
                <td className="py-1 pr-2">
                  <select value={f.type || "flat"} onChange={(e) => updateRow(i, "type", e.target.value)} className="w-full rounded border border-[#d0d0d0] px-2 py-1 text-xs bg-white">
                    {FINISHING_TYPES.map((tp) => (
                      <option key={tp} value={tp}>{t(`pricing.type${tp.charAt(0).toUpperCase()}${tp.slice(1).replace(/_([a-z])/g, (_, c) => c.toUpperCase())}`)}</option>
                    ))}
                  </select>
                </td>
                <td className="py-1 pr-2">
                  <input type="number" step="0.01" min="0" value={f.price ?? 0} onChange={(e) => updateRow(i, "price", e.target.value)} className="w-20 rounded border border-[#d0d0d0] px-2 py-1 text-xs" />
                </td>
                <td className="py-1 text-center">
                  <button type="button" onClick={() => removeRow(i)} className="text-red-400 hover:text-red-600 text-sm leading-none">&times;</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}
    </div>
  );
}

export default function PresetsPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();
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
  const [anomalyLoading, setAnomalyLoading] = useState(false);
  const [anomalyReport, setAnomalyReport] = useState(null);
  const [rollbackLogs, setRollbackLogs] = useState([]);
  const [rollbackTarget, setRollbackTarget] = useState("");
  const [rollbackLoading, setRollbackLoading] = useState(false);
  const [rollbackMsg, setRollbackMsg] = useState(null);
  const [showFormulas, setShowFormulas] = useState(false);

  // Note: This panel is always embedded in the Pricing Center tab container.
  // The redirect to catalog-ops is no longer needed.

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
      label: model,
      items: presets.filter((p) => p.model === model),
    })).filter((g) => g.items.length);
    const leftovers = presets.filter((p) => !MODEL_ORDER.includes(p.model));
    if (leftovers.length) {
      groups.push({ model: "OTHER", label: "OTHER", items: leftovers });
    }
    return groups;
  }, [presets]);

  useEffect(() => {
    fetchPresets();
    fetchCategories();
    fetchAnomalies();
    fetchRollbackLogs();
  }, [fetchCategories, fetchRollbackLogs]);

  useEffect(() => {
    if (!quickPresetId && presets.length > 0) {
      setQuickPresetId(presets[0].id);
    }
  }, [quickPresetId, presets]);

  async function fetchPresets() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/pricing");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      const data = JSON.parse(text);
      setPresets(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load presets:", err);
      setPresets([]);
      setMessage({ type: "error", text: t("admin.pc.failedLoadPresets") });
    } finally {
      setLoading(false);
    }
  }

  const fetchCategories = useCallback(async () => {
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
  }, [bulkCategory]);

  async function fetchAnomalies() {
    setAnomalyLoading(true);
    try {
      const res = await fetch("/api/admin/pricing/anomalies");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setAnomalyReport(data);
    } catch (err) {
      console.error("Failed to load pricing anomalies:", err);
      setAnomalyReport(null);
    } finally {
      setAnomalyLoading(false);
    }
  }

  const fetchRollbackLogs = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/pricing/bulk-adjust/rollback");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const list = Array.isArray(data.logs) ? data.logs : [];
      setRollbackLogs(list);
      setRollbackTarget((prev) => prev || (list[0]?.id || ""));
    } catch (err) {
      console.error("Failed to load rollback history:", err);
      setRollbackLogs([]);
    }
  }, []);

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
      setMessage({ type: "error", text: t("admin.pc.invalidJson") });
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
      setMessage({ type: "success", text: t("admin.pc.presetSaved") });
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
      const res = await fetch(`/api/admin/pricing/${preset.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !preset.isActive }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      fetchPresets();
    } catch (err) {
      console.error("Toggle failed:", err);
      setMessage({ type: "error", text: t("admin.pc.failedToggle") });
    }
  }

  async function runBulk(mode) {
    if (!bulkCategory) {
      setBulkMessage({ type: "error", text: t("admin.pc.selectCategoryFirst") });
      return;
    }
    const percent = Number(bulkPercent);
    if (!Number.isFinite(percent) || percent <= -95 || percent > 500) {
      setBulkMessage({ type: "error", text: t("admin.pc.percentRange") });
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
          text: t("admin.pc.bulkApplied", { count: data.applied || 0 }),
        });
        await Promise.all([fetchPresets(), fetchAnomalies(), fetchRollbackLogs()]);
      } else {
        setBulkMessage({
          type: "success",
          text: t("admin.pc.previewReady", { count: data.results?.length || 0 }),
        });
      }
    } catch (err) {
      setBulkMessage({ type: "error", text: err.message || t("admin.pc.bulkFailed") });
    } finally {
      setBulkLoading(false);
    }
  }

  async function handleQuickAssign() {
    if (!bulkCategory || !quickPresetId) {
      setQuickAssignMsg({ type: "error", text: t("admin.pc.chooseCatPreset") });
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
        text: t("admin.pc.assignedPreset", { updated: data.updated, category: data.category }),
      });
      await fetchCategories();
    } catch (err) {
      setQuickAssignMsg({ type: "error", text: err.message || t("admin.pc.quickAssignFailed") });
    } finally {
      setQuickAssignLoading(false);
    }
  }

  async function handleRollback() {
    if (!rollbackTarget) {
      setRollbackMsg({ type: "error", text: t("admin.pc.selectRollbackFirst") });
      return;
    }
    setRollbackLoading(true);
    setRollbackMsg(null);
    try {
      const res = await fetch("/api/admin/pricing/bulk-adjust/rollback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logId: rollbackTarget }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Rollback failed");
      setRollbackMsg({ type: "success", text: t("admin.pc.rollbackDone", { count: data.restoredPresets }) });
      await Promise.all([fetchPresets(), fetchAnomalies(), fetchRollbackLogs()]);
    } catch (err) {
      setRollbackMsg({ type: "error", text: err.message || t("admin.pc.rollbackFailed") });
    } finally {
      setRollbackLoading(false);
    }
  }

  function updateAdjustFlag(flag, checked) {
    setAdjustFlags((prev) => ({ ...prev, [flag]: checked }));
  }

  if (loading) {
    return (
      <div className="p-8 text-[#999] text-sm">{t("admin.pc.loadingPresets")}</div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("admin.pc.pricingPresets")}</h1>
          <p className="text-sm text-[#999] mt-1">
            {t("admin.pc.presetsEditDesc")}
          </p>
        </div>
        <span className="bg-[#f5f5f5] px-3 py-1 rounded-[2px] text-xs font-bold text-[#666]">
          {t("admin.pc.nPresetsCount", { n: presets.length })}
        </span>
      </div>

      {message && (
        <div
          className={`px-4 py-2 rounded-[3px] text-sm font-medium ${
            message.type === "error"
              ? "bg-red-50 text-red-700 border border-red-200"
              : "bg-green-50 text-green-700 border border-green-200"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="rounded-[3px] border border-[#e0e0e0] bg-white p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-black">{t("admin.pc.pricingIntegrity")}</h2>
          <button
            type="button"
            onClick={fetchAnomalies}
            className="rounded-[3px] border border-[#d0d0d0] px-3 py-1.5 text-xs font-medium text-black hover:bg-[#fafafa]"
          >
            {anomalyLoading ? t("admin.pc.checking") : t("admin.pc.recheck")}
          </button>
        </div>
        {anomalyReport ? (
          <div className="grid gap-2 sm:grid-cols-3">
            <div className="rounded-[3px] border border-[#e0e0e0] p-2.5">
              <p className="text-[11px] text-[#666]">{t("admin.pc.presetAnomalies")}</p>
              <p className="text-base font-semibold text-black">{anomalyReport.summary?.presetAnomalies ?? 0}</p>
            </div>
            <div className="rounded-[3px] border border-[#e0e0e0] p-2.5">
              <p className="text-[11px] text-[#666]">{t("admin.pc.productsMissingPrice")}</p>
              <p className="text-base font-semibold text-black">{anomalyReport.summary?.productsMissingPrice ?? 0}</p>
            </div>
            <div className="rounded-[3px] border border-[#e0e0e0] p-2.5">
              <p className="text-[11px] text-[#666]">{t("admin.pc.presetsChecked")}</p>
              <p className="text-base font-semibold text-black">{anomalyReport.summary?.totalPresetsChecked ?? 0}</p>
            </div>
          </div>
        ) : (
          <p className="text-xs text-[#999]">{t("admin.pc.noReportYet")}</p>
        )}

        <div className="rounded-[3px] border border-[#e0e0e0] bg-[#fafafa] p-3 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#666]">{t("admin.pc.rollbackLastBulk")}</p>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={rollbackTarget}
              onChange={(e) => setRollbackTarget(e.target.value)}
              className="rounded border border-[#d0d0d0] bg-white px-2 py-1 text-xs"
            >
              <option value="">{t("admin.pc.selectBulkLog")}</option>
              {rollbackLogs.map((l) => (
                <option key={l.id} value={l.id}>
                  {new Date(l.createdAt).toLocaleString()} | {l.category} | {l.percent}% | {l.applied}
                </option>
              ))}
            </select>
            <button
              onClick={handleRollback}
              disabled={!rollbackTarget || rollbackLoading}
              className="rounded bg-black px-3 py-1.5 text-xs font-semibold text-[#fff] hover:bg-[#222] disabled:opacity-50"
            >
              {rollbackLoading ? t("admin.pc.rollingBack") : t("admin.pc.rollbackLabel")}
            </button>
          </div>
          {rollbackMsg && (
            <p className={`text-xs ${rollbackMsg.type === "error" ? "text-red-600" : "text-green-700"}`}>{rollbackMsg.text}</p>
          )}
        </div>
      </div>

      <div className="rounded-[3px] border border-[#e0e0e0] bg-white p-5 space-y-4">
        <div className="rounded-[3px] border border-[#e0e0e0] bg-[#fafafa] p-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#666]">{t("admin.pc.quickAssignPreset")}</span>
            <select
              value={quickPresetId}
              onChange={(e) => setQuickPresetId(e.target.value)}
              className="rounded border border-[#d0d0d0] bg-white px-2 py-1 text-xs"
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
              className="rounded bg-black px-3 py-1.5 text-xs font-semibold text-[#fff] hover:bg-[#222] disabled:opacity-50"
            >
              {quickAssignLoading ? t("admin.pc.applying") : t("admin.pc.applyToCategory")}
            </button>
            <label className="inline-flex items-center gap-1 text-xs text-[#666]">
              <input
                type="checkbox"
                checked={quickOverwrite}
                onChange={(e) => setQuickOverwrite(e.target.checked)}
              />
              {t("admin.pc.overwriteLinks")}
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
            <h2 className="text-base font-bold text-black">{t("admin.pc.bulkPriceAdj")}</h2>
            <p className="text-xs text-[#999] mt-1">
              {t("admin.pc.bulkPriceAdjDesc")}
            </p>
          </div>
          <span className="rounded-[2px] bg-[#f5f5f5] px-3 py-1 text-[11px] font-semibold text-[#666]">
            {t("admin.pc.safeMode")}
          </span>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <label className="block">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#999]">{t("admin.pc.categoryLabel")}</span>
            <select
              value={bulkCategory}
              onChange={(e) => setBulkCategory(e.target.value)}
              className="mt-1 w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm bg-white"
            >
              {categories.map((c) => (
                <option key={c.category} value={c.category}>
                  {c.category} ({c.productCount})
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#999]">{t("admin.pc.percentChange")}</span>
            <div className="mt-1 flex items-center rounded-[3px] border border-[#d0d0d0] px-3 py-2">
              <input
                type="number"
                step="0.1"
                value={bulkPercent}
                onChange={(e) => setBulkPercent(e.target.value)}
                className="w-full text-sm outline-none"
                placeholder="e.g. 8 or -5"
              />
              <span className="text-sm text-[#999]">%</span>
            </div>
          </label>

          <div className="flex flex-col justify-end gap-2">
            <label className="inline-flex items-center gap-2 text-xs text-black">
              <input
                type="checkbox"
                checked={includeShared}
                onChange={(e) => setIncludeShared(e.target.checked)}
                className="rounded border-[#d0d0d0]"
              />
              {t("admin.pc.alsoShared")}
            </label>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-black">
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={adjustFlags.tiers} onChange={(e) => updateAdjustFlag("tiers", e.target.checked)} />
            {t("admin.pc.tierPrices")}
          </label>
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={adjustFlags.addons} onChange={(e) => updateAdjustFlag("addons", e.target.checked)} />
            {t("admin.pc.addOns")}
          </label>
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={adjustFlags.finishings} onChange={(e) => updateAdjustFlag("finishings", e.target.checked)} />
            {t("admin.pc.finishingsFlag")}
          </label>
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={adjustFlags.minimumPrice} onChange={(e) => updateAdjustFlag("minimumPrice", e.target.checked)} />
            {t("admin.pc.minimumPrice")}
          </label>
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={adjustFlags.fileFee} onChange={(e) => updateAdjustFlag("fileFee", e.target.checked)} />
            {t("admin.pc.fileFee")}
          </label>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => runBulk("preview")}
            disabled={bulkLoading}
            className="rounded-[3px] border border-[#d0d0d0] px-4 py-2 text-xs font-semibold text-black hover:bg-[#fafafa] disabled:opacity-50"
          >
            {bulkLoading ? t("admin.pc.running") : t("admin.pc.previewLabel")}
          </button>
          <button
            onClick={() => runBulk("apply")}
            disabled={bulkLoading || !bulkPreview}
            className="rounded-[3px] bg-black px-4 py-2 text-xs font-semibold text-[#fff] hover:bg-[#222] disabled:opacity-50"
          >
            {bulkLoading ? t("admin.pc.applying") : t("admin.pc.applyLabel")}
          </button>
        </div>

        {bulkMessage && (
          <div className={`rounded-[3px] border px-3 py-2 text-xs ${bulkMessage.type === "error" ? "border-red-200 bg-red-50 text-red-700" : "border-green-200 bg-green-50 text-green-700"}`}>
            {bulkMessage.text}
          </div>
        )}

        {bulkPreview && (
          <div className="rounded-[3px] border border-[#e0e0e0] bg-[#fafafa] p-3">
            <div className="flex flex-wrap gap-3 text-xs text-[#666]">
              <span>{t("admin.pc.touchedPresets", { n: bulkPreview.touchedPresets })}</span>
              <span>{t("admin.pc.touchedProducts", { n: bulkPreview.touchedProducts })}</span>
              <span>{t("admin.pc.appliedCount", { n: bulkPreview.applied || 0 })}</span>
              <span>{t("admin.pc.skippedShared", { n: bulkPreview.skippedShared })}</span>
              <span>{t("admin.pc.invalidCount", { n: bulkPreview.invalidConfigs })}</span>
            </div>
            {!!bulkPreview.results?.length && (
              <div className="mt-3 max-h-40 overflow-auto rounded border border-[#e0e0e0] bg-white">
                <table className="w-full text-xs">
                  <thead className="bg-[#fafafa] text-[#999]">
                    <tr>
                      <th className="px-2 py-1 text-left">{t("admin.pc.colPreset")}</th>
                      <th className="px-2 py-1 text-left">{t("admin.pc.colStatus")}</th>
                      <th className="px-2 py-1 text-left">{t("admin.pc.colSampleLabel")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bulkPreview.results.map((r) => (
                      <tr key={r.presetId} className="border-t border-[#e0e0e0]">
                        <td className="px-2 py-1.5 font-mono">{r.key}</td>
                        <td className="px-2 py-1.5">{r.status}</td>
                        <td className="px-2 py-1.5">
                          {r.sample ? `${r.sample.field}: ${r.sample.before} \u2192 ${r.sample.after}` : "\u2014"}
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
              <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-black">{t(MODEL_LABELS[group.model] || "admin.pc.modelOther")}</h2>
              <span className="rounded-[2px] bg-[#f5f5f5] px-2.5 py-1 text-[10px] font-semibold text-[#666]">
                {t("admin.pc.nPresetsCount", { n: group.items.length })}
              </span>
            </div>
            {group.items.map((preset) => {
          const isEditing = editing === preset.id;
          const productCount = preset._count?.products ?? 0;

          return (
            <div
              key={preset.id}
              className="border border-[#e0e0e0] rounded-[3px] bg-white overflow-hidden"
            >
              {/* Header */}
              <div className="px-5 py-4 flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base">{preset.name}</h3>
                    <span
                      className={`px-2 py-0.5 rounded-[2px] text-[10px] font-bold ${
                        preset.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-[#f5f5f5] text-[#999]"
                      }`}
                    >
                      {preset.isActive ? t("admin.pc.active") : t("admin.pc.inactive")}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-[#999]">
                    <span className="font-mono bg-[#fafafa] px-2 py-0.5 rounded">
                      {preset.key}
                    </span>
                    <span>{t(MODEL_LABELS[preset.model] || "admin.pc.modelOther")}</span>
                    <span>{t("admin.pc.nProductsCount", { n: productCount })}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleActive(preset)}
                    className="px-3 py-1.5 text-xs font-medium rounded-[3px] border border-[#e0e0e0] hover:bg-[#fafafa]"
                  >
                    {preset.isActive ? t("admin.pc.deactivate") : t("admin.pc.activate")}
                  </button>
                  {isEditing ? (
                    <button
                      onClick={cancelEdit}
                      className="px-3 py-1.5 text-xs font-medium rounded-[3px] border border-[#e0e0e0] hover:bg-[#fafafa]"
                    >
                      {t("admin.pc.cancel")}
                    </button>
                  ) : (
                    <button
                      onClick={() => startEdit(preset)}
                      className="px-3 py-1.5 text-xs font-medium rounded-[3px] bg-black text-[#fff] hover:bg-[#222]"
                    >
                      {t("admin.pc.editConfig")}
                    </button>
                  )}
                </div>
              </div>

              {/* Editor */}
              {isEditing && (
                <div className="border-t border-[#e0e0e0] px-5 py-4 space-y-4 bg-[#fafafa]">
                  <label className="block">
                    <span className="text-xs font-semibold text-[#666] uppercase tracking-[0.14em]">
                      {t("admin.pc.presetNameLabel")}
                    </span>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="mt-1 w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm"
                    />
                  </label>

                  {/* Structured editors for materials & finishings */}
                  {parsedConfig && (
                    <div className="space-y-4 rounded-[3px] border border-[#e0e0e0] bg-white p-4">
                      <MaterialsEditor
                        materials={Array.isArray(parsedConfig.materials) ? parsedConfig.materials : []}
                        onChange={(mats) => updateConfigField("materials", mats)}
                        t={t}
                      />
                      <div className="border-t border-[#e0e0e0]" />
                      <FinishingsEditor
                        finishings={Array.isArray(parsedConfig.finishings) ? parsedConfig.finishings : []}
                        onChange={(fins) => updateConfigField("finishings", fins)}
                        t={t}
                      />
                    </div>
                  )}

                  <label className="block">
                    <span className="text-xs font-semibold text-[#666] uppercase tracking-[0.14em]">
                      {t("admin.pc.configJson")}
                    </span>
                    <textarea
                      value={editJson}
                      onChange={(e) => setEditJson(e.target.value)}
                      rows={16}
                      className="mt-1 w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm font-mono leading-relaxed"
                      spellCheck={false}
                    />
                  </label>
                  <div className="flex justify-end">
                    <button
                      onClick={() => handleSave(preset.id)}
                      disabled={saving}
                      className="px-5 py-2 rounded-[3px] bg-black text-[#fff] text-xs font-bold uppercase tracking-[0.14em] hover:bg-[#222] disabled:bg-[#999]"
                    >
                      {saving ? t("admin.pc.saving") : t("admin.pc.saveChanges")}
                    </button>
                  </div>
                </div>
              )}

              {/* Preview (collapsed) */}
              {!isEditing && (
                <div className="border-t border-[#e0e0e0] px-5 py-3">
                  <pre className="text-[11px] text-[#999] font-mono max-h-24 overflow-auto whitespace-pre-wrap">
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
          <div className="text-center py-12 text-[#999]">
            <p className="text-lg font-semibold">{t("admin.pc.noPresetsFound")}</p>
            <p className="text-sm mt-1">
              {t("admin.pc.runSeedScript")}
            </p>
          </div>
        )}
      </div>

      {/* ── Pricing Formula Reference ── */}
      <div className="mt-8 rounded-[3px] border border-[#e0e0e0] bg-white">
        <button
          type="button"
          onClick={() => setShowFormulas((v) => !v)}
          className="flex w-full items-center justify-between px-6 py-4 text-left hover:bg-[#fafafa]"
        >
          <div>
            <h2 className="text-sm font-bold text-[#111]">{t("admin.pricing.formulaTitle", "Pricing Formula Reference")}</h2>
            <p className="text-xs text-[#999] mt-0.5">{t("admin.pricing.formulaDesc", "How prices are calculated for each product type")}</p>
          </div>
          <svg className={`h-5 w-5 text-[#999] transition-transform ${showFormulas ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
        </button>
        {showFormulas && (
          <div className="border-t border-[#e0e0e0] px-6 py-5 space-y-6 text-xs text-[#333]">

            {/* General formula */}
            <div>
              <h3 className="font-bold text-sm text-[#111] mb-2">{t("admin.pricing.generalFormula", "General Formula (All Templates)")}</h3>
              <div className="bg-[#f5f5f5] rounded-[3px] p-4 font-mono text-xs leading-relaxed">
                <p>{t("admin.pricing.fSelling", "Selling Price")} = {t("admin.pricing.fCost", "Total Cost")} ÷ (1 - {t("admin.pricing.fMargin", "Margin")})</p>
                <p className="mt-1">{t("admin.pricing.fFinal", "Final Price")} = roundUp99({t("admin.pricing.fSelling", "Selling Price")}) → $XX.99</p>
              </div>
              <p className="mt-2 text-[#666]">{t("admin.pricing.marginExplain", "Margin is tiered by product category × quantity. Higher qty = lower margin.")}</p>
            </div>

            {/* Margin tiers table */}
            <div>
              <h3 className="font-bold text-sm text-[#111] mb-2">{t("admin.pricing.marginTiers", "Margin Tiers")}</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#f5f5f5]">
                      <th className="px-3 py-2 text-left font-semibold border border-[#e0e0e0]">{t("admin.pricing.category", "Category")}</th>
                      <th className="px-3 py-2 text-center font-semibold border border-[#e0e0e0]">1-24</th>
                      <th className="px-3 py-2 text-center font-semibold border border-[#e0e0e0]">25-99</th>
                      <th className="px-3 py-2 text-center font-semibold border border-[#e0e0e0]">100-499</th>
                      <th className="px-3 py-2 text-center font-semibold border border-[#e0e0e0]">500-999</th>
                      <th className="px-3 py-2 text-center font-semibold border border-[#e0e0e0]">1000+</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["Stickers / Labels / Decals", "80%", "80%", "75%", "68%", "50%"],
                      ["Signs / Boards", "75%", "60%", "50%", "45%", "40%"],
                      ["Banners / Displays", "75%", "68%", "60%", "55%", "50%"],
                      ["Paper Print (Cards/Flyers)", "75%", "75%", "70%", "65%", "45%"],
                      ["Canvas Prints", "75%", "70%", "65%", "65%", "65%"],
                      ["Window/Wall/Floor", "75%", "70%", "65%", "60%", "55%"],
                      ["Vehicle Graphics", "70%", "65%", "60%", "60%", "60%"],
                    ].map(([cat, ...cols]) => (
                      <tr key={cat}>
                        <td className="px-3 py-1.5 font-medium border border-[#e0e0e0]">{cat}</td>
                        {cols.map((c, i) => (
                          <td key={i} className="px-3 py-1.5 text-center border border-[#e0e0e0]">{c}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-2 text-[#666]">{t("admin.pricing.marginExample", "Example: Stickers qty 100, margin = 75%. Cost $5 → Sell $5 ÷ (1-0.75) = $20 → $19.99")}</p>
            </div>

            {/* Template A: Vinyl Print */}
            <div className="border-t border-[#e0e0e0] pt-4">
              <h3 className="font-bold text-sm text-[#111] mb-2">Template A: Vinyl Print (Stickers / Labels / Decals)</h3>
              <div className="bg-[#f5f5f5] rounded-[3px] p-4 font-mono text-xs leading-relaxed space-y-1">
                <p>sqft = (width + 0.25) × (height + 0.25) ÷ 144</p>
                <p>materialCost = sqft × material.costPerSqft × qty</p>
                <p>inkCost = sqft × inkRate × qty</p>
                <p>laminationCost = sqft × lam.costPerSqft × qty</p>
                <p>cutCost = perimeter × $0.008 × qty</p>
                <p>totalCost = materialCost + inkCost + laminationCost + cutCost</p>
                <p>+ setupFee $12 + surcharges (shape, print mode)</p>
              </div>
              <p className="mt-1 text-[#666]">Min price: $25. Ink rate ~ $0.17/sqft. White vinyl ~ $0.40/sqft.</p>
            </div>

            {/* Template B: Board Sign */}
            <div className="border-t border-[#e0e0e0] pt-4">
              <h3 className="font-bold text-sm text-[#111] mb-2">Template B: Board Sign (Coroplast / Foam / PVC / Aluminum)</h3>
              <div className="bg-[#f5f5f5] rounded-[3px] p-4 font-mono text-xs leading-relaxed space-y-1">
                <p>sqft = width × height ÷ 144</p>
                <p>boardCost = sqft × board.costPerSqft × qty</p>
                <p>vinylCost = sqft × vinyl.costPerSqft × qty</p>
                <p>inkCost = sqft × inkRate × qty</p>
                <p>laminationCost = sqft × lam.costPerSqft × qty</p>
                <p>totalCost = boardCost + vinylCost + inkCost + laminationCost</p>
              </div>
              <p className="mt-1 text-[#666]">Min price: $15. Coroplast 4mm ~ $0.60/sqft.</p>
            </div>

            {/* Template C: Banner */}
            <div className="border-t border-[#e0e0e0] pt-4">
              <h3 className="font-bold text-sm text-[#111] mb-2">Template C: Banner (Vinyl / Mesh / Fabric)</h3>
              <div className="bg-[#f5f5f5] rounded-[3px] p-4 font-mono text-xs leading-relaxed space-y-1">
                <p>sqft = width × height ÷ 144</p>
                <p>materialCost = sqft × material.costPerSqft × qty</p>
                <p>inkCost = sqft × inkRate × qty</p>
                <p>finishingCost = (grommets/hems per DB pricing)</p>
                <p>accessoryCost = hardware price × 2.5× markup</p>
                <p>totalCost = materialCost + inkCost + finishingCost + accessoryCost</p>
                <p>+ setupFee ($28 qty 1-2, $15 qty 3-5, $10 qty 6+)</p>
              </div>
              <p className="mt-1 text-[#666]">Min price: $15. 13oz vinyl ~ $0.30/sqft.</p>
            </div>

            {/* Template D: Paper Print */}
            <div className="border-t border-[#e0e0e0] pt-4">
              <h3 className="font-bold text-sm text-[#111] mb-2">Template D: Paper Print (Cards / Flyers / Postcards / Menus)</h3>
              <div className="bg-[#f5f5f5] rounded-[3px] p-4 font-mono text-xs leading-relaxed space-y-1">
                <p>piecesPerSheet = imposition(12×18 parent, piece size)</p>
                <p>sheetsNeeded = ceil(qty ÷ piecesPerSheet)</p>
                <p>paperCost = sheetsNeeded × paper.costPerSheet</p>
                <p>inkCost = qty × inkClick × passes</p>
                <p>laminationCost = parentSheet sqft × sheetsNeeded × lam.costPerSqft</p>
                <p>cuttingCost = sheetsNeeded × $0.25</p>
                <p>totalCost = paperCost + inkCost + laminationCost + cuttingCost</p>
                <p className="text-[#999]">(Oversize pieces: area-proportional scaling)</p>
              </div>
              <p className="mt-1 text-[#666]">Min price: $15. Ink click ~ $0.036. 14pt cardstock ~ $0.24/sheet.</p>
            </div>

            {/* Template E: Canvas */}
            <div className="border-t border-[#e0e0e0] pt-4">
              <h3 className="font-bold text-sm text-[#111] mb-2">Template E: Canvas Print</h3>
              <div className="bg-[#f5f5f5] rounded-[3px] p-4 font-mono text-xs leading-relaxed space-y-1">
                <p>sqft = width × height ÷ 144</p>
                <p>canvasCost = sqft × canvas.costPerSqft × qty</p>
                <p>inkCost = sqft × inkRate × qty</p>
                <p>frameCost = (2 × width + 2 × height) × $/inch lookup</p>
                <p>assemblyCost = $5.00 per canvas</p>
                <p>totalCost = canvasCost + inkCost + (frameCost + assemblyCost) × qty</p>
              </div>
              <p className="mt-1 text-[#666]">Min price: $49. Canvas material ~ $1.20/sqft.</p>
            </div>

            {/* Template F: Vinyl Cut */}
            <div className="border-t border-[#e0e0e0] pt-4">
              <h3 className="font-bold text-sm text-[#111] mb-2">Template F: Vinyl Cut Lettering (Vehicle Graphics)</h3>
              <div className="bg-[#f5f5f5] rounded-[3px] p-4 font-mono text-xs leading-relaxed space-y-1">
                <p>sqft = width × height ÷ 144</p>
                <p>materialCost = sqft × vinyl.costPerSqft × qty</p>
                <p>cutLabor = perimeter × $0.008 × qty</p>
                <p>weedLabor = sqft × $2.00 × qty</p>
                <p>transferTape = sqft × $0.30 × qty</p>
                <p>totalCost = materialCost + cutLabor + weedLabor + transferTape</p>
              </div>
              <p className="mt-1 text-[#666]">Min price: $15. Oracal 651 ~ $0.55/sqft.</p>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
