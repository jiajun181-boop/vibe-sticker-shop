"use client";

import { useState } from "react";

export default function ProductForm({ product, onSubmit, onCancel }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const isEdit = !!product;

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.target);
    const result = await onSubmit(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-8">
        <h2 className="text-2xl font-black italic tracking-tighter mb-6">
          {isEdit ? "EDIT PRODUCT" : "NEW PRODUCT"}
        </h2>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm rounded-xl p-3 mb-4">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isEdit && <input type="hidden" name="id" value={product.id} />}

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Name *</label>
            <input
              name="name"
              defaultValue={product?.name || ""}
              required
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Slug *</label>
            <input
              name="slug"
              defaultValue={product?.slug || ""}
              required
              placeholder="e.g. die-cut-vinyl-stickers"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Category *</label>
              <select
                name="category"
                defaultValue={product?.category || "fleet-compliance-id"}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              >
                <option value="fleet-compliance-id">Fleet Compliance & ID</option>
                <option value="vehicle-branding-advertising">Vehicle Branding</option>
                <option value="safety-warning-decals">Safety & Warning</option>
                <option value="facility-asset-labels">Facility & Assets</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Type</label>
              <select
                name="type"
                defaultValue={product?.type || "sticker"}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              >
                <option value="sticker">Sticker</option>
                <option value="label">Label</option>
                <option value="sign">Sign</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Description</label>
            <textarea
              name="description"
              rows={3}
              defaultValue={product?.description || ""}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Base Price (USD) *</label>
              <input
                name="basePrice"
                type="number"
                step="0.01"
                min="0"
                defaultValue={product ? (product.basePrice / 100).toFixed(2) : ""}
                required
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Pricing Unit *</label>
              <select
                name="pricingUnit"
                defaultValue={product?.pricingUnit || "per_piece"}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              >
                <option value="per_piece">Per Piece</option>
                <option value="per_sqft">Per Sq Ft</option>
              </select>
            </div>
          </div>

          {!isEdit && (
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Image URL</label>
              <input
                name="imageUrl"
                type="url"
                placeholder="https://..."
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-black text-white font-bold py-2.5 rounded-xl hover:bg-gray-800 disabled:opacity-50 transition-colors text-sm"
            >
              {loading ? "Saving..." : isEdit ? "Update Product" : "Create Product"}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 border border-gray-200 font-bold py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
