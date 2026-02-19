"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

const CATEGORY_COLORS = {
  "Banner Stand": "bg-indigo-100 text-indigo-800",
  "Sign Accessory": "bg-violet-100 text-violet-800",
  Finishing: "bg-fuchsia-100 text-fuchsia-800",
};

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
        className="cursor-pointer rounded px-1 py-0.5 hover:bg-indigo-50"
        title="Click to edit"
      >
        {type === "number" && value != null ? (
          field === "priceCents" ? `$${(Number(value) / 100).toFixed(2)}` : Number(value).toLocaleString()
        ) : (
          value || <span className="text-gray-300">—</span>
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
      className="w-full rounded border border-indigo-400 bg-indigo-50 px-1.5 py-0.5 text-sm font-mono focus:outline-none"
    />
  );
}

export default function HardwarePricingTable() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [saving, setSaving] = useState(null);
  const [open, setOpen] = useState(true);
  const [addingSlug, setAddingSlug] = useState("");
  const [addingName, setAddingName] = useState("");
  const [addingCategory, setAddingCategory] = useState("Banner Stand");
  const [addingPrice, setAddingPrice] = useState("");

  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/hardware");
      if (!res.ok) return;
      const data = await res.json();
      setItems(data.items);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const categories = useMemo(() => {
    const set = new Set(items.map((i) => i.category));
    return [...set].sort();
  }, [items]);

  const filtered = useMemo(() => {
    if (activeTab === "all") return items;
    return items.filter((i) => i.category === activeTab);
  }, [items, activeTab]);

  const handleCellSave = async (itemId, field, value) => {
    setSaving(itemId);
    try {
      const res = await fetch("/api/admin/hardware", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: itemId, [field]: value }),
      });
      if (res.ok) {
        const { item } = await res.json();
        setItems((prev) => prev.map((i) => (i.id === itemId ? item : i)));
      }
    } finally {
      setSaving(null);
    }
  };

  const handleAdd = async () => {
    if (!addingSlug.trim() || !addingName.trim()) return;
    const maxSort = items.filter((i) => i.category === addingCategory).reduce((max, i) => Math.max(max, i.sortOrder), 0);
    const res = await fetch("/api/admin/hardware", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug: addingSlug.trim(),
        name: addingName.trim(),
        category: addingCategory,
        priceCents: Number(addingPrice) || 0,
        sortOrder: maxSort + 1,
      }),
    });
    if (res.ok) {
      setAddingSlug("");
      setAddingName("");
      setAddingPrice("");
      fetchItems();
    } else {
      const err = await res.json().catch(() => ({}));
      alert(err.error || "Failed to add item");
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete "${name}"?`)) return;
    const res = await fetch(`/api/admin/hardware?id=${id}`, { method: "DELETE" });
    if (res.ok) setItems((prev) => prev.filter((i) => i.id !== id));
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4">
        <div className="h-8 w-48 animate-pulse rounded bg-indigo-100" />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between">
        <h3 className="text-sm font-bold text-indigo-900">Hardware &amp; Accessories Pricing</h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-indigo-500">{items.length} items</span>
          <svg className={`h-4 w-4 text-indigo-500 transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </div>
      </button>

      {open && (
        <div className="mt-4 space-y-3">
          {/* Category tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("all")}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold ${activeTab === "all" ? "bg-indigo-700 text-white" : "bg-indigo-100 text-indigo-600 hover:bg-indigo-200"}`}
            >
              All ({items.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveTab(cat)}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold ${activeTab === cat ? "bg-indigo-700 text-white" : "bg-indigo-100 text-indigo-600 hover:bg-indigo-200"}`}
              >
                {cat} ({items.filter((i) => i.category === cat).length})
              </button>
            ))}
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-lg border border-indigo-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b bg-indigo-50 text-[11px] font-bold uppercase tracking-wider text-indigo-500">
                  <th className="px-3 py-2 w-8">#</th>
                  <th className="px-3 py-2">Category</th>
                  <th className="px-3 py-2">Slug</th>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2 text-right">Price</th>
                  <th className="px-3 py-2">Unit</th>
                  <th className="px-3 py-2">Notes</th>
                  <th className="px-3 py-2 w-8"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr
                    key={item.id}
                    className={`border-b transition-colors hover:bg-indigo-50/50 ${saving === item.id ? "bg-yellow-50" : ""}`}
                  >
                    <td className="px-3 py-2 text-xs text-gray-400 font-mono">{item.sortOrder}</td>
                    <td className="px-3 py-2">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${CATEGORY_COLORS[item.category] || "bg-gray-100 text-gray-700"}`}>
                        {item.category}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-mono text-xs text-gray-500">{item.slug}</td>
                    <td className="px-3 py-2 font-medium text-gray-900">
                      <EditableCell value={item.name} field="name" onSave={(f, v) => handleCellSave(item.id, f, v)} />
                    </td>
                    <td className="px-3 py-2 text-right">
                      <span className="font-mono font-bold text-gray-900">
                        <EditableCell value={item.priceCents} field="priceCents" type="number" onSave={(f, v) => handleCellSave(item.id, f, v)} />
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs">
                      <EditableCell value={item.unit} field="unit" onSave={(f, v) => handleCellSave(item.id, f, v)} />
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-500 max-w-[200px] truncate">
                      <EditableCell value={item.notes} field="notes" onSave={(f, v) => handleCellSave(item.id, f, v)} />
                    </td>
                    <td className="px-3 py-2">
                      <button
                        onClick={() => handleDelete(item.id, item.name)}
                        className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
                        title="Delete"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-3 py-6 text-center text-sm text-gray-400">No items found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Add new item */}
          <div className="rounded-lg border border-indigo-200 bg-white p-3">
            <p className="text-xs font-bold text-indigo-700 uppercase tracking-wider mb-2">Add Hardware Item</p>
            <div className="flex flex-wrap items-end gap-2">
              <div>
                <label className="block text-xs text-indigo-600">Category</label>
                <select
                  value={addingCategory}
                  onChange={(e) => setAddingCategory(e.target.value)}
                  className="mt-1 rounded border border-indigo-300 bg-white px-2 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
                >
                  <option value="Banner Stand">Banner Stand</option>
                  <option value="Sign Accessory">Sign Accessory</option>
                  <option value="Finishing">Finishing</option>
                  <option value="Flag Hardware">Flag Hardware</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-indigo-600">Slug</label>
                <input
                  type="text" value={addingSlug} onChange={(e) => setAddingSlug(e.target.value)}
                  placeholder="my-new-item"
                  className="mt-1 w-40 rounded border border-indigo-300 px-2 py-1.5 text-sm font-mono focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-indigo-600">Name</label>
                <input
                  type="text" value={addingName} onChange={(e) => setAddingName(e.target.value)}
                  placeholder="Item Name"
                  className="mt-1 w-48 rounded border border-indigo-300 px-2 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-indigo-600">Price (cents)</label>
                <input
                  type="number" value={addingPrice} onChange={(e) => setAddingPrice(e.target.value)}
                  placeholder="0"
                  className="mt-1 w-24 rounded border border-indigo-300 px-2 py-1.5 text-sm font-mono focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <button
                onClick={handleAdd}
                disabled={!addingSlug.trim() || !addingName.trim()}
                className="rounded-lg bg-indigo-700 px-4 py-1.5 text-xs font-bold text-white hover:bg-indigo-800 disabled:opacity-50"
              >
                + Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
