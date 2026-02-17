"use client";

import { useMemo, useState } from "react";
import { SUB_PRODUCT_CONFIG } from "@/lib/subProductConfig";

const CATEGORY_ORDER = [
  "marketing-prints",
  "retail-promo",
  "packaging",
  "banners-displays",
  "display-stands",
  "rigid-signs",
  "large-format-graphics",
  "vehicle-branding-advertising",
  "window-glass-films",
  "stickers-labels",
  "safety-warning-decals",
  "facility-asset-labels",
  "fleet-compliance-id",
];

const CATEGORY_LABELS = {
  "marketing-prints": "Marketing Prints",
  "retail-promo": "Retail Promo",
  packaging: "Packaging",
  "banners-displays": "Banners Displays",
  "display-stands": "Display Stands",
  "rigid-signs": "Rigid Signs",
  "large-format-graphics": "Large Format Graphics",
  "vehicle-branding-advertising": "Vehicle Branding Advertising",
  "window-glass-films": "Window Glass Films",
  "stickers-labels": "Stickers Labels",
  "safety-warning-decals": "Safety Warning Decals",
  "facility-asset-labels": "Facility Asset Labels",
  "fleet-compliance-id": "Fleet Compliance Id",
};

const CATEGORY_TO_SUBSERIES = Object.entries(SUB_PRODUCT_CONFIG).reduce((acc, [slug, cfg]) => {
  if (!acc[cfg.category]) acc[cfg.category] = [];
  acc[cfg.category].push(slug);
  return acc;
}, {});

function titleize(value) {
  return String(value || "")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (ch) => ch.toUpperCase());
}

export default function ProductForm({ product, onSubmit, onCancel }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const isEdit = !!product;
  const [category, setCategory] = useState(product?.category || "marketing-prints");
  const [subseries, setSubseries] = useState("");

  const subseriesOptions = useMemo(() => {
    const arr = CATEGORY_TO_SUBSERIES[category] || [];
    return [...arr].sort((a, b) => a.localeCompare(b));
  }, [category]);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.target);
    if (!formData.get("subseries")) {
      setError("Please choose a subseries.");
      setLoading(false);
      return;
    }

    const result = await onSubmit(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-8 shadow-xl">
        <h2 className="mb-6 text-2xl font-black tracking-tight">{isEdit ? "Edit Product" : "New Product"}</h2>

        {error && <div className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isEdit && <input type="hidden" name="id" value={product.id} />}

          <div>
            <label className="mb-1 block text-xs font-bold uppercase text-gray-600">Name *</label>
            <input
              name="name"
              defaultValue={product?.name || ""}
              required
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold uppercase text-gray-600">Slug *</label>
            <input
              name="slug"
              defaultValue={product?.slug || ""}
              required
              placeholder="e.g. die-cut-vinyl-stickers"
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-gray-600">Category *</label>
              <select
                name="category"
                value={category}
                onChange={(e) => {
                  const next = e.target.value;
                  setCategory(next);
                  setSubseries("");
                }}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              >
                {CATEGORY_ORDER.map((slug) => (
                  <option key={slug} value={slug}>
                    {CATEGORY_LABELS[slug] || titleize(slug)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-gray-600">Subseries *</label>
              <select
                name="subseries"
                value={subseries}
                onChange={(e) => setSubseries(e.target.value)}
                required
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              >
                <option value="">Select subseries</option>
                {subseriesOptions.map((slug) => (
                  <option key={slug} value={slug}>
                    {titleize(slug)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-gray-600">Type</label>
              <select
                name="type"
                defaultValue={product?.type || "sticker"}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              >
                <option value="sticker">Sticker</option>
                <option value="label">Label</option>
                <option value="sign">Sign</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-gray-600">Pricing Unit *</label>
              <select
                name="pricingUnit"
                defaultValue={product?.pricingUnit || "per_piece"}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              >
                <option value="per_piece">Per Piece</option>
                <option value="per_sqft">Per Sq Ft</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold uppercase text-gray-600">Description</label>
            <textarea
              name="description"
              rows={3}
              defaultValue={product?.description || ""}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold uppercase text-gray-600">Base Price (CAD) *</label>
            <input
              name="basePrice"
              type="number"
              step="0.01"
              min="0"
              defaultValue={product ? (product.basePrice / 100).toFixed(2) : ""}
              required
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          {!isEdit && (
            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-gray-600">Image URL</label>
              <input
                name="imageUrl"
                type="url"
                placeholder="https://..."
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-xl bg-black py-2.5 text-sm font-bold text-white transition-colors hover:bg-gray-800 disabled:opacity-50"
            >
              {loading ? "Saving..." : isEdit ? "Update Product" : "Create Product"}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-bold transition-colors hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
