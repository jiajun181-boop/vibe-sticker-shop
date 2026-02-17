"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { SUB_PRODUCT_CONFIG } from "@/lib/subProductConfig";

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
const SUBSERIES_TAG_PREFIX = "subseries:";

const CATEGORY_TO_SUBSERIES = Object.entries(SUB_PRODUCT_CONFIG).reduce((acc, [slug, cfg]) => {
  if (!acc[cfg.category]) acc[cfg.category] = [];
  acc[cfg.category].push(slug);
  return acc;
}, {});

function titleizeSlug(value) {
  return String(value || "")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (ch) => ch.toUpperCase());
}

function getTaggedSubseries(tags) {
  if (!Array.isArray(tags)) return "";
  const tagged = tags.find((t) => typeof t === "string" && t.startsWith(SUBSERIES_TAG_PREFIX));
  return tagged ? tagged.slice(SUBSERIES_TAG_PREFIX.length) : "";
}

function stripSubseriesTags(tags) {
  if (!Array.isArray(tags)) return [];
  return tags.filter((t) => !(typeof t === "string" && t.startsWith(SUBSERIES_TAG_PREFIX)));
}

function resolveWorkflowState(tags, isActive) {
  if (Array.isArray(tags) && tags.includes("workflow:pending_review")) return "pending_review";
  if (Array.isArray(tags) && tags.includes("workflow:draft")) return "draft";
  if (Array.isArray(tags) && tags.includes("workflow:published")) return "published";
  return isActive ? "published" : "draft";
}

const formatCad = (cents) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(
    cents / 100
  );

