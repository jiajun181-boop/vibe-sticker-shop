"use client";

import { useState, useTransition } from "react";
import ProductForm from "./product-form";
import { createProduct, updateProduct, toggleProductStatus, deleteProduct } from "./actions";

export default function ProductTable({ products }) {
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [message, setMessage] = useState(null);
  const [isPending, startTransition] = useTransition();

  function showMessage(text, isError = false) {
    setMessage({ text, isError });
    setTimeout(() => setMessage(null), 3000);
  }

  async function handleCreate(formData) {
    const result = await createProduct(formData);
    if (result?.error) return result;
    setShowForm(false);
    showMessage("Product created!");
    return result;
  }

  async function handleUpdate(formData) {
    const result = await updateProduct(formData);
    if (result?.error) return result;
    setEditingProduct(null);
    showMessage("Product updated!");
    return result;
  }

  function handleToggle(id, currentlyActive) {
    startTransition(async () => {
      const result = await toggleProductStatus(id);
      if (result?.error) showMessage(result.error, true);
      else showMessage(currentlyActive ? "Product deactivated" : "Product activated");
    });
  }

  function handleDelete(product) {
    if (!confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    startTransition(async () => {
      const result = await deleteProduct(product.id);
      if (result?.error) showMessage(result.error, true);
      else showMessage("Product deleted");
    });
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <h1 className="text-4xl font-black italic tracking-tighter">PRODUCTS</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-black text-white font-bold px-6 py-2.5 rounded-xl hover:bg-gray-800 transition-colors text-sm"
        >
          + Add Product
        </button>
      </div>

      {/* Toast message */}
      {message && (
        <div className={`mb-6 px-4 py-3 rounded-xl text-sm font-medium ${
          message.isError ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"
        }`}>
          {message.text}
        </div>
      )}

      {/* Table / Cards */}
      {products.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-gray-200 rounded-3xl p-20 text-center text-gray-600">
          No products yet. Click &quot;+ Add Product&quot; to create one.
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs font-bold text-gray-600 uppercase px-6 py-4">Image</th>
                  <th className="text-left text-xs font-bold text-gray-600 uppercase px-6 py-4">Name</th>
                  <th className="text-left text-xs font-bold text-gray-600 uppercase px-6 py-4 hidden lg:table-cell">Category</th>
                  <th className="text-left text-xs font-bold text-gray-600 uppercase px-6 py-4">Price</th>
                  <th className="text-left text-xs font-bold text-gray-600 uppercase px-6 py-4">Status</th>
                  <th className="text-right text-xs font-bold text-gray-600 uppercase px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const imgUrl = product.images?.[0]?.url;
                  return (
                    <tr key={product.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                      <td className="px-6 py-4">
                        {imgUrl ? (
                          <img src={imgUrl} alt={product.name} className="w-12 h-12 rounded-xl object-cover" />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600 text-lg">?</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-sm">{product.name}</span>
                        <span className="block text-xs text-gray-600 font-mono">{product.slug}</span>
                      </td>
                      <td className="px-6 py-4 hidden lg:table-cell">
                        <span className="text-xs text-gray-600">{product.category}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono font-bold text-sm">
                          ${(product.basePrice / 100).toFixed(2)}
                          <span className="text-gray-600 font-normal text-xs ml-1">
                            {product.pricingUnit === "per_sqft" ? "/sqft" : "/pc"}
                          </span>
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleToggle(product.id, product.isActive)}
                          disabled={isPending}
                          className={`text-xs font-bold px-3 py-1 rounded-full transition-colors ${
                            product.isActive
                              ? "bg-green-100 text-green-700 hover:bg-green-200"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          {product.isActive ? "Active" : "Inactive"}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => setEditingProduct(product)}
                            className="text-xs font-bold px-3 py-1.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(product)}
                            disabled={isPending}
                            className="text-xs font-bold px-3 py-1.5 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
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
          <div className="md:hidden space-y-4">
            {products.map((product) => {
              const imgUrl = product.images?.[0]?.url;
              return (
                <div key={product.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                  <div className="flex gap-4 mb-3">
                    {imgUrl ? (
                      <img src={imgUrl} alt={product.name} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600 text-xl flex-shrink-0">?</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm">{product.name}</p>
                      <p className="font-mono font-bold text-sm mt-0.5">
                        ${(product.basePrice / 100).toFixed(2)}
                        <span className="text-gray-600 font-normal text-xs ml-1">
                          {product.pricingUnit === "per_sqft" ? "/sqft" : "/pc"}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggle(product.id, product.isActive)}
                      disabled={isPending}
                      className={`text-xs font-bold px-3 py-1 rounded-full ${
                        product.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {product.isActive ? "Active" : "Inactive"}
                    </button>
                    <div className="flex-1" />
                    <button
                      onClick={() => setEditingProduct(product)}
                      className="text-xs font-bold px-3 py-1.5 rounded-xl border border-gray-200"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(product)}
                      disabled={isPending}
                      className="text-xs font-bold px-3 py-1.5 rounded-xl border border-red-200 text-red-500"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Modals */}
      {showForm && (
        <ProductForm onSubmit={handleCreate} onCancel={() => setShowForm(false)} />
      )}
      {editingProduct && (
        <ProductForm product={editingProduct} onSubmit={handleUpdate} onCancel={() => setEditingProduct(null)} />
      )}
    </div>
  );
}
