"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";

export default function AdminInventoryPage() {
  const { t } = useTranslation();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editField, setEditField] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (lowStockOnly) params.set("lowStock", "1");
      const res = await fetch(`/api/admin/inventory?${params}`);
      const data = await res.json();
      setProducts(data.products || []);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [lowStockOnly]);

  const startEdit = (productId, field, currentValue) => {
    setEditingId(productId);
    setEditField(field);
    setEditValue(String(currentValue));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditField(null);
    setEditValue("");
  };

  const saveEdit = async (productId) => {
    const val = parseInt(editValue);
    if (isNaN(val) || val < 0) return;
    setSaving(true);
    try {
      await fetch("/api/admin/inventory", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, [editField]: val }),
      });
      cancelEdit();
      fetchInventory();
    } catch {
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e, productId) => {
    if (e.key === "Enter") saveEdit(productId);
    if (e.key === "Escape") cancelEdit();
  };

  // Client-side name search
  const filtered = search
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.slug.toLowerCase().includes(search.toLowerCase())
      )
    : products;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-lg font-semibold">{t("admin.inventory.title")}</h1>
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-[3px] border border-[#d0d0d0] px-3 py-1.5 text-xs outline-none focus:border-black w-48"
          />
          <label className="flex items-center gap-2 text-xs font-medium text-gray-600">
            <input
              type="checkbox"
              checked={lowStockOnly}
              onChange={(e) => setLowStockOnly(e.target.checked)}
              className="rounded"
            />
            {t("admin.inventory.lowStockOnly")}
          </label>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-[3px] bg-gray-100" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-[3px] border border-[#e0e0e0] bg-white p-8 text-center text-sm text-gray-500">
          {search
            ? `No products matching "${search}"`
            : lowStockOnly
            ? t("admin.inventory.noLowStock")
            : t("admin.inventory.noTracking")}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-[3px] border border-[#e0e0e0] bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                <th className="px-4 py-3">{t("admin.inventory.product")}</th>
                <th className="px-4 py-3 text-center">{t("admin.inventory.stock")}</th>
                <th className="px-4 py-3 text-center">{t("admin.inventory.reserved")}</th>
                <th className="px-4 py-3 text-center">{t("admin.inventory.available")}</th>
                <th className="px-4 py-3 text-center">{t("admin.inventory.threshold")}</th>
                <th className="px-4 py-3 text-center">{t("admin.inventory.status")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((product) => {
                const available = product.stockQuantity - product.reservedQuantity;
                const isLow = available <= product.lowStockThreshold;
                const isEditingStock =
                  editingId === product.id && editField === "stockQuantity";
                const isEditingThreshold =
                  editingId === product.id && editField === "lowStockThreshold";

                return (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{product.name}</p>
                      <p className="text-[10px] text-gray-400">{product.slug}</p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {isEditingStock ? (
                        <div className="flex items-center justify-center gap-1">
                          <input
                            type="number"
                            min="0"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, product.id)}
                            autoFocus
                            className="w-20 rounded-[3px] border border-black px-2 py-1 text-center text-xs outline-none"
                          />
                          <button
                            onClick={() => saveEdit(product.id)}
                            disabled={saving}
                            className="rounded-[3px] bg-black px-2 py-1 text-[10px] font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
                          >
                            {saving ? "..." : "OK"}
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="px-1 py-1 text-[10px] text-gray-400 hover:text-gray-700"
                          >
                            ESC
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() =>
                            startEdit(product.id, "stockQuantity", product.stockQuantity)
                          }
                          className="inline-block min-w-[40px] rounded-[3px] border border-transparent px-2 py-0.5 font-medium tabular-nums hover:border-gray-300 hover:bg-gray-50"
                          title="Click to edit stock"
                        >
                          {product.stockQuantity}
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center tabular-nums text-gray-500">
                      {product.reservedQuantity}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`font-semibold tabular-nums ${
                          isLow ? "text-red-600" : "text-gray-900"
                        }`}
                      >
                        {available}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {isEditingThreshold ? (
                        <div className="flex items-center justify-center gap-1">
                          <input
                            type="number"
                            min="0"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, product.id)}
                            autoFocus
                            className="w-20 rounded-[3px] border border-black px-2 py-1 text-center text-xs outline-none"
                          />
                          <button
                            onClick={() => saveEdit(product.id)}
                            disabled={saving}
                            className="rounded-[3px] bg-black px-2 py-1 text-[10px] font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
                          >
                            {saving ? "..." : "OK"}
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="px-1 py-1 text-[10px] text-gray-400 hover:text-gray-700"
                          >
                            ESC
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() =>
                            startEdit(
                              product.id,
                              "lowStockThreshold",
                              product.lowStockThreshold
                            )
                          }
                          className="inline-block min-w-[40px] rounded-[3px] border border-transparent px-2 py-0.5 tabular-nums text-gray-500 hover:border-gray-300 hover:bg-gray-50"
                          title="Click to edit threshold"
                        >
                          {product.lowStockThreshold}
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                          isLow
                            ? "bg-red-100 text-red-700"
                            : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {isLow ? t("admin.inventory.low") : t("admin.inventory.ok")}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Summary */}
      {!loading && filtered.length > 0 && (
        <div className="flex gap-4 text-[10px] font-medium text-gray-400">
          <span>{filtered.length} tracked product{filtered.length !== 1 && "s"}</span>
          <span>{filtered.filter((p) => p.stockQuantity - p.reservedQuantity <= p.lowStockThreshold).length} low stock</span>
        </div>
      )}
    </div>
  );
}
