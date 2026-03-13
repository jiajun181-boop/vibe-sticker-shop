"use client";

import { useEffect, useState } from "react";
import { formatCad } from "@/lib/admin/format-cad";
import { useTranslation } from "@/lib/i18n/useTranslation";

const EQUIPMENT_TYPES = [
  { value: "printer", label: "Printer" },
  { value: "cutter", label: "Cutter" },
  { value: "laminator", label: "Laminator" },
  { value: "folder", label: "Folder" },
  { value: "binder", label: "Binder" },
  { value: "other", label: "Other" },
];

const STATUS_STYLES = {
  operational: "bg-emerald-50 text-emerald-700",
  maintenance: "bg-yellow-50 text-yellow-700",
  repair: "bg-red-50 text-red-700",
  decommissioned: "bg-gray-100 text-gray-500",
};

export default function EquipmentPage() {
  const { t } = useTranslation();
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({
    name: "",
    type: "printer",
    model: "",
    serialNumber: "",
    location: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [showMaintenance, setShowMaintenance] = useState(null);
  const [maintenanceForm, setMaintenanceForm] = useState({
    type: "preventive",
    description: "",
    performedBy: "",
    performedAt: new Date().toISOString().split("T")[0],
    nextDueAt: "",
    costCents: "",
    notes: "",
  });

  useEffect(() => {
    fetch("/api/admin/equipment")
      .then((r) => (r.ok ? r.json() : { equipment: [] }))
      .then((data) => setEquipment(data.equipment || []))
      .finally(() => setLoading(false));
  }, []);

  async function addEquipment() {
    if (!addForm.name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/equipment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "equipment", data: addForm }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setEquipment((prev) => [
        { ...data.equipment, recentMaintenance: [], nextMaintenance: null },
        ...prev,
      ]);
      setShowAdd(false);
      setAddForm({ name: "", type: "printer", model: "", serialNumber: "", location: "", notes: "" });
    } catch {
      alert(t("admin.equipment.addFailed"));
    } finally {
      setSaving(false);
    }
  }

  async function addMaintenance(equipmentId) {
    if (!maintenanceForm.description.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/equipment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "maintenance",
          data: {
            equipmentId,
            ...maintenanceForm,
            costCents: maintenanceForm.costCents
              ? parseInt(maintenanceForm.costCents) * 100
              : undefined,
          },
        }),
      });
      if (!res.ok) throw new Error("Failed");
      // Refresh
      const refreshRes = await fetch("/api/admin/equipment");
      const refreshData = await refreshRes.json();
      setEquipment(refreshData.equipment || []);
      setShowMaintenance(null);
      setMaintenanceForm({
        type: "preventive",
        description: "",
        performedBy: "",
        performedAt: new Date().toISOString().split("T")[0],
        nextDueAt: "",
        costCents: "",
        notes: "",
      });
    } catch {
      alert(t("admin.equipment.maintenanceFailed"));
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(id, status) {
    try {
      await fetch("/api/admin/equipment", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      setEquipment((prev) =>
        prev.map((eq) => (eq.id === id ? { ...eq, status } : eq))
      );
    } catch {
      alert(t("admin.equipment.statusFailed"));
    }
  }

  if (loading)
    return (
      <div className="flex h-48 items-center justify-center text-sm text-[#999]">
        Loading equipment...
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-black">Equipment Management</h1>
          <p className="text-xs text-[#999]">Track equipment, maintenance schedules, and service history</p>
        </div>
        <button
          type="button"
          onClick={() => setShowAdd(!showAdd)}
          className="rounded-md bg-black px-4 py-2 text-xs font-medium text-white hover:bg-gray-800"
        >
          {showAdd ? "Cancel" : "Add Equipment"}
        </button>
      </div>

      {/* Add Equipment Form */}
      {showAdd && (
        <div className="rounded-lg border border-[#e5e5e5] bg-white p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input
              value={addForm.name}
              onChange={(e) => setAddForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="Equipment Name *"
              className="rounded-md border border-[#e5e5e5] px-3 py-2 text-sm outline-none focus:border-black"
            />
            <select
              value={addForm.type}
              onChange={(e) => setAddForm((p) => ({ ...p, type: e.target.value }))}
              className="rounded-md border border-[#e5e5e5] px-3 py-2 text-sm outline-none focus:border-black"
            >
              {EQUIPMENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <input
              value={addForm.model}
              onChange={(e) => setAddForm((p) => ({ ...p, model: e.target.value }))}
              placeholder="Model"
              className="rounded-md border border-[#e5e5e5] px-3 py-2 text-sm outline-none focus:border-black"
            />
            <input
              value={addForm.serialNumber}
              onChange={(e) => setAddForm((p) => ({ ...p, serialNumber: e.target.value }))}
              placeholder="Serial Number"
              className="rounded-md border border-[#e5e5e5] px-3 py-2 text-sm outline-none focus:border-black"
            />
            <input
              value={addForm.location}
              onChange={(e) => setAddForm((p) => ({ ...p, location: e.target.value }))}
              placeholder="Location"
              className="rounded-md border border-[#e5e5e5] px-3 py-2 text-sm outline-none focus:border-black"
            />
          </div>
          <button
            type="button"
            onClick={addEquipment}
            disabled={saving || !addForm.name.trim()}
            className="rounded-md bg-black px-4 py-2 text-xs font-medium text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {saving ? "Adding..." : "Add Equipment"}
          </button>
        </div>
      )}

      {/* Equipment List */}
      {equipment.length === 0 ? (
        <div className="rounded-lg border border-[#e5e5e5] bg-[#fafafa] p-8 text-center text-sm text-[#999]">
          No equipment registered yet. Click "Add Equipment" to get started.
        </div>
      ) : (
        <div className="space-y-4">
          {equipment.map((eq) => (
            <div key={eq.id} className="rounded-lg border border-[#e5e5e5] bg-white p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-black">{eq.name}</h3>
                  <div className="mt-1 flex flex-wrap gap-2 text-xs text-[#666]">
                    <span className="capitalize">{eq.type}</span>
                    {eq.model && <span>Model: {eq.model}</span>}
                    {eq.serialNumber && <span>S/N: {eq.serialNumber}</span>}
                    {eq.location && <span>@ {eq.location}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={eq.status}
                    onChange={(e) => updateStatus(eq.id, e.target.value)}
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold border-0 outline-none ${STATUS_STYLES[eq.status] || STATUS_STYLES.operational}`}
                  >
                    <option value="operational">Operational</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="repair">Repair</option>
                    <option value="decommissioned">Decommissioned</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowMaintenance(showMaintenance === eq.id ? null : eq.id)}
                    className="rounded-md bg-[#f5f5f5] px-3 py-1.5 text-xs font-medium text-[#666] hover:bg-[#e5e5e5]"
                  >
                    + Maintenance
                  </button>
                </div>
              </div>

              {/* Next maintenance due */}
              {eq.nextMaintenance && (
                <div className="mt-2 rounded-md bg-yellow-50 px-3 py-1.5 text-xs text-yellow-700">
                  Next maintenance due: {new Date(eq.nextMaintenance.nextDueAt).toLocaleDateString("en-CA")}
                  {" — "}{eq.nextMaintenance.type}
                </div>
              )}

              {/* Maintenance form */}
              {showMaintenance === eq.id && (
                <div className="mt-3 rounded-md border border-[#f0f0f0] bg-[#fafafa] p-3 space-y-2">
                  <p className="text-xs font-semibold text-[#666]">Log Maintenance</p>
                  <div className="grid grid-cols-3 gap-2">
                    <select
                      value={maintenanceForm.type}
                      onChange={(e) => setMaintenanceForm((p) => ({ ...p, type: e.target.value }))}
                      className="rounded-md border border-[#e5e5e5] px-2 py-1.5 text-xs outline-none"
                    >
                      <option value="preventive">Preventive</option>
                      <option value="corrective">Corrective</option>
                      <option value="inspection">Inspection</option>
                      <option value="calibration">Calibration</option>
                    </select>
                    <input
                      type="date"
                      value={maintenanceForm.performedAt}
                      onChange={(e) => setMaintenanceForm((p) => ({ ...p, performedAt: e.target.value }))}
                      className="rounded-md border border-[#e5e5e5] px-2 py-1.5 text-xs outline-none"
                    />
                    <input
                      value={maintenanceForm.performedBy}
                      onChange={(e) => setMaintenanceForm((p) => ({ ...p, performedBy: e.target.value }))}
                      placeholder="Performed by"
                      className="rounded-md border border-[#e5e5e5] px-2 py-1.5 text-xs outline-none"
                    />
                  </div>
                  <input
                    value={maintenanceForm.description}
                    onChange={(e) => setMaintenanceForm((p) => ({ ...p, description: e.target.value }))}
                    placeholder="Description *"
                    className="w-full rounded-md border border-[#e5e5e5] px-2 py-1.5 text-xs outline-none"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="date"
                      value={maintenanceForm.nextDueAt}
                      onChange={(e) => setMaintenanceForm((p) => ({ ...p, nextDueAt: e.target.value }))}
                      placeholder="Next due date"
                      className="rounded-md border border-[#e5e5e5] px-2 py-1.5 text-xs outline-none"
                    />
                    <input
                      type="number"
                      value={maintenanceForm.costCents}
                      onChange={(e) => setMaintenanceForm((p) => ({ ...p, costCents: e.target.value }))}
                      placeholder="Cost ($)"
                      className="rounded-md border border-[#e5e5e5] px-2 py-1.5 text-xs outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => addMaintenance(eq.id)}
                    disabled={saving || !maintenanceForm.description.trim()}
                    className="rounded-md bg-black px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-800 disabled:opacity-50"
                  >
                    {saving ? "Saving..." : "Log Maintenance"}
                  </button>
                </div>
              )}

              {/* Recent maintenance history */}
              {eq.recentMaintenance && eq.recentMaintenance.length > 0 && (
                <div className="mt-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[#999] mb-1">
                    Recent Maintenance
                  </p>
                  <div className="space-y-1">
                    {eq.recentMaintenance.map((m) => (
                      <div key={m.id} className="flex items-center justify-between text-xs text-[#666] border-b border-[#f5f5f5] py-1">
                        <div className="flex items-center gap-2">
                          <span className="capitalize text-[10px] rounded bg-[#f0f0f0] px-1.5 py-0.5">{m.type}</span>
                          <span>{m.description}</span>
                        </div>
                        <div className="flex items-center gap-3 text-[#999]">
                          {m.costCents > 0 && <span>{formatCad(m.costCents)}</span>}
                          <span>{new Date(m.performedAt).toLocaleDateString("en-CA")}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
