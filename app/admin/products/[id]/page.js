"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

const categories = [
  { value: "fleet-compliance-id", label: "Fleet Compliance & ID" },
  { value: "vehicle-branding-advertising", label: "Vehicle Branding" },
  { value: "safety-warning-decals", label: "Safety & Warning" },
  { value: "facility-asset-labels", label: "Facility & Assets" },
  { value: "display-stands", label: "Display Stands" },
  { value: "marketing-prints", label: "Marketing Prints" },
  { value: "stickers-labels", label: "Stickers & Labels" },
  { value: "rigid-signs", label: "Rigid Signs" },
  { value: "banners-displays", label: "Banners & Displays" },
  { value: "large-format-graphics", label: "Large Format Graphics" },
  { value: "retail-promo", label: "Retail Promo" },
  { value: "packaging", label: "Packaging" },
  { value: "business-forms", label: "Business Forms" },
];

const types = [
  { value: "sticker", label: "Sticker" },
  { value: "label", label: "Label" },
  { value: "sign", label: "Sign" },
  { value: "other", label: "Other" },
];

const pricingUnits = [
  { value: "per_piece", label: "Per Piece" },
  { value: "per_sqft", label: "Per Sq Ft" },
];

const ALL_FORMATS = ["ai", "pdf", "eps", "tiff", "jpg", "png", "svg"];

const formatCad = (cents) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(
    cents / 100
  );

