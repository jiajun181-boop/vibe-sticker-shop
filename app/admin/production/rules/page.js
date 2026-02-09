"use client";

import { useEffect, useState, useCallback } from "react";

function timeAgo(dateString) {
  if (!dateString) return "Never";
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-CA");
}

function buildConditionsPills(conditions) {
  if (!conditions) return [];
  const pills = [];
  if (conditions.productType)
    pills.push(`Type: ${conditions.productType}`);
  if (conditions.material)
    pills.push(`Material: ${conditions.material}`);
  if (conditions.minQuantity != null && conditions.maxQuantity != null)
    pills.push(`Qty: ${conditions.minQuantity}-${conditions.maxQuantity}`);
  else if (conditions.minQuantity != null)
    pills.push(`Qty >= ${conditions.minQuantity}`);
  else if (conditions.maxQuantity != null)
    pills.push(`Qty <= ${conditions.maxQuantity}`);
  if (conditions.priority)
    pills.push(`Priority: ${conditions.priority}`);
  return pills;
}

const productTypeOptions = [
  { value: "", label: "Any" },
  { value: "sticker", label: "Sticker" },
  { value: "label", label: "Label" },
  { value: "sign", label: "Sign" },
  { value: "other", label: "Other" },
];

const orderPriorityOptions = [
  { value: "", label: "Any" },
  { value: "normal", label: "Normal" },
  { value: "rush", label: "Rush" },
  { value: "urgent", label: "Urgent" },
];

const autoPriorityOptions = [
  { value: "", label: "Don't change" },
  { value: "normal", label: "Normal" },
  { value: "rush", label: "Rush" },
  { value: "urgent", label: "Urgent" },
];

