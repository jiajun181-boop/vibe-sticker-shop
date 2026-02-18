"use client";

import { useEffect, useState } from "react";

export default function AdminInventoryPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lowStockOnly, setLowStockOnly] = useState(false);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const url = lowStockOnly ? "/api/admin/inventory?lowStock=1" : "/api/admin/inventory";
      const res = await fetch(url);
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

  const handleUpdate = async (productId, field, value) => {
    await fetch("/api/admin/inventory", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, [field]: value }),
    });
    fetchInventory();
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Inventory Management</h1>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={lowStockOnly}
            onChange={(e) => setLowStockOnly(e.target.checked)}
            className="rounded"
          />
          Low stock only
        </label>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
        </div>
      ) : products.length === 0 ? (
        <p className="text-gray-500">
          {lowStockOnly
            ? "No low-stock products."
            : "No products with inventory tracking enabled."}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Product</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Stock</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Reserved</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Available</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Threshold</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => {
                const available = product.stockQuantity - product.reservedQuantity;
                const isLow = available <= product.lowStockThreshold;
                return (
                  <tr key={product.id} className="border-t border-gray-100">
                    <td className="px-4 py-3">
                      <p className="font-medium">{product.name}</p>
                      <p className="text-xs text-gray-400">{product.slug}</p>
                    </td>
                    <td className="px-4 py-3 text-center">{product.stockQuantity}</td>
                    <td className="px-4 py-3 text-center">{product.reservedQuantity}</td>
                    <td className="px-4 py-3 text-center font-semibold">{available}</td>
                    <td className="px-4 py-3 text-center">{product.lowStockThreshold}</td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                          isLow
                            ? "bg-red-100 text-red-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {isLow ? "Low" : "OK"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => {
                          const qty = prompt("Set stock quantity:", String(product.stockQuantity));
                          if (qty !== null) handleUpdate(product.id, "stockQuantity", parseInt(qty));
                        }}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Update
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