/* ── Collapsible Section ────────────────────────────── */
function Section({ title, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-5 py-4"
      >
        <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
        <svg
          className={`h-4 w-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
      {open && <div className="border-t border-gray-100 px-5 pb-5 pt-4">{children}</div>}
    </div>
  );
}

/* ── Tag/Chip Input ─────────────────────────────────── */
function TagInput({ value = [], onChange, placeholder }) {
  const [input, setInput] = useState("");

  function addTag() {
    const tag = input.trim();
    if (tag && !value.includes(tag)) {
      onChange([...value, tag]);
    }
    setInput("");
  }

  function removeTag(tag) {
    onChange(value.filter((t) => t !== tag));
  }

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700"
          >
            {tag}
            <button type="button" onClick={() => removeTag(tag)} className="text-gray-400 hover:text-red-500">
              ×
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") { e.preventDefault(); addTag(); }
          }}
          placeholder={placeholder}
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900"
        />
        <button type="button" onClick={addTag} className="rounded-lg bg-gray-100 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-200">
          Add
        </button>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════ */
export default function ProductDetailPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id;

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  // Form state
  const [form, setForm] = useState({});
  const [optionsJson, setOptionsJson] = useState("");
  const [optionsJsonError, setOptionsJsonError] = useState(null);
  const [imageUrl, setImageUrl] = useState("");
  const [imageAlt, setImageAlt] = useState("");
  const [addingImage, setAddingImage] = useState(false);

  const fetchProduct = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/products/${productId}`);
      if (!res.ok) { router.push("/admin/products"); return; }
      const data = await res.json();
      setProduct(data);
      setForm({
        name: data.name,
        slug: data.slug,
        category: data.category,
        type: data.type,
        description: data.description || "",
        basePrice: (data.basePrice / 100).toFixed(2),
        pricingUnit: data.pricingUnit,
        isActive: data.isActive,
        isFeatured: data.isFeatured || false,
        sortOrder: data.sortOrder ?? 0,
        minWidthIn: data.minWidthIn ?? "",
        minHeightIn: data.minHeightIn ?? "",
        maxWidthIn: data.maxWidthIn ?? "",
        maxHeightIn: data.maxHeightIn ?? "",
        minDpi: data.minDpi ?? "",
        requiresBleed: data.requiresBleed,
        bleedIn: data.bleedIn ?? "",
        acceptedFormats: data.acceptedFormats || [],
        tags: data.tags || [],
        keywords: data.keywords || [],
        metaTitle: data.metaTitle || "",
        metaDescription: data.metaDescription || "",
        templateUrl: data.templateUrl || "",
      });
      setOptionsJson(data.optionsConfig ? JSON.stringify(data.optionsConfig, null, 2) : "");
      setOptionsJsonError(null);
    } catch {
      router.push("/admin/products");
    } finally {
      setLoading(false);
    }
  }, [productId, router]);

  useEffect(() => { fetchProduct(); }, [fetchProduct]);

  function showMsg(text, isError = false) {
    setMessage({ text, isError });
    setTimeout(() => setMessage(null), 4000);
  }

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function toggleFormat(fmt) {
    setForm((prev) => {
      const current = prev.acceptedFormats || [];
      return {
        ...prev,
        acceptedFormats: current.includes(fmt)
          ? current.filter((f) => f !== fmt)
          : [...current, fmt],
      };
    });
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);

    let parsedOptions = undefined;
    if (optionsJson.trim()) {
      try {
        parsedOptions = JSON.parse(optionsJson);
        setOptionsJsonError(null);
      } catch (err) {
        setOptionsJsonError(err.message);
        setSaving(false);
        showMsg("Invalid JSON in Options Config", true);
        return;
      }
    }

    const payload = {
      name: form.name,
      slug: form.slug,
      category: form.category,
      type: form.type,
      description: form.description || null,
      basePrice: Math.round(parseFloat(form.basePrice) * 100),
      pricingUnit: form.pricingUnit,
      isActive: form.isActive,
      isFeatured: form.isFeatured,
      sortOrder: parseInt(form.sortOrder) || 0,
      minWidthIn: form.minWidthIn ? parseFloat(form.minWidthIn) : null,
      minHeightIn: form.minHeightIn ? parseFloat(form.minHeightIn) : null,
      maxWidthIn: form.maxWidthIn ? parseFloat(form.maxWidthIn) : null,
      maxHeightIn: form.maxHeightIn ? parseFloat(form.maxHeightIn) : null,
      minDpi: form.minDpi ? parseInt(form.minDpi) : null,
      requiresBleed: form.requiresBleed,
      bleedIn: form.bleedIn ? parseFloat(form.bleedIn) : null,
      acceptedFormats: form.acceptedFormats.length > 0 ? form.acceptedFormats : null,
      tags: form.tags,
      keywords: form.keywords,
      metaTitle: form.metaTitle || null,
      metaDescription: form.metaDescription || null,
      templateUrl: form.templateUrl || null,
    };
    if (parsedOptions !== undefined) payload.optionsConfig = parsedOptions;

    try {
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json();
        showMsg(data.error || "Failed to save", true);
      } else {
        const data = await res.json();
        setProduct(data);
        showMsg("Product saved!");
      }
    } catch {
      showMsg("Network error", true);
    } finally {
      setSaving(false);
    }
  }

  async function handleAddImage() {
    if (!imageUrl.trim()) return;
    setAddingImage(true);
    try {
      const res = await fetch(`/api/admin/products/${productId}/images`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: imageUrl.trim(), alt: imageAlt.trim() || null }),
      });
      if (res.ok) {
        setImageUrl("");
        setImageAlt("");
        fetchProduct();
        showMsg("Image added!");
      } else {
        const data = await res.json();
        showMsg(data.error || "Failed to add image", true);
      }
    } catch { showMsg("Network error", true); }
    finally { setAddingImage(false); }
  }

  async function handleDeleteImage(imageId) {
    if (!confirm("Delete this image?")) return;
    try {
      const res = await fetch(`/api/admin/products/${productId}/images?imageId=${imageId}`, { method: "DELETE" });
      if (res.ok) { fetchProduct(); showMsg("Image deleted"); }
    } catch { showMsg("Failed to delete image", true); }
  }

  if (loading) return <div className="flex h-48 items-center justify-center text-sm text-gray-500">Loading...</div>;
  if (!product) return null;

  const primaryImage = product.images?.[0];

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center gap-3">
        <Link href="/admin/products" className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600">
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-semibold text-gray-900">{product.name}</h1>
          <p className="font-mono text-xs text-gray-400">{product.slug}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-medium ${product.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"}`}>
          {product.isActive ? "Active" : "Inactive"}
        </span>
      </div>

      {/* ── Toast ── */}
      {message && (
        <div className={`rounded-lg px-4 py-3 text-sm font-medium ${message.isError ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"}`}>
          {message.text}
        </div>
      )}

      {/* ══════════════════════════════════════════════ */}
      {/* ── HERO: Image + Price (ALWAYS AT TOP) ────── */}
      {/* ══════════════════════════════════════════════ */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex flex-col sm:flex-row gap-5">
          {/* Primary Image */}
          <div className="relative flex-shrink-0 w-full sm:w-48 h-48 rounded-xl bg-gray-100 overflow-hidden">
            {primaryImage?.url ? (
              <Image
                src={primaryImage.url}
                alt={primaryImage.alt || product.name}
                fill
                className="object-cover"
                sizes="192px"
                unoptimized={primaryImage.url.endsWith(".svg")}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
                No image
              </div>
            )}
          </div>

          {/* Price & Key Info */}
          <div className="flex-1 space-y-3">
            <div>
              <p className="text-xs font-medium text-gray-500">Base Price</p>
              <p className="text-3xl font-bold text-gray-900">{formatCad(product.basePrice)}</p>
              <p className="text-xs text-gray-400">{product.pricingUnit === "per_sqft" ? "per sq ft" : "per piece"}</p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-blue-50 px-2.5 py-1 font-medium text-blue-700">{product.category}</span>
              <span className="rounded-full bg-gray-100 px-2.5 py-1 font-medium text-gray-600">{product.type}</span>
              {product.isFeatured && (
                <span className="rounded-full bg-amber-50 px-2.5 py-1 font-medium text-amber-700">Featured</span>
              )}
            </div>
            <div className="flex gap-2 text-xs text-gray-500">
              <span>{product.images?.length || 0} images</span>
              <span>·</span>
              <span>Sort: {product.sortOrder}</span>
              <span>·</span>
              <span>Updated {new Date(product.updatedAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════ */}
      {/* ── FORM GRID ──────────────────────────────── */}
      {/* ══════════════════════════════════════════════ */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* ── Main form (2 cols) ── */}
        <form onSubmit={handleSave} className="space-y-4 lg:col-span-2">
          {/* Basic Info */}
          <Section title="Basic Information">
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">Name *</label>
                <input type="text" value={form.name || ""} onChange={(e) => updateField("name", e.target.value)} required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">Slug *</label>
                <input type="text" value={form.slug || ""} onChange={(e) => updateField("slug", e.target.value)} required className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm outline-none focus:border-gray-900" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500">Category</label>
                  <select value={form.category || ""} onChange={(e) => updateField("category", e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900">
                    {categories.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500">Type</label>
                  <select value={form.type || "sticker"} onChange={(e) => updateField("type", e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900">
                    {types.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500">Sort Order</label>
                  <input type="number" value={form.sortOrder ?? 0} onChange={(e) => updateField("sortOrder", e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">Description</label>
                <textarea rows={3} value={form.description || ""} onChange={(e) => updateField("description", e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900" />
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" checked={form.isFeatured || false} onChange={(e) => updateField("isFeatured", e.target.checked)} className="rounded border-gray-300" />
                  Featured Product
                </label>
              </div>
            </div>
          </Section>

          {/* Pricing */}
          <Section title="Pricing">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">Base Price (CAD) *</label>
                <input type="number" step="0.01" min="0" value={form.basePrice || ""} onChange={(e) => updateField("basePrice", e.target.value)} required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">Pricing Unit</label>
                <select value={form.pricingUnit || "per_piece"} onChange={(e) => updateField("pricingUnit", e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900">
                  {pricingUnits.map((u) => <option key={u.value} value={u.value}>{u.label}</option>)}
                </select>
              </div>
            </div>
          </Section>

          {/* Print Specs */}
          <Section title="Print Specifications">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                ["minWidthIn", "Min Width (in)"],
                ["minHeightIn", "Min Height (in)"],
                ["maxWidthIn", "Max Width (in)"],
                ["maxHeightIn", "Max Height (in)"],
              ].map(([field, label]) => (
                <div key={field}>
                  <label className="mb-1 block text-xs font-medium text-gray-500">{label}</label>
                  <input type="number" step="0.1" value={form[field] ?? ""} onChange={(e) => updateField(field, e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900" />
                </div>
              ))}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">Min DPI</label>
                <input type="number" value={form.minDpi ?? ""} onChange={(e) => updateField("minDpi", e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">Bleed (in)</label>
                <input type="number" step="0.01" value={form.bleedIn ?? ""} onChange={(e) => updateField("bleedIn", e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900" />
              </div>
              <div className="flex items-end gap-2 pb-2">
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" checked={form.requiresBleed || false} onChange={(e) => updateField("requiresBleed", e.target.checked)} className="rounded border-gray-300" />
                  Requires Bleed
                </label>
              </div>
            </div>

            {/* Accepted Formats */}
            <div className="mt-4">
              <label className="mb-2 block text-xs font-medium text-gray-500">Accepted Formats</label>
              <div className="flex flex-wrap gap-2">
                {ALL_FORMATS.map((fmt) => (
                  <button
                    key={fmt}
                    type="button"
                    onClick={() => toggleFormat(fmt)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                      (form.acceptedFormats || []).includes(fmt)
                        ? "bg-gray-900 text-white"
                        : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                    }`}
                  >
                    .{fmt}
                  </button>
                ))}
              </div>
            </div>

            {/* Template URL */}
            <div className="mt-4">
              <label className="mb-1 block text-xs font-medium text-gray-500">Template URL</label>
              <input type="url" value={form.templateUrl || ""} onChange={(e) => updateField("templateUrl", e.target.value)} placeholder="https://..." className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900" />
            </div>
          </Section>

          {/* Options Config (JSON) */}
          <Section title="Options Config (JSON)" defaultOpen={false}>
            <textarea
              rows={12}
              value={optionsJson}
              onChange={(e) => {
                setOptionsJson(e.target.value);
                try { JSON.parse(e.target.value); setOptionsJsonError(null); } catch (err) { setOptionsJsonError(err.message); }
              }}
              spellCheck={false}
              className={`w-full rounded-lg border px-3 py-2 font-mono text-xs outline-none ${
                optionsJsonError ? "border-red-300 focus:border-red-500" : "border-gray-300 focus:border-gray-900"
              }`}
              placeholder='{ "sizes": [...], "materials": [...] }'
            />
            {optionsJsonError && <p className="mt-1 text-xs text-red-500">Invalid JSON: {optionsJsonError}</p>}
          </Section>

          {/* Tags & Keywords */}
          <Section title="Tags & Keywords" defaultOpen={false}>
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-xs font-medium text-gray-500">Tags</label>
                <TagInput value={form.tags || []} onChange={(v) => updateField("tags", v)} placeholder="Add tag and press Enter" />
              </div>
              <div>
                <label className="mb-2 block text-xs font-medium text-gray-500">Keywords</label>
                <TagInput value={form.keywords || []} onChange={(v) => updateField("keywords", v)} placeholder="Add keyword and press Enter" />
              </div>
            </div>
          </Section>

          {/* SEO */}
          <Section title="SEO" defaultOpen={false}>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">Meta Title</label>
                <input type="text" value={form.metaTitle || ""} onChange={(e) => updateField("metaTitle", e.target.value)} placeholder="Custom page title (optional)" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900" />
                <p className="mt-1 text-[10px] text-gray-400">{(form.metaTitle || "").length}/60</p>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">Meta Description</label>
                <textarea rows={2} value={form.metaDescription || ""} onChange={(e) => updateField("metaDescription", e.target.value)} placeholder="Custom page description (optional)" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900" />
                <p className="mt-1 text-[10px] text-gray-400">{(form.metaDescription || "").length}/160</p>
              </div>
            </div>
          </Section>

          {/* Save button */}
          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="rounded-lg bg-gray-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-black disabled:opacity-50">
              {saving ? "Saving..." : "Save Changes"}
            </button>
            <button
              type="button"
              onClick={() => updateField("isActive", !form.isActive)}
              className={`rounded-lg border px-4 py-2.5 text-sm font-medium ${form.isActive ? "border-red-200 text-red-600 hover:bg-red-50" : "border-green-200 text-green-600 hover:bg-green-50"}`}
            >
              {form.isActive ? "Deactivate" : "Activate"}
            </button>
          </div>
        </form>

        {/* ── Sidebar ── */}
        <div className="space-y-4">
          {/* Images */}
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="mb-4 text-sm font-semibold text-gray-900">
              Images ({product.images?.length || 0})
            </h2>

            {product.images && product.images.length > 0 ? (
              <div className="mb-4 grid grid-cols-2 gap-2">
                {product.images.map((img, idx) => (
                  <div key={img.id} className="group relative">
                    <img src={img.url} alt={img.alt || product.name} className="h-24 w-full rounded-lg object-cover" />
                    {idx === 0 && (
                      <span className="absolute left-1 top-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">Primary</span>
                    )}
                    <button type="button" onClick={() => handleDeleteImage(img.id)} className="absolute right-1 top-1 hidden rounded bg-red-500/80 p-0.5 text-white transition-colors hover:bg-red-600 group-hover:block">
                      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mb-4 flex h-24 items-center justify-center rounded-lg border-2 border-dashed border-gray-200 text-xs text-gray-400">
                No images
              </div>
            )}

            <div className="space-y-2">
              <input type="url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="Image URL (https://...)" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900" />
              <input type="text" value={imageAlt} onChange={(e) => setImageAlt(e.target.value)} placeholder="Alt text (optional)" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900" />
              <button type="button" onClick={handleAddImage} disabled={!imageUrl.trim() || addingImage} className="w-full rounded-lg bg-gray-900 py-2 text-xs font-semibold text-white hover:bg-black disabled:opacity-50">
                {addingImage ? "Adding..." : "Add Image"}
              </button>
            </div>
          </div>

          {/* Quick Info */}
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="mb-3 text-sm font-semibold text-gray-900">Quick Info</h2>
            <dl className="space-y-2 text-xs">
              <div className="flex justify-between">
                <dt className="text-gray-500">ID</dt>
                <dd className="font-mono text-gray-900 truncate max-w-[120px]" title={product.id}>{product.id}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Created</dt>
                <dd className="text-gray-900">{new Date(product.createdAt).toLocaleDateString()}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Updated</dt>
                <dd className="text-gray-900">{new Date(product.updatedAt).toLocaleDateString()}</dd>
              </div>
              {product.pricingPresetId && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Pricing Preset</dt>
                  <dd className="font-mono text-gray-900 truncate max-w-[120px]">{product.pricingPresetId}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
