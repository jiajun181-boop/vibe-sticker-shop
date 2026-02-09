"use client";

import { useEffect, useState } from "react";

const MODEL_LABELS = {
  AREA_TIERED: "Area Tiered ($/sqft)",
  QTY_TIERED: "Qty Tiered ($/ea)",
  QTY_OPTIONS: "Qty + Options",
};

export default function PricingPresetsPage() {
  const [presets, setPresets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // preset id being edited
  const [editJson, setEditJson] = useState("");
  const [editName, setEditName] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchPresets();
  }, []);

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

      <div className="space-y-4">
        {presets.map((preset) => {
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
                <div className="border-t border-gray-200 px-5 py-4 space-y-3 bg-gray-50">
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