export default function AssignmentRulesPage() {
  const [rules, setRules] = useState([]);
  const [factories, setFactories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formName, setFormName] = useState("");
  const [formPriority, setFormPriority] = useState(1);
  const [formActive, setFormActive] = useState(true);
  const [formProductType, setFormProductType] = useState("");
  const [formMaterial, setFormMaterial] = useState("");
  const [formMinQty, setFormMinQty] = useState("");
  const [formMaxQty, setFormMaxQty] = useState("");
  const [formOrderPriority, setFormOrderPriority] = useState("");
  const [formFactoryId, setFormFactoryId] = useState("");
  const [formAssignedTo, setFormAssignedTo] = useState("");
  const [formAutoPriority, setFormAutoPriority] = useState("");

  const fetchRules = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/production/rules");
      const data = await res.json();
      setRules(Array.isArray(data) ? data : data.rules || []);
    } catch (err) {
      console.error("Failed to load rules:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchFactories = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/factories");
      const data = await res.json();
      setFactories(data.factories || data || []);
    } catch (err) {
      console.error("Failed to load factories:", err);
    }
  }, []);

  useEffect(() => {
    fetchRules();
    fetchFactories();
  }, [fetchRules, fetchFactories]);

  function showMsg(text, isError = false) {
    setMessage({ text, isError });
    setTimeout(() => setMessage(null), 3000);
  }

  function resetForm() {
    setFormName("");
    setFormPriority(rules.length + 1);
    setFormActive(true);
    setFormProductType("");
    setFormMaterial("");
    setFormMinQty("");
    setFormMaxQty("");
    setFormOrderPriority("");
    setFormFactoryId("");
    setFormAssignedTo("");
    setFormAutoPriority("");
    setEditingRule(null);
  }

  function openAddModal() {
    resetForm();
    setFormPriority(rules.length + 1);
    setShowModal(true);
  }

  function openEditModal(rule) {
    setEditingRule(rule);
    setFormName(rule.name || "");
    setFormPriority(rule.priority ?? 1);
    setFormActive(rule.isActive ?? true);

    const c = rule.conditions || {};
    setFormProductType(c.productType || "");
    setFormMaterial(c.material || "");
    setFormMinQty(c.minQuantity != null ? String(c.minQuantity) : "");
    setFormMaxQty(c.maxQuantity != null ? String(c.maxQuantity) : "");
    setFormOrderPriority(c.priority || "");

    const a = rule.action || {};
    setFormFactoryId(a.factoryId || "");
    setFormAssignedTo(a.assignedTo || "");
    setFormAutoPriority(a.autoPriority || "");

    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    resetForm();
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!formName.trim() || !formFactoryId) return;

    setSaving(true);

    const conditions = {};
    if (formProductType) conditions.productType = formProductType;
    if (formMaterial.trim()) conditions.material = formMaterial.trim();
    if (formMinQty !== "") conditions.minQuantity = parseInt(formMinQty, 10);
    if (formMaxQty !== "") conditions.maxQuantity = parseInt(formMaxQty, 10);
    if (formOrderPriority) conditions.priority = formOrderPriority;

    const action = { factoryId: formFactoryId };
    if (formAssignedTo.trim()) action.assignedTo = formAssignedTo.trim();
    if (formAutoPriority) action.autoPriority = formAutoPriority;

    const payload = {
      name: formName.trim(),
      priority: parseInt(formPriority, 10),
      isActive: formActive,
      conditions,
      action,
    };

    try {
      const isEdit = !!editingRule;
      const url = isEdit
        ? `/api/admin/production/rules/${editingRule.id}`
        : "/api/admin/production/rules";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        showMsg(data.error || "Failed to save rule", true);
      } else {
        closeModal();
        showMsg(isEdit ? "Rule updated" : "Rule created");
        fetchRules();
      }
    } catch {
      showMsg("Network error", true);
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(rule) {
    try {
      const res = await fetch(`/api/admin/production/rules/${rule.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !rule.isActive }),
      });
      const data = await res.json();

      if (!res.ok) {
        showMsg(data.error || "Failed to update rule", true);
      } else {
        fetchRules();
      }
    } catch {
      showMsg("Network error", true);
    }
  }

  async function handleDelete(rule) {
    if (!confirm(`Delete rule "${rule.name}"? This cannot be undone.`)) return;

    try {
      const res = await fetch(`/api/admin/production/rules/${rule.id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (!res.ok) {
        showMsg(data.error || "Failed to delete rule", true);
      } else {
        showMsg("Rule deleted");
        fetchRules();
      }
    } catch {
      showMsg("Network error", true);
    }
  }

  function getFactoryName(factoryId) {
    const f = factories.find((fac) => fac.id === factoryId);
    return f ? f.name : factoryId || "\u2014";
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            Assignment Rules
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Rules are evaluated in priority order. The first matching rule is
            applied to new production jobs.
          </p>
        </div>
        <button
          type="button"
          onClick={openAddModal}
          className="shrink-0 rounded-lg bg-gray-900 px-4 py-2 text-xs font-semibold text-white hover:bg-black"
        >
          + Add Rule
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
      ) : rules.length === 0 ? (
        <div className="flex h-48 flex-col items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white text-center text-sm text-gray-500 shadow-sm">
          <p>No assignment rules yet.</p>
          <p className="max-w-sm text-xs text-gray-400">
            Create your first rule to automatically assign production jobs to
            factories.
          </p>
          <button
            type="button"
            onClick={openAddModal}
            className="mt-2 text-xs font-medium text-blue-600 hover:underline"
          >
            Create a rule
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          {/* Desktop table */}
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                    Priority
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                    Rule Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                    Conditions
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                    Target Factory
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                    Triggers
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                    Last Triggered
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                    Active
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rules.map((rule) => {
                  const pills = buildConditionsPills(rule.conditions);
                  return (
                    <tr key={rule.id} className="hover:bg-gray-50">
                      {/* Priority */}
                      <td className="px-4 py-3">
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-xs font-semibold text-gray-700">
                          {rule.priority}
                        </span>
                      </td>

                      {/* Name */}
                      <td className="px-4 py-3">
                        <span className="font-semibold text-gray-900">
                          {rule.name}
                        </span>
                      </td>

                      {/* Conditions pills */}
                      <td className="px-4 py-3">
                        {pills.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {pills.map((pill) => (
                              <span
                                key={pill}
                                className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700"
                              >
                                {pill}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">
                            All jobs
                          </span>
                        )}
                      </td>

                      {/* Target factory */}
                      <td className="px-4 py-3 text-gray-700">
                        {getFactoryName(rule.action?.factoryId)}
                      </td>

                      {/* Trigger count */}
                      <td className="px-4 py-3 text-gray-600">
                        {rule.triggerCount ?? 0}
                      </td>

                      {/* Last triggered */}
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {timeAgo(rule.lastTriggered)}
                      </td>

                      {/* Active toggle */}
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(rule)}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors ${
                            rule.isActive ? "bg-green-500" : "bg-gray-300"
                          }`}
                          role="switch"
                          aria-checked={rule.isActive}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 translate-y-0.5 rounded-full bg-white shadow transition-transform ${
                              rule.isActive
                                ? "translate-x-[18px]"
                                : "translate-x-0.5"
                            }`}
                          />
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(rule)}
                            className="text-xs font-medium text-blue-600 hover:text-blue-800"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(rule)}
                            className="text-xs font-medium text-red-500 hover:text-red-700"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="divide-y divide-gray-100 lg:hidden">
            {rules.map((rule) => {
              const pills = buildConditionsPills(rule.conditions);
              return (
                <div
                  key={rule.id}
                  className="px-4 py-3 transition-colors hover:bg-gray-50"
                >
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-gray-200 text-[10px] font-semibold text-gray-700">
                          {rule.priority}
                        </span>
                        <span className="truncate text-sm font-semibold text-gray-900">
                          {rule.name}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        {getFactoryName(rule.action?.factoryId)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleActive(rule)}
                      className={`relative ml-3 inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors ${
                        rule.isActive ? "bg-green-500" : "bg-gray-300"
                      }`}
                      role="switch"
                      aria-checked={rule.isActive}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 translate-y-0.5 rounded-full bg-white shadow transition-transform ${
                          rule.isActive
                            ? "translate-x-[18px]"
                            : "translate-x-0.5"
                        }`}
                      />
                    </button>
                  </div>

                  {pills.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {pills.map((pill) => (
                        <span
                          key={pill}
                          className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700"
                        >
                          {pill}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span>{rule.triggerCount ?? 0} triggers</span>
                      <span>{timeAgo(rule.lastTriggered)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(rule)}
                        className="text-xs font-medium text-blue-600 hover:text-blue-800"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(rule)}
                        className="text-xs font-medium text-red-500 hover:text-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-8 shadow-xl">
            <h2 className="mb-6 text-lg font-semibold text-gray-900">
              {editingRule ? "Edit Rule" : "Add Rule"}
            </h2>

            <form onSubmit={handleSave} className="space-y-5">
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
                  placeholder="e.g. Vinyl stickers to Factory A"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900"
                />
              </div>

              {/* Priority + Active row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500">
                    Priority
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900"
                  />
                </div>
                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formActive}
                      onChange={(e) => setFormActive(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Active
                    </span>
                  </label>
                </div>
              </div>

              {/* Conditions section */}
              <fieldset>
                <legend className="mb-3 text-sm font-semibold text-gray-900">
                  Conditions{" "}
                  <span className="font-normal text-gray-400">
                    (all must match)
                  </span>
                </legend>
                <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
                  {/* Product type */}
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500">
                      Product Type
                    </label>
                    <select
                      value={formProductType}
                      onChange={(e) => setFormProductType(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-gray-900"
                    >
                      {productTypeOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Material */}
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500">
                      Material
                    </label>
                    <input
                      type="text"
                      value={formMaterial}
                      onChange={(e) => setFormMaterial(e.target.value)}
                      placeholder="e.g. vinyl, paper (optional)"
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-gray-900"
                    />
                  </div>

                  {/* Quantity range */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-500">
                        Min Quantity
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formMinQty}
                        onChange={(e) => setFormMinQty(e.target.value)}
                        placeholder="Optional"
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-gray-900"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-500">
                        Max Quantity
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formMaxQty}
                        onChange={(e) => setFormMaxQty(e.target.value)}
                        placeholder="Optional"
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-gray-900"
                      />
                    </div>
                  </div>

                  {/* Order priority */}
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500">
                      Order Priority
                    </label>
                    <select
                      value={formOrderPriority}
                      onChange={(e) => setFormOrderPriority(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-gray-900"
                    >
                      {orderPriorityOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </fieldset>

              {/* Action section */}
              <fieldset>
                <legend className="mb-3 text-sm font-semibold text-gray-900">
                  Action
                </legend>
                <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
                  {/* Factory */}
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500">
                      Factory *
                    </label>
                    <select
                      required
                      value={formFactoryId}
                      onChange={(e) => setFormFactoryId(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-gray-900"
                    >
                      <option value="">Select a factory</option>
                      {factories.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Default assignee */}
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500">
                      Default Assignee
                    </label>
                    <input
                      type="text"
                      value={formAssignedTo}
                      onChange={(e) => setFormAssignedTo(e.target.value)}
                      placeholder="e.g. John (optional)"
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-gray-900"
                    />
                  </div>

                  {/* Auto-set priority */}
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500">
                      Auto-set Priority
                    </label>
                    <select
                      value={formAutoPriority}
                      onChange={(e) => setFormAutoPriority(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-gray-900"
                    >
                      {autoPriorityOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </fieldset>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 rounded-lg bg-gray-900 py-2.5 text-sm font-semibold text-white hover:bg-black disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editingRule
                    ? "Save Changes"
                    : "Add Rule"}
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