/* ── Collapsible Section ────────────────────────────── */
function Section({ title, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-[3px] border border-[#e0e0e0] bg-white">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-5 py-4"
      >
        <h2 className="text-sm font-semibold text-black">{title}</h2>
        <svg
          className={`h-4 w-4 text-[#999] transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
      {open && <div className="border-t border-[#e0e0e0] px-5 pb-5 pt-4">{children}</div>}
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
            className="inline-flex items-center gap-1 rounded-[2px] bg-[#f5f5f5] px-2.5 py-1 text-xs font-medium text-black"
          >
            {tag}
            <button type="button" onClick={() => removeTag(tag)} className="text-[#999] hover:text-red-500">
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
          className="flex-1 rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-gray-900"
        />
        <button type="button" onClick={addTag} className="rounded-[3px] bg-[#f5f5f5] px-3 py-2 text-xs font-medium text-[#666] hover:bg-[#fafafa]">
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
  const [workflowState, setWorkflowState] = useState("draft");
  const [workflowLoading, setWorkflowLoading] = useState(false);

  // Form state
  const [form, setForm] = useState({});
  const [optionsJson, setOptionsJson] = useState("");
  const [optionsJsonError, setOptionsJsonError] = useState(null);
  const [imageUrl, setImageUrl] = useState("");
  const [imageAlt, setImageAlt] = useState("");
  const [addingImage, setAddingImage] = useState(false);
  const [uploadingAsset, setUploadingAsset] = useState(false);
  const assetFileRef = useRef(null);

  const fetchProduct = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/products/${productId}`);
      if (!res.ok) { router.push("/admin/products"); return; }
      const data = await res.json();
      setProduct(data);
      setWorkflowState(resolveWorkflowState(data.tags, data.isActive));
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
        subseries: getTaggedSubseries(data.tags),
        tags: stripSubseriesTags(data.tags),
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

  const subseriesOptions = (CATEGORY_TO_SUBSERIES[form.category] || []).slice().sort((a, b) => a.localeCompare(b));

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

    if (!form.subseries) {
      setSaving(false);
      showMsg("Subseries is required. Please choose one before saving.", true);
      return;
    }

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
      tags: [...stripSubseriesTags(form.tags), `${SUBSERIES_TAG_PREFIX}${form.subseries}`],
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

  async function handleSetPrimaryImage(imageId) {
    try {
      const res = await fetch(`/api/admin/products/${productId}/images`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ primaryImageId: imageId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        showMsg(data.error || "Failed to set cover image", true);
        return;
      }
      fetchProduct();
      showMsg("Cover image updated");
    } catch {
      showMsg("Failed to set cover image", true);
    }
  }

  async function handleWorkflow(action) {
    setWorkflowLoading(true);
    try {
      const res = await fetch(`/api/admin/products/${productId}/workflow`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showMsg(data.error || "Workflow action failed", true);
        return;
      }
      setWorkflowState(data.state || workflowState);
      fetchProduct();
      showMsg(`Workflow updated: ${data.state || action}`);
    } catch {
      showMsg("Workflow action failed", true);
    } finally {
      setWorkflowLoading(false);
    }
  }

  async function handleAssetUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAsset(true);
    try {
      // 1. Upload to asset system
      const formData = new FormData();
      formData.append("file", file);
      formData.append("altText", product.name);
      formData.append("tags", "product");

      const uploadRes = await fetch("/api/admin/assets", { method: "POST", body: formData });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) { showMsg(uploadData.error || "Upload failed", true); return; }

      const asset = uploadData.asset;

      // 2. Create asset link to this product
      await fetch(`/api/admin/assets/${asset.id}/links`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entityType: "product", entityId: productId, purpose: "gallery" }),
      });

      // 3. Also add as legacy ProductImage for backward compatibility
      await fetch(`/api/admin/products/${productId}/images`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: asset.originalUrl, alt: asset.altText }),
      });

      showMsg(uploadData.deduplicated ? "Existing asset linked (dedup)" : "Asset uploaded & linked!");
      fetchProduct();
    } catch { showMsg("Upload failed", true); }
    finally { setUploadingAsset(false); if (assetFileRef.current) assetFileRef.current.value = ""; }
  }

  if (loading) return <div className="flex h-48 items-center justify-center text-sm text-[#999]">Loading...</div>;
  if (!product) return null;

  const primaryImage = product.images?.[0];
  const checklist = {
    hasImage: Boolean(product.images?.length),
    hasPrice: Boolean(product.pricingPresetId) || Number(product.basePrice) > 0,
    hasDescription: String(form.description || "").trim().length >= 24,
    hasSeo: Boolean(String(form.metaTitle || "").trim() && String(form.metaDescription || "").trim()),
    hasSubseries: Boolean(form.subseries),
  };
  const checklistReady = Object.values(checklist).every(Boolean);

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center gap-3">
        <Link href="/admin/products" className="rounded-[3px] p-1.5 text-[#999] transition-colors hover:bg-[#fafafa] hover:text-[#666]">
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-semibold text-black">{product.name}</h1>
          <p className="font-mono text-xs text-[#999]">{product.slug}</p>
        </div>
        <span className={`rounded-[2px] px-3 py-1 text-xs font-medium ${product.isActive ? "bg-green-100 text-green-700" : "bg-[#f5f5f5] text-[#999]"}`}>
          {product.isActive ? "Active" : "Inactive"}
        </span>
        <span className="rounded-[2px] bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
          Workflow: {workflowState}
        </span>
      </div>

      {/* ── Toast ── */}
      {message && (
        <div className={`rounded-[3px] px-4 py-3 text-sm font-medium ${message.isError ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"}`}>
          {message.text}
        </div>
      )}

      {/* ══════════════════════════════════════════════ */}
      {/* ── HERO: Image + Price (ALWAYS AT TOP) ────── */}
      {/* ══════════════════════════════════════════════ */}
      <div className="rounded-[3px] border border-[#e0e0e0] bg-white p-5">
        <div className="flex flex-col sm:flex-row gap-5">
          {/* Primary Image */}
          <div className="relative flex-shrink-0 w-full sm:w-48 h-48 rounded-[3px] bg-[#f5f5f5] overflow-hidden">
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
              <div className="flex h-full w-full items-center justify-center text-xs text-[#999]">
                No image
              </div>
            )}
          </div>

          {/* Price & Key Info */}
          <div className="flex-1 space-y-3">
            <div>
              <p className="text-xs font-medium text-[#999]">Base Price</p>
              <p className="text-3xl font-bold text-black">{formatCad(product.basePrice)}</p>
              <p className="text-xs text-[#999]">{product.pricingUnit === "per_sqft" ? "per sq ft" : "per piece"}</p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="rounded-[2px] bg-blue-50 px-2.5 py-1 font-medium text-blue-700">{product.category}</span>
              {form.subseries ? (
                <span className="rounded-[2px] bg-indigo-50 px-2.5 py-1 font-medium text-indigo-700">
                  {titleizeSlug(form.subseries)}
                </span>
              ) : null}
              <span className="rounded-[2px] bg-[#f5f5f5] px-2.5 py-1 font-medium text-[#666]">{product.type}</span>
              {product.isFeatured && (
                <span className="rounded-[2px] bg-amber-50 px-2.5 py-1 font-medium text-amber-700">Featured</span>
              )}
            </div>
            <div className="flex gap-2 text-xs text-[#999]">
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
                <label className="mb-1 block text-xs font-medium text-[#999]">Name *</label>
                <input type="text" value={form.name || ""} onChange={(e) => updateField("name", e.target.value)} required className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-gray-900" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-[#999]">Slug *</label>
                <input type="text" value={form.slug || ""} onChange={(e) => updateField("slug", e.target.value)} required className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 font-mono text-sm outline-none focus:border-gray-900" />
              </div>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#999]">Category</label>
                  <select
                    value={form.category || ""}
                    onChange={(e) => {
                      const nextCategory = e.target.value;
                      const nextSubseriesOptions = (CATEGORY_TO_SUBSERIES[nextCategory] || []);
                      updateField("category", nextCategory);
                      if (!nextSubseriesOptions.includes(form.subseries)) {
                        updateField("subseries", nextSubseriesOptions[0] || "");
                      }
                    }}
                    className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-gray-900"
                  >
                    {categories.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#999]">Subseries *</label>
                  <select
                    value={form.subseries || ""}
                    onChange={(e) => updateField("subseries", e.target.value)}
                    className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-gray-900"
                  >
                    <option value="">Select subseries</option>
                    {subseriesOptions.map((slug) => (
                      <option key={slug} value={slug}>{titleizeSlug(slug)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#999]">Type</label>
                  <select value={form.type || "sticker"} onChange={(e) => updateField("type", e.target.value)} className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-gray-900">
                    {types.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#999]">Sort Order</label>
                  <input type="number" value={form.sortOrder ?? 0} onChange={(e) => updateField("sortOrder", e.target.value)} className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-gray-900" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-[#999]">Description</label>
                <textarea rows={3} value={form.description || ""} onChange={(e) => updateField("description", e.target.value)} className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-gray-900" />
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm text-black">
                  <input type="checkbox" checked={form.isFeatured || false} onChange={(e) => updateField("isFeatured", e.target.checked)} className="rounded border-[#d0d0d0]" />
                  Featured Product
                </label>
              </div>
            </div>
          </Section>

          {/* Pricing */}
          <Section title="Pricing">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-[#999]">Base Price (CAD) *</label>
                <input type="number" step="0.01" min="0" value={form.basePrice || ""} onChange={(e) => updateField("basePrice", e.target.value)} required className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-gray-900" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-[#999]">Pricing Unit</label>
                <select value={form.pricingUnit || "per_piece"} onChange={(e) => updateField("pricingUnit", e.target.value)} className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-gray-900">
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
                  <label className="mb-1 block text-xs font-medium text-[#999]">{label}</label>
                  <input type="number" step="0.1" value={form[field] ?? ""} onChange={(e) => updateField(field, e.target.value)} className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-gray-900" />
                </div>
              ))}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-[#999]">Min DPI</label>
                <input type="number" value={form.minDpi ?? ""} onChange={(e) => updateField("minDpi", e.target.value)} className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-gray-900" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-[#999]">Bleed (in)</label>
                <input type="number" step="0.01" value={form.bleedIn ?? ""} onChange={(e) => updateField("bleedIn", e.target.value)} className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-gray-900" />
              </div>
              <div className="flex items-end gap-2 pb-2">
                <label className="flex items-center gap-2 text-sm text-black">
                  <input type="checkbox" checked={form.requiresBleed || false} onChange={(e) => updateField("requiresBleed", e.target.checked)} className="rounded border-[#d0d0d0]" />
                  Requires Bleed
                </label>
              </div>
            </div>

            {/* Accepted Formats */}
            <div className="mt-4">
              <label className="mb-2 block text-xs font-medium text-[#999]">Accepted Formats</label>
              <div className="flex flex-wrap gap-2">
                {ALL_FORMATS.map((fmt) => (
                  <button
                    key={fmt}
                    type="button"
                    onClick={() => toggleFormat(fmt)}
                    className={`rounded-[3px] px-3 py-1.5 text-xs font-medium transition-colors ${
                      (form.acceptedFormats || []).includes(fmt)
                        ? "bg-black text-white"
                        : "bg-[#f5f5f5] text-[#999] hover:bg-[#fafafa]"
                    }`}
                  >
                    .{fmt}
                  </button>
                ))}
              </div>
            </div>

            {/* Template URL */}
            <div className="mt-4">
              <label className="mb-1 block text-xs font-medium text-[#999]">Template URL</label>
              <input type="url" value={form.templateUrl || ""} onChange={(e) => updateField("templateUrl", e.target.value)} placeholder="https://..." className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-gray-900" />
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
              className={`w-full rounded-[3px] border px-3 py-2 font-mono text-xs outline-none ${
                optionsJsonError ? "border-red-300 focus:border-red-500" : "border-[#d0d0d0] focus:border-gray-900"
              }`}
              placeholder='{ "sizes": [...], "materials": [...] }'
            />
            {optionsJsonError && <p className="mt-1 text-xs text-red-500">Invalid JSON: {optionsJsonError}</p>}
          </Section>

          {/* Tags & Keywords */}
          <Section title="Tags & Keywords" defaultOpen={false}>
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-xs font-medium text-[#999]">Tags</label>
                <p className="mb-2 text-[11px] text-[#999]">Subseries tag is managed in Basic Information.</p>
                <TagInput value={form.tags || []} onChange={(v) => updateField("tags", v)} placeholder="Add tag and press Enter" />
              </div>
              <div>
                <label className="mb-2 block text-xs font-medium text-[#999]">Keywords</label>
                <TagInput value={form.keywords || []} onChange={(v) => updateField("keywords", v)} placeholder="Add keyword and press Enter" />
              </div>
            </div>
          </Section>

          {/* SEO */}
          <Section title="SEO" defaultOpen={false}>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-[#999]">Meta Title</label>
                <input type="text" value={form.metaTitle || ""} onChange={(e) => updateField("metaTitle", e.target.value)} placeholder="Custom page title (optional)" className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-gray-900" />
                <p className="mt-1 text-[10px] text-[#999]">{(form.metaTitle || "").length}/60</p>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-[#999]">Meta Description</label>
                <textarea rows={2} value={form.metaDescription || ""} onChange={(e) => updateField("metaDescription", e.target.value)} placeholder="Custom page description (optional)" className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-gray-900" />
                <p className="mt-1 text-[10px] text-[#999]">{(form.metaDescription || "").length}/160</p>
              </div>
            </div>
          </Section>

          {/* Save button */}
          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="rounded-[3px] bg-black px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#222] disabled:opacity-50">
              {saving ? "Saving..." : "Save Changes"}
            </button>
            <button
              type="button"
              onClick={() => updateField("isActive", !form.isActive)}
              className={`rounded-[3px] border px-4 py-2.5 text-sm font-medium ${form.isActive ? "border-red-200 text-red-600 hover:bg-red-50" : "border-green-200 text-green-600 hover:bg-green-50"}`}
            >
              {form.isActive ? "Deactivate" : "Activate"}
            </button>
          </div>

          <div className="rounded-[3px] border border-[#e0e0e0] bg-[#fafafa] p-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#666] mb-2">Workflow</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={workflowLoading}
                onClick={() => handleWorkflow("save_draft")}
                className="rounded-[3px] border border-[#d0d0d0] px-3 py-1.5 text-xs font-medium text-black hover:bg-white disabled:opacity-50"
              >
                Save as Draft
              </button>
              <button
                type="button"
                disabled={workflowLoading}
                onClick={() => handleWorkflow("submit_review")}
                className="rounded-[3px] border border-[#d0d0d0] px-3 py-1.5 text-xs font-medium text-black hover:bg-white disabled:opacity-50"
              >
                Submit for Review
              </button>
              <button
                type="button"
                disabled={workflowLoading}
                onClick={() => handleWorkflow("publish")}
                className="rounded-[3px] bg-black px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#222] disabled:opacity-50"
              >
                Publish
              </button>
            </div>
          </div>
        </form>

        {/* ── Sidebar ── */}
        <div className="space-y-4">
          {/* Images */}
          <div className="rounded-[3px] border border-[#e0e0e0] bg-white p-5">
            <h2 className="mb-4 text-sm font-semibold text-black">
              Images ({product.images?.length || 0})
            </h2>

            {product.images && product.images.length > 0 ? (
              <div className="mb-4 grid grid-cols-2 gap-2">
                {product.images.map((img, idx) => (
                  <div key={img.id} className="group relative">
                    <img src={img.url} alt={img.alt || product.name} className="h-24 w-full rounded-[3px] object-cover" />
                    {idx === 0 && (
                      <span className="absolute left-1 top-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">Primary</span>
                    )}
                    {idx !== 0 && (
                      <button
                        type="button"
                        onClick={() => handleSetPrimaryImage(img.id)}
                        className="absolute left-1 bottom-1 hidden rounded bg-white/90 px-1.5 py-0.5 text-[10px] font-semibold text-black transition-colors hover:bg-white group-hover:block"
                      >
                        Set Cover
                      </button>
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
              <div className="mb-4 flex h-24 items-center justify-center rounded-[3px] border-2 border-dashed border-[#e0e0e0] text-xs text-[#999]">
                No images
              </div>
            )}

            {/* Upload Asset */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => assetFileRef.current?.click()}
                disabled={uploadingAsset}
                className="w-full rounded-[3px] bg-black py-2 text-xs font-semibold text-white hover:bg-[#222] disabled:opacity-50"
              >
                {uploadingAsset ? "Uploading..." : "Upload Image"}
              </button>
              <input ref={assetFileRef} type="file" accept="image/*" onChange={handleAssetUpload} className="hidden" />
            </div>

            {/* Legacy: Add by URL */}
            <details className="mt-3">
              <summary className="cursor-pointer text-[10px] text-[#999] hover:text-[#666]">Add by URL</summary>
              <div className="mt-2 space-y-2">
                <input type="url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="Image URL (https://...)" className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-gray-900" />
                <input type="text" value={imageAlt} onChange={(e) => setImageAlt(e.target.value)} placeholder="Alt text (optional)" className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-gray-900" />
                <button type="button" onClick={handleAddImage} disabled={!imageUrl.trim() || addingImage} className="w-full rounded-[3px] border border-[#d0d0d0] py-2 text-xs font-medium text-black hover:bg-[#fafafa] disabled:opacity-50">
                  {addingImage ? "Adding..." : "Add by URL"}
                </button>
              </div>
            </details>
          </div>

          {/* Quick Info */}
          <div className="rounded-[3px] border border-[#e0e0e0] bg-white p-5">
            <h2 className="mb-3 text-sm font-semibold text-black">Quick Info</h2>
            <dl className="space-y-2 text-xs">
              <div className="flex justify-between">
                <dt className="text-[#999]">ID</dt>
                <dd className="font-mono text-black truncate max-w-[120px]" title={product.id}>{product.id}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[#999]">Created</dt>
                <dd className="text-black">{new Date(product.createdAt).toLocaleDateString()}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[#999]">Updated</dt>
                <dd className="text-black">{new Date(product.updatedAt).toLocaleDateString()}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[#999]">Subseries</dt>
                <dd className="text-black">{form.subseries ? titleizeSlug(form.subseries) : "Missing"}</dd>
              </div>
              {product.pricingPresetId && (
                <div className="flex justify-between">
                  <dt className="text-[#999]">Pricing Preset</dt>
                  <dd className="font-mono text-black truncate max-w-[120px]">{product.pricingPresetId}</dd>
                </div>
              )}
            </dl>
          </div>

          <div className="rounded-[3px] border border-[#e0e0e0] bg-white p-5">
            <h2 className="mb-3 text-sm font-semibold text-black">Pre-Launch Checklist</h2>
            <div className="space-y-1.5 text-xs">
              <div className={checklist.hasImage ? "text-green-700" : "text-red-600"}>{checklist.hasImage ? "✓" : "✕"} Has image</div>
              <div className={checklist.hasPrice ? "text-green-700" : "text-red-600"}>{checklist.hasPrice ? "✓" : "✕"} Has price / preset</div>
              <div className={checklist.hasDescription ? "text-green-700" : "text-red-600"}>{checklist.hasDescription ? "✓" : "✕"} Description length OK</div>
              <div className={checklist.hasSeo ? "text-green-700" : "text-red-600"}>{checklist.hasSeo ? "✓" : "✕"} SEO title + description</div>
              <div className={checklist.hasSubseries ? "text-green-700" : "text-red-600"}>{checklist.hasSubseries ? "✓" : "✕"} Subseries assigned</div>
            </div>
            <div className={`mt-3 rounded-[3px] px-2.5 py-2 text-xs font-semibold ${checklistReady ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>
              {checklistReady ? "Ready to publish" : "Not ready to publish"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
