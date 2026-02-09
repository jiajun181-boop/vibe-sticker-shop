"use client";

import { useEffect, useState, useCallback } from "react";

export default function FactoriesPage() {
  const [factories, setFactories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingFactory, setEditingFactory] = useState(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formName, setFormName] = useState("");
  const [formLocation, setFormLocation] = useState("");
  const [formCapabilities, setFormCapabilities] = useState([]);
  const [formCapInput, setFormCapInput] = useState("");
  const [formActive, setFormActive] = useState(true);

  const fetchFactories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/factories");
      const data = await res.json();
      setFactories(data.factories || []);
    } catch (err) {
      console.error("Failed to load factories:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFactories();
  }, [fetchFactories]);

  function showMsg(text, isError = false) {
    setMessage({ text, isError });
    setTimeout(() => setMessage(null), 3000);
  }

  function resetForm() {
    setFormName("");
    setFormLocation("");
    setFormCapabilities([]);
    setFormCapInput("");
    setFormActive(true);
    setEditingFactory(null);
  }

  function openAddModal() {
    resetForm();
    setShowModal(true);
  }

  function openEditModal(factory) {
    setEditingFactory(factory);
    setFormName(factory.name || "");
    setFormLocation(factory.location || "");
    setFormCapabilities(
      Array.isArray(factory.capabilities) ? [...factory.capabilities] : []
    );
    setFormCapInput("");
    setFormActive(factory.isActive ?? true);
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    resetForm();
  }

  function handleCapKeyDown(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      const value = formCapInput.trim();
      if (value && !formCapabilities.includes(value)) {
        setFormCapabilities((prev) => [...prev, value]);
      }
      setFormCapInput("");
    }
  }

  function removeCapability(cap) {
    setFormCapabilities((prev) => prev.filter((c) => c !== cap));
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!formName.trim()) return;

    setSaving(true);
    const payload = {
      name: formName.trim(),
      location: formLocation.trim() || null,
      capabilities: formCapabilities,
      isActive: formActive,
    };

    try {
      const isEdit = !!editingFactory;
      const url = isEdit
        ? `/api/admin/factories/${editingFactory.id}`
        : "/api/admin/factories";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        showMsg(data.error || "Failed to save factory", true);
      } else {
        closeModal();
        showMsg(isEdit ? "Factory updated" : "Factory created");
        fetchFactories();
      }
    } catch {
      showMsg("Network error", true);
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(factory) {
    try {
      const res = await fetch(`/api/admin/factories/${factory.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !factory.isActive }),
      });
      const data = await res.json();

      if (!res.ok) {
        showMsg(data.error || "Failed to update factory", true);
      } else {
        showMsg(
          factory.isActive ? "Factory deactivated" : "Factory activated"
        );
        fetchFactories();
      }
    } catch {
      showMsg("Network error", true);
    }
  }

  async function handleDelete(factory) {
    if (
      !confirm(
        `Delete factory "${factory.name}"? This cannot be undone.`
      )
    )
      return;

    try {
      const res = await fetch(`/api/admin/factories/${factory.id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (!res.ok) {
        showMsg(data.error || "Failed to delete factory", true);
      } else {
        showMsg("Factory deleted");
        fetchFactories();
      }
    } catch {
      showMsg("Network error", true);
    }
  }

  const activeJobs = (factory) => factory.activeJobs ?? factory._count?.jobs ?? 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Factories</h1>
        <button
          type="button"
          onClick={openAddModal}
          className="rounded-lg bg-gray-900 px-4 py-2 text-xs font-semibold text-white hover:bg-black"
        >
          + Add Factory
        </button>
      </div>

      {/* Toast */}
      {message && (
        <div
          className={`rounded-lg px-4 py-3 text-sm font-medium ${
            message.isError
              ? "bg-red-50 text-red-600"
              : "bg-green-50 text-green-600"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex h-48 items-center justify-center text-sm text-gray-500">
          Loading...
        </div>
      ) : factories.length === 0 ? (
        <div className="flex h-48 flex-col items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-500">
          <p>No factories found</p>
          <button
            type="button"
            onClick={openAddModal}
            className="text-xs text-blue-600 hover:underline"
          >
            Add your first factory
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {factories.map((factory) => {
            const jobs = activeJobs(factory);
            const hasJobs = jobs > 0;

            return (
              <div
                key={factory.id}
                className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
              >
                {/* Top row: name + status */}
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-bold text-gray-900 truncate">
                      {factory.name}
                    </h3>
                    <p className="mt-0.5 text-sm text-gray-500">
                      {factory.location || "No location"}
                    </p>
                  </div>
                  <span
                    className={`ml-3 inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      factory.isActive
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {factory.isActive ? "Active" : "Inactive"}
                  </span>
                </div>

                {/* Active jobs */}
                <div className="mt-4">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      hasJobs
                        ? "bg-blue-100 text-blue-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    <span className="text-sm font-bold">{jobs}</span>
                    active job{jobs !== 1 ? "s" : ""}
                  </span>
                </div>

                {/* Capabilities */}
                {Array.isArray(factory.capabilities) &&
                  factory.capabilities.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {factory.capabilities.map((cap) => (
                        <span
                          key={cap}
                          className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700"
                        >
                          {cap}
                        </span>
                      ))}
                    </div>
                  )}

                {/* Actions */}
                <div className="mt-4 flex items-center gap-2 border-t border-gray-100 pt-4">
                  <button
                    type="button"
                    onClick={() => openEditModal(factory)}
                    className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleActive(factory)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                      factory.isActive
                        ? "border border-yellow-200 text-yellow-700 hover:bg-yellow-50"
                        : "border border-green-200 text-green-700 hover:bg-green-50"
                    }`}
                  >
                    {factory.isActive ? "Deactivate" : "Activate"}
                  </button>
                  {hasJobs ? (
                    <span className="ml-auto text-xs text-gray-400">
                      Has active jobs
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleDelete(factory)}
                      className="ml-auto text-xs font-medium text-red-500 hover:text-red-700"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-8 shadow-xl">
            <h2 className="mb-6 text-lg font-semibold text-gray-900">
              {editingFactory ? "Edit Factory" : "Add Factory"}
            </h2>

            <form onSubmit={handleSave} className="space-y-4">
              {/* Name */}
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">
                  Name *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Vancouver Print Co."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900"
                />
              </div>

              {/* Location */}
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">
                  Location
                </label>
                <input
                  type="text"
                  value={formLocation}
                  onChange={(e) => setFormLocation(e.target.value)}
                  placeholder="e.g. Vancouver, BC"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900"
                />
              </div>

              {/* Capabilities */}
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">
                  Capabilities
                </label>
                <div className="rounded-lg border border-gray-300 px-3 py-2 focus-within:border-gray-900">
                  {formCapabilities.length > 0 && (
                    <div className="mb-2 flex flex-wrap gap-1.5">
                      {formCapabilities.map((cap) => (
                        <span
                          key={cap}
                          className="inline-flex items-center gap-1 rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700"
                        >
                          {cap}
                          <button
                            type="button"
                            onClick={() => removeCapability(cap)}
                            className="ml-0.5 text-gray-400 hover:text-gray-600"
                          >
                            &times;
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  <input
                    type="text"
                    value={formCapInput}
                    onChange={(e) => setFormCapInput(e.target.value)}
                    onKeyDown={handleCapKeyDown}
                    placeholder="Type a capability and press Enter"
                    className="w-full text-sm outline-none"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-400">
                  Press Enter to add each capability
                </p>
              </div>

              {/* Active checkbox */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="factory-active"
                  checked={formActive}
                  onChange={(e) => setFormActive(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                />
                <label
                  htmlFor="factory-active"
                  className="text-sm font-medium text-gray-700"
                >
                  Active
                </label>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 rounded-lg bg-gray-900 py-2.5 text-sm font-semibold text-white hover:bg-black disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editingFactory
                    ? "Save Changes"
                    : "Add Factory"}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 rounded-lg border border-gray-200 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
