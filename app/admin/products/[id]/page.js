"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { SUB_PRODUCT_CONFIG } from "@/lib/subProductConfig";
import { resizeImageFile } from "@/lib/client-image-resize";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { formatCad } from "@/lib/admin/format-cad";

const TextOverlayModal = dynamic(() => import("@/components/admin/TextOverlayModal"), { ssr: false });
const CropModal = dynamic(() => import("@/components/admin/CropModal"), { ssr: false });

const categories = [
  { value: "marketing-business-print", label: "Marketing & Business Print" },
  { value: "stickers-labels-decals", label: "Stickers, Labels & Decals" },
  { value: "signs-rigid-boards", label: "Signs & Display Boards" },
  { value: "banners-displays", label: "Banners & Displays" },
  { value: "canvas-prints", label: "Canvas Prints" },
  { value: "windows-walls-floors", label: "Windows, Walls & Floors" },
  { value: "vehicle-graphics-fleet", label: "Vehicle Graphics & Fleet" },
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
  const { t } = useTranslation();
  const router = useRouter();
  const params = useParams();
  const productId = params.id;

  const [product, setProduct] = useState(null);
  const [presets, setPresets] = useState([]);
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
  const [uploadQueue, setUploadQueue] = useState([]); // [{id, name, status}]
  const [dragIdx, setDragIdx] = useState(null); // drag-to-reorder
  const [dropIdx, setDropIdx] = useState(null);
  const assetFileRef = useRef(null);
  const replaceFileRef = useRef(null);
  const [replacingImageId, setReplacingImageId] = useState(null);
  const [bgRemovingId, setBgRemovingId] = useState(null);
  const [compressingId, setCompressingId] = useState(null);
  const [textOverlayImg, setTextOverlayImg] = useState(null); // {id, url}
  const [cropImg, setCropImg] = useState(null); // {id, url}

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
        pricingPresetId: data.pricingPresetId || "",
        displayFromPrice: data.displayFromPrice ? (data.displayFromPrice / 100).toFixed(2) : "",
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

  // Fetch available pricing presets
  useEffect(() => {
    fetch("/api/admin/pricing")
      .then((r) => r.ok ? r.json() : [])
      .then((data) => setPresets(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  // ── Clipboard paste (Ctrl+V) — auto-upload pasted images ──
  useEffect(() => {
    if (!product) return;
    function handlePaste(e) {
      // Don't intercept paste in text inputs
      const tag = e.target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      const items = e.clipboardData?.items;
      if (!items) return;
      const imageFiles = [];
      for (const item of items) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) {
            const ext = file.type.split("/")[1] || "png";
            imageFiles.push(new File([file], `pasted-image-${Date.now()}.${ext}`, { type: file.type }));
          }
        }
      }
      if (imageFiles.length > 0) {
        e.preventDefault();
        processFileUploads(imageFiles);
      }
    }
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [product]);

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
      showMsg(t("admin.productEdit.subseriesRequired"), true);
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
        showMsg(t("admin.productEdit.invalidJson"), true);
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
      pricingPresetId: form.pricingPresetId || null,
      displayFromPrice: form.displayFromPrice ? Math.round(parseFloat(form.displayFromPrice) * 100) : null,
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
        showMsg(data.error || t("admin.productEdit.saveFailed"), true);
      } else {
        const data = await res.json();
        setProduct(data);
        showMsg(t("admin.productEdit.saved"));
      }
    } catch {
      showMsg(t("admin.productEdit.networkError"), true);
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
        showMsg(t("admin.productEdit.imageAdded"));
      } else {
        const data = await res.json();
        showMsg(data.error || t("admin.productEdit.imageAddFailed"), true);
      }
    } catch { showMsg(t("admin.productEdit.networkError"), true); }
    finally { setAddingImage(false); }
  }

  async function handleDeleteImage(imageId) {
    if (!confirm(t("admin.productEdit.deleteImageConfirm"))) return;
    try {
      const res = await fetch(`/api/admin/products/${productId}/images?imageId=${imageId}`, { method: "DELETE" });
      if (res.ok) {
        fetchProduct();
        showMsg(t("admin.productEdit.imageDeleted"));
        return;
      }
      let errorMsg = t("admin.productEdit.imageDeleteFailed");
      try {
        const data = await res.json();
        if (data?.error) errorMsg = data.error;
      } catch {}
      showMsg(errorMsg, true);
    } catch {
      showMsg(t("admin.productEdit.imageDeleteFailed"), true);
    }
  }

  function triggerReplaceImage(imageId) {
    setReplacingImageId(imageId);
    if (replaceFileRef.current) replaceFileRef.current.value = "";
    replaceFileRef.current?.click();
  }

  async function handleReplaceFile(e) {
    const file = e.target.files?.[0];
    if (!file || !replacingImageId) return;
    const imageId = replacingImageId;
    setReplacingImageId(null);

    // Find the old image's sort position
    const oldIdx = (product.images || []).findIndex((img) => img.id === imageId);
    const sortPos = oldIdx >= 0 ? oldIdx : 0;

    setUploadingAsset(true);
    setUploadQueue([{ id: "replace", name: file.name, status: "uploading" }]);
    try {
      // 1. Upload new image (appended at end)
      await uploadSingleAsset(file);

      // 2. Delete old image
      await fetch(`/api/admin/products/${productId}/images?imageId=${imageId}`, { method: "DELETE" });

      // 3. Fetch fresh image list directly (not via state)
      const res = await fetch(`/api/admin/products/${productId}`);
      const data = await res.json();
      const freshImages = data.images || [];

      // 4. Reorder so the new image (last) moves to the old position
      if (freshImages.length >= 2) {
        const imgs = [...freshImages];
        const newImg = imgs.pop();
        imgs.splice(sortPos, 0, newImg);
        const order = imgs.map((img, i) => ({ id: img.id, sortOrder: i }));
        await fetch(`/api/admin/products/${productId}/images`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order }),
        });
      }

      // 5. Final refresh
      fetchProduct();

      setUploadQueue([{ id: "replace", name: file.name, status: "done" }]);
      showMsg(t("admin.productEdit.imageReplaced"));
      setTimeout(() => setUploadQueue([]), 2000);
    } catch {
      setUploadQueue([{ id: "replace", name: file.name, status: "error" }]);
      showMsg(t("admin.productEdit.imageReplaceFailed"), true);
      fetchProduct();
    } finally {
      setUploadingAsset(false);
    }
  }

  async function handleRemoveBg(imageId, imageUrl) {
    if (bgRemovingId) return;
    setBgRemovingId(imageId);
    try {
      const { removeBackground } = await import("@imgly/background-removal");
      const blob = await removeBackground(imageUrl, { output: { format: "image/png" } });
      const file = new File([blob], `${product?.name || "image"}-nobg.png`, { type: "image/png" });

      // Upload as new asset
      const formData = new FormData();
      formData.append("file", file);
      formData.append("altText", `${product?.name || "Product"} (no background)`);
      formData.append("tags", "product,background-removed");
      const uploadRes = await fetch("/api/admin/assets", { method: "POST", body: formData });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData.error || "Upload failed");

      const asset = uploadData.asset;
      await fetch(`/api/admin/assets/${asset.id}/links`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entityType: "product", entityId: productId, purpose: "gallery" }),
      });
      await fetch(`/api/admin/products/${productId}/images`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: asset.originalUrl, alt: `${product?.name || "Product"} (no background)` }),
      });

      // Delete original and put new image in its place
      const oldIdx = (product.images || []).findIndex((img) => img.id === imageId);
      const sortPos = oldIdx >= 0 ? oldIdx : 0;
      await fetch(`/api/admin/products/${productId}/images?imageId=${imageId}`, { method: "DELETE" });

      const res = await fetch(`/api/admin/products/${productId}`);
      const data = await res.json();
      const freshImages = data.images || [];
      if (freshImages.length >= 2) {
        const imgs = [...freshImages];
        const newImg = imgs.pop();
        imgs.splice(sortPos, 0, newImg);
        const order = imgs.map((img, i) => ({ id: img.id, sortOrder: i }));
        await fetch(`/api/admin/products/${productId}/images`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order }),
        });
      }

      fetchProduct();
      showMsg(t("admin.productEdit.bgRemoved"));
    } catch (err) {
      console.error("Background removal failed:", err);
      showMsg(t("admin.productEdit.bgRemoveFailed"), true);
    } finally {
      setBgRemovingId(null);
    }
  }

  async function handleCompressImage(imageId, imageUrl) {
    if (compressingId) return;
    setCompressingId(imageId);
    try {
      // 1. Fetch the image
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = () => {
          // Retry without crossOrigin
          const img2 = new window.Image();
          img2.onload = () => { Object.assign(img, { naturalWidth: img2.naturalWidth, naturalHeight: img2.naturalHeight, _el: img2 }); resolve(); };
          img2.onerror = reject;
          img2.src = imageUrl;
        };
        img.src = imageUrl;
      });

      const srcEl = img._el || img;
      const { naturalWidth: w, naturalHeight: h } = srcEl;

      // 2. Determine target size — cap to 1600px, quality 0.80 WebP
      const maxDim = 1600;
      const quality = 0.80;
      const ratio = Math.min(maxDim / w, maxDim / h, 1);
      const newW = Math.round(w * ratio);
      const newH = Math.round(h * ratio);

      const canvas = document.createElement("canvas");
      canvas.width = newW;
      canvas.height = newH;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(srcEl, 0, 0, newW, newH);

      const blob = await new Promise((resolve) =>
        canvas.toBlob((b) => resolve(b), "image/webp", quality)
      );
      if (!blob) throw new Error("Canvas toBlob failed");

      const file = new File([blob], `compressed-${Date.now()}.webp`, { type: "image/webp" });

      // 3. Upload compressed version
      const oldIdx = (product.images || []).findIndex((im) => im.id === imageId);
      const sortPos = oldIdx >= 0 ? oldIdx : 0;

      await uploadSingleAsset(file);

      // 4. Delete old image
      await fetch(`/api/admin/products/${productId}/images?imageId=${imageId}`, { method: "DELETE" });

      // 5. Reorder so compressed image takes the old position
      const res = await fetch(`/api/admin/products/${productId}`);
      const data = await res.json();
      const freshImages = data.images || [];
      if (freshImages.length >= 2) {
        const imgs = [...freshImages];
        const newImg = imgs.pop();
        imgs.splice(sortPos, 0, newImg);
        const order = imgs.map((im, i) => ({ id: im.id, sortOrder: i }));
        await fetch(`/api/admin/products/${productId}/images`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order }),
        });
      }

      fetchProduct();
      const savedPct = blob.size < 1024 ? `${blob.size}B` : `${Math.round(blob.size / 1024)}KB`;
      showMsg(`Compressed to ${newW}×${newH} (${savedPct})`);
    } catch (err) {
      console.error("Compress failed:", err);
      showMsg(t("admin.productEdit.compressFailed"), true);
    } finally {
      setCompressingId(null);
    }
  }

  async function handleTextOverlaySave(file, replaceImageId) {
    try {
      // Upload the new image
      await uploadSingleAsset(file);

      if (replaceImageId) {
        // Find the old image's sort position
        const oldIdx = (product.images || []).findIndex((img) => img.id === replaceImageId);
        const sortPos = oldIdx >= 0 ? oldIdx : 0;

        // Delete old image
        await fetch(`/api/admin/products/${productId}/images?imageId=${replaceImageId}`, { method: "DELETE" });

        // Fetch fresh image list and reorder
        const res = await fetch(`/api/admin/products/${productId}`);
        const data = await res.json();
        const freshImages = data.images || [];
        if (freshImages.length >= 2) {
          const imgs = [...freshImages];
          const newImg = imgs.pop();
          imgs.splice(sortPos, 0, newImg);
          const order = imgs.map((img, i) => ({ id: img.id, sortOrder: i }));
          await fetch(`/api/admin/products/${productId}/images`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ order }),
          });
        }
      }

      fetchProduct();
      showMsg(replaceImageId ? t("admin.productEdit.textOverlayReplaced") : t("admin.productEdit.textOverlayAdded"));
    } catch {
      showMsg(t("admin.productEdit.textOverlayFailed"), true);
      fetchProduct();
    }
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
        showMsg(data.error || t("admin.productEdit.coverFailed"), true);
        return;
      }
      fetchProduct();
      showMsg(t("admin.productEdit.coverUpdated"));
    } catch {
      showMsg(t("admin.productEdit.coverFailed"), true);
    }
  }

  async function handleReorderImages(fromIndex, toIndex) {
    if (fromIndex === toIndex) return;
    const imgs = [...(product.images || [])];
    const [moved] = imgs.splice(fromIndex, 1);
    imgs.splice(toIndex, 0, moved);
    // Optimistic update
    setProduct((prev) => ({ ...prev, images: imgs }));
    try {
      const order = imgs.map((img, i) => ({ id: img.id, sortOrder: i }));
      const res = await fetch(`/api/admin/products/${productId}/images`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order }),
      });
      if (!res.ok) {
        fetchProduct(); // revert on failure
        showMsg(t("admin.productEdit.reorderFailed"), true);
      }
    } catch {
      fetchProduct();
      showMsg(t("admin.productEdit.reorderFailed"), true);
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
        showMsg(data.error || t("admin.productEdit.workflowFailed"), true);
        return;
      }
      setWorkflowState(data.state || workflowState);
      fetchProduct();
      showMsg(`${t("admin.productEdit.workflowUpdated")}: ${data.state || action}`);
    } catch {
      showMsg(t("admin.productEdit.workflowFailed"), true);
    } finally {
      setWorkflowLoading(false);
    }
  }

  function filenameToAlt(fileName) {
    return String(fileName || "")
      .replace(/\.[^.]+$/, "")
      .replace(/[-_]+/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase())
      .trim();
  }

  async function uploadSingleAsset(rawFile) {
    const file = await resizeImageFile(rawFile);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("altText", product?.name || filenameToAlt(file.name));
    formData.append("tags", "product");

    const uploadRes = await fetch("/api/admin/assets", { method: "POST", body: formData });
    const uploadData = await uploadRes.json();
    if (!uploadRes.ok) throw new Error(uploadData.error || "Upload failed");

    const asset = uploadData.asset;

    await fetch(`/api/admin/assets/${asset.id}/links`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entityType: "product", entityId: productId, purpose: "gallery" }),
    });

    await fetch(`/api/admin/products/${productId}/images`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: asset.originalUrl, alt: asset.altText }),
    });

    return uploadData.deduplicated;
  }

  async function handleAssetUpload(e) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    if (assetFileRef.current) assetFileRef.current.value = "";
    await processFileUploads(files);
  }

  async function handleImageDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove("ring-2", "ring-black");
    const types = Array.from(e.dataTransfer?.types || []);
    if (!types.includes("Files")) return;
    const files = Array.from(e.dataTransfer.files || []).filter((f) => f.type.startsWith("image/"));
    if (files.length === 0) return;
    await processFileUploads(files);
  }

  async function processFileUploads(files) {
    setUploadingAsset(true);
    let queueId = 0;
    const queue = files.map((f) => ({ id: `q_${++queueId}`, name: f.name, status: "pending" }));
    setUploadQueue(queue);

    let done = 0;
    let failed = 0;

    for (let i = 0; i < files.length; i++) {
      setUploadQueue((prev) => prev.map((q, idx) => idx === i ? { ...q, status: "uploading" } : q));
      try {
        await uploadSingleAsset(files[i]);
        setUploadQueue((prev) => prev.map((q, idx) => idx === i ? { ...q, status: "done" } : q));
        done++;
      } catch {
        setUploadQueue((prev) => prev.map((q, idx) => idx === i ? { ...q, status: "error" } : q));
        failed++;
      }
    }

    setUploadingAsset(false);
    fetchProduct();
    if (failed === 0) {
      showMsg(t("admin.productEdit.imagesUploaded", { count: done }));
      setTimeout(() => setUploadQueue([]), 2000);
    } else {
      showMsg(t("admin.productEdit.uploadPartialFail", { done, failed }), true);
    }
  }

  if (loading) return <div className="flex h-48 items-center justify-center text-sm text-[#999]">{t("admin.common.loading")}</div>;
  if (!product) return null;

  const primaryImage = product.images?.[0];
  const imageSourceMeta = product.imageSourceMeta || null;
  const imageSourceLabel =
    imageSourceMeta?.resolvedSource === "asset"
      ? t("admin.productEdit.imageSourceAsset")
      : imageSourceMeta?.resolvedSource === "legacy"
        ? t("admin.productEdit.imageSourceLegacy")
        : t("admin.productEdit.imageSourceNone");
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
          {product.isActive ? t("admin.common.active") : t("admin.common.inactive")}
        </span>
        <span className="rounded-[2px] bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
          {t("admin.productEdit.workflow")}: {workflowState}
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
                {t("admin.productEdit.noImage")}
              </div>
            )}
          </div>

          {/* Price & Key Info */}
          <div className="flex-1 space-y-3">
            <div>
              <p className="text-xs font-medium text-[#999]">{t("admin.productEdit.basePrice")}</p>
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
                <span className="rounded-[2px] bg-amber-50 px-2.5 py-1 font-medium text-amber-700">{t("admin.productEdit.featured")}</span>
              )}
            </div>
            <div className="flex gap-2 text-xs text-[#999]">
              <span>{product.images?.length || 0} {t("admin.productEdit.images")}</span>
              <span>·</span>
              <span>{t("admin.productEdit.sort")}: {product.sortOrder}</span>
              <span>·</span>
              <span>{t("admin.productEdit.updated")} {new Date(product.updatedAt).toLocaleDateString()}</span>
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
          <Section title={t("admin.productEdit.basicInfo")}>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-[#999]">{t("admin.productEdit.name")}</label>
                <input type="text" value={form.name || ""} onChange={(e) => updateField("name", e.target.value)} required className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-gray-900" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-[#999]">{t("admin.productEdit.slug")}</label>
                <input type="text" value={form.slug || ""} onChange={(e) => updateField("slug", e.target.value)} required className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 font-mono text-sm outline-none focus:border-gray-900" />
              </div>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#999]">{t("admin.productEdit.category")}</label>
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
                  <label className="mb-1 block text-xs font-medium text-[#999]">{t("admin.productEdit.subseries")}</label>
                  <select
                    value={form.subseries || ""}
                    onChange={(e) => updateField("subseries", e.target.value)}
                    className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-gray-900"
                  >
                    <option value="">{t("admin.productEdit.selectSubseries")}</option>
                    {subseriesOptions.map((slug) => (
                      <option key={slug} value={slug}>{titleizeSlug(slug)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#999]">{t("admin.productEdit.type")}</label>
                  <select value={form.type || "sticker"} onChange={(e) => updateField("type", e.target.value)} className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-gray-900">
                    {types.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#999]">{t("admin.productEdit.sortOrder")}</label>
                  <input type="number" value={form.sortOrder ?? 0} onChange={(e) => updateField("sortOrder", e.target.value)} className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-gray-900" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-[#999]">{t("admin.productEdit.description")}</label>
                <textarea rows={3} value={form.description || ""} onChange={(e) => updateField("description", e.target.value)} className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-gray-900" />
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm text-black">
                  <input type="checkbox" checked={form.isFeatured || false} onChange={(e) => updateField("isFeatured", e.target.checked)} className="rounded border-[#d0d0d0]" />
                  {t("admin.productEdit.featuredProduct")}
                </label>
              </div>
            </div>
          </Section>

          {/* Pricing */}
          <Section title={t("admin.productEdit.pricing")}>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-[#999]">{t("admin.productEdit.basePriceCad")}</label>
                <input type="number" step="0.01" min="0" value={form.basePrice || ""} onChange={(e) => updateField("basePrice", e.target.value)} required className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-gray-900" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-[#999]">{t("admin.productEdit.pricingUnit")}</label>
                <select value={form.pricingUnit || "per_piece"} onChange={(e) => updateField("pricingUnit", e.target.value)} className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-gray-900">
                  {pricingUnits.map((u) => <option key={u.value} value={u.value}>{u.label}</option>)}
                </select>
              </div>
            </div>

            {/* Pricing Preset */}
            <div className="mt-3">
              <label className="mb-1 block text-xs font-medium text-[#999]">{t("admin.productEdit.pricingPreset")}</label>
              <select
                value={form.pricingPresetId || ""}
                onChange={(e) => updateField("pricingPresetId", e.target.value)}
                className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-gray-900"
              >
                <option value="">{t("admin.productEdit.presetNone")}</option>
                {presets.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.model}) — {p._count?.products ?? 0} products
                  </option>
                ))}
              </select>
              <p className="mt-0.5 text-[10px] text-[#999]">{t("admin.productEdit.presetHint")}</p>
            </div>

            {/* Display From Price override */}
            <div className="mt-3">
              <label className="mb-1 block text-xs font-medium text-[#999]">{t("admin.productEdit.displayFromPrice")}</label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder={t("admin.productEdit.autoComputed")}
                value={form.displayFromPrice ?? ""}
                onChange={(e) => updateField("displayFromPrice", e.target.value)}
                className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-gray-900"
              />
              <p className="mt-0.5 text-[10px] text-[#999]">{t("admin.productEdit.displayFromPriceHint")}</p>
              {product?.minPrice > 0 && (
                <p className="mt-0.5 text-[10px] text-[#666]">{t("admin.productEdit.autoComputedMin")}: {formatCad(product.minPrice)}</p>
              )}
            </div>
          </Section>

          {/* Pricing Preview (read-only) */}
          {product.pricingPreset && (
            <Section title={t("admin.productEdit.pricingPreview")} defaultOpen={false}>
              <p className="mb-3 text-[11px] text-[#999]">
                {t("admin.productEdit.readonlyBreakdown")} <span className="font-semibold text-[#666]">{product.pricingPreset.name}</span> ({product.pricingPreset.model}).
              </p>

              {/* Tier table */}
              {(() => {
                const cfg = product.pricingPreset.config || {};
                const tiers = cfg.tiers || [];
                const model = product.pricingPreset.model;

                if (tiers.length === 0) return <p className="text-xs text-[#999]">{t("admin.productEdit.noTiers")}</p>;

                if (model === "AREA_TIERED") {
                  return (
                    <div className="mb-4">
                      <h3 className="mb-1.5 text-xs font-semibold text-black">{t("admin.productEdit.areaTiers")}</h3>
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-[#e0e0e0] text-left text-[#999]">
                            <th className="pb-1.5 font-medium">{t("admin.productEdit.area")}</th>
                            <th className="pb-1.5 font-medium text-right">{t("admin.productEdit.rateSqft")}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {tiers.map((t, i) => (
                            <tr key={i} className="border-b border-[#f0f0f0]">
                              <td className="py-1.5 text-black">
                                {t.label || (t.maxSqft ? `Up to ${t.maxSqft} sqft` : `${t.minSqft ?? 0}+ sqft`)}
                              </td>
                              <td className="py-1.5 text-right font-mono text-black">
                                {formatCad(t.rate ?? t.pricePerSqft ?? 0)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                }

                // QTY_TIERED or QTY_OPTIONS
                return (
                  <div className="mb-4">
                    <h3 className="mb-1.5 text-xs font-semibold text-black">{t("admin.productEdit.qtyTiers")}</h3>
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-[#e0e0e0] text-left text-[#999]">
                          <th className="pb-1.5 font-medium">{t("admin.productEdit.qty")}</th>
                          <th className="pb-1.5 font-medium text-right">{t("admin.productEdit.unitPrice")}</th>
                          <th className="pb-1.5 font-medium text-right">{t("admin.productEdit.total")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tiers.map((t, i) => {
                          const qty = t.minQty ?? t.qty ?? 0;
                          const unit = t.unitPrice ?? t.price ?? 0;
                          return (
                            <tr key={i} className="border-b border-[#f0f0f0]">
                              <td className="py-1.5 text-black">{qty}+</td>
                              <td className="py-1.5 text-right font-mono text-black">{formatCad(unit)}</td>
                              <td className="py-1.5 text-right font-mono text-[#666]">{formatCad(unit * qty)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                );
              })()}

              {/* Materials table — merge from optionsConfig and preset */}
              {(() => {
                const cfg = product.pricingPreset.config || {};
                let optCfg = {};
                try { optCfg = product.optionsConfig || {}; } catch { /* noop */ }
                const materials = optCfg.materials || cfg.materials || [];
                if (materials.length === 0) return null;

                return (
                  <div className="mb-4">
                    <h3 className="mb-1.5 text-xs font-semibold text-black">{t("admin.productEdit.materials")}</h3>
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-[#e0e0e0] text-left text-[#999]">
                          <th className="pb-1.5 font-medium">{t("admin.productEdit.material")}</th>
                          <th className="pb-1.5 font-medium text-right">{t("admin.productEdit.multiplier")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {materials.map((m, i) => (
                          <tr key={i} className="border-b border-[#f0f0f0]">
                            <td className="py-1.5 text-black">{m.label || m.name || m.key}</td>
                            <td className="py-1.5 text-right font-mono text-black">{(m.multiplier ?? 1).toFixed(2)}x</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })()}

              {/* Addons table */}
              {(() => {
                let optCfg = {};
                try { optCfg = product.optionsConfig || {}; } catch { /* noop */ }
                const addons = optCfg.addons || product.pricingPreset.config?.addons || [];
                if (addons.length === 0) return null;

                return (
                  <div className="mb-4">
                    <h3 className="mb-1.5 text-xs font-semibold text-black">{t("admin.productEdit.addons")}</h3>
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-[#e0e0e0] text-left text-[#999]">
                          <th className="pb-1.5 font-medium">{t("admin.productEdit.addon")}</th>
                          <th className="pb-1.5 font-medium text-right">{t("admin.productEdit.price")}</th>
                          <th className="pb-1.5 font-medium text-right">{t("admin.productEdit.type")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {addons.map((a, i) => (
                          <tr key={i} className="border-b border-[#f0f0f0]">
                            <td className="py-1.5 text-black">{a.label || a.name || a.key}</td>
                            <td className="py-1.5 text-right font-mono text-black">
                              {a.price === 0 || a.included ? t("admin.productEdit.included") : formatCad(a.price ?? 0)}
                            </td>
                            <td className="py-1.5 text-right text-[#999]">
                              {a.included ? "—" : a.type || "flat"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })()}

              {/* Meta info */}
              {(() => {
                const cfg = product.pricingPreset.config || {};
                const hasMeta = cfg.minimumPrice || cfg.fileFee || cfg.setupFee;
                if (!hasMeta) return null;

                return (
                  <div className="flex flex-wrap gap-3 text-xs">
                    {cfg.minimumPrice != null && (
                      <span className="rounded-[2px] bg-[#f5f5f5] px-2.5 py-1 text-[#666]">
                        {t("admin.productEdit.minOrder")}: {formatCad(cfg.minimumPrice)}
                      </span>
                    )}
                    {cfg.fileFee != null && (
                      <span className="rounded-[2px] bg-[#f5f5f5] px-2.5 py-1 text-[#666]">
                        {t("admin.productEdit.fileFee")}: {formatCad(cfg.fileFee)}
                      </span>
                    )}
                    {cfg.setupFee != null && (
                      <span className="rounded-[2px] bg-[#f5f5f5] px-2.5 py-1 text-[#666]">
                        {t("admin.productEdit.setupFee")}: {formatCad(cfg.setupFee)}
                      </span>
                    )}
                  </div>
                );
              })()}
            </Section>
          )}

          {/* Print Specs */}
          <Section title={t("admin.productEdit.printSpecs")}>
            <p className="mb-3 text-[11px] text-[#999]">{t("admin.productEdit.printSpecsHint")}</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                ["minWidthIn", t("admin.productEdit.minWidth")],
                ["minHeightIn", t("admin.productEdit.minHeight")],
                ["maxWidthIn", t("admin.productEdit.maxWidth")],
                ["maxHeightIn", t("admin.productEdit.maxHeight")],
              ].map(([field, label]) => (
                <div key={field}>
                  <label className="mb-1 block text-xs font-medium text-[#999]">{label}</label>
                  <input type="number" step="0.1" value={form[field] ?? ""} onChange={(e) => updateField(field, e.target.value)} className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-gray-900" />
                </div>
              ))}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-[#999]">{t("admin.productEdit.minDpi")}</label>
                <input type="number" value={form.minDpi ?? ""} onChange={(e) => updateField("minDpi", e.target.value)} className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-gray-900" />
                <p className="mt-0.5 text-[10px] text-[#999]">{t("admin.productEdit.minDpiHint")}</p>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-[#999]">{t("admin.productEdit.bleed")}</label>
                <input type="number" step="0.01" value={form.bleedIn ?? ""} onChange={(e) => updateField("bleedIn", e.target.value)} className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-gray-900" />
                <p className="mt-0.5 text-[10px] text-[#999]">{t("admin.productEdit.bleedHint")}</p>
              </div>
              <div className="flex items-end gap-2 pb-2">
                <label className="flex items-center gap-2 text-sm text-black">
                  <input type="checkbox" checked={form.requiresBleed || false} onChange={(e) => updateField("requiresBleed", e.target.checked)} className="rounded border-[#d0d0d0]" />
                  {t("admin.productEdit.requiresBleed")}
                </label>
              </div>
            </div>

            {/* Accepted Formats */}
            <div className="mt-4">
              <label className="mb-1 block text-xs font-medium text-[#999]">{t("admin.productEdit.acceptedFormats")}</label>
              <p className="mb-2 text-[10px] text-[#999]">{t("admin.productEdit.acceptedFormatsHint")}</p>
              <div className="flex flex-wrap gap-2">
                {ALL_FORMATS.map((fmt) => (
                  <button
                    key={fmt}
                    type="button"
                    onClick={() => toggleFormat(fmt)}
                    className={`rounded-[3px] px-3 py-1.5 text-xs font-medium transition-colors ${
                      (form.acceptedFormats || []).includes(fmt)
                        ? "bg-black text-[#fff]"
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
              <label className="mb-1 block text-xs font-medium text-[#999]">{t("admin.productEdit.templateUrl")}</label>
              <input type="url" value={form.templateUrl || ""} onChange={(e) => updateField("templateUrl", e.target.value)} placeholder="https://..." className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-gray-900" />
            </div>
          </Section>

          {/* Options Config (JSON) */}
          <Section title={t("admin.productEdit.optionsConfig")} defaultOpen={false}>
            <p className="mb-2 text-[11px] text-[#999]">{t("admin.productEdit.optionsConfigHint")}</p>
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
            {optionsJsonError && <p className="mt-1 text-xs text-red-500">{t("admin.productEdit.invalidJsonLabel")}: {optionsJsonError}</p>}
          </Section>

          {/* Tags & Keywords */}
          <Section title={t("admin.productEdit.tagsKeywords")} defaultOpen={false}>
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-xs font-medium text-[#999]">{t("admin.productEdit.tags")}</label>
                <p className="mb-2 text-[11px] text-[#999]">{t("admin.productEdit.tagsHint")}</p>
                <TagInput value={form.tags || []} onChange={(v) => updateField("tags", v)} placeholder={t("admin.productEdit.addTagPlaceholder")} />
              </div>
              <div>
                <label className="mb-2 block text-xs font-medium text-[#999]">{t("admin.productEdit.keywords")}</label>
                <TagInput value={form.keywords || []} onChange={(v) => updateField("keywords", v)} placeholder={t("admin.productEdit.addKeywordPlaceholder")} />
              </div>
            </div>
          </Section>

          {/* SEO */}
          <Section title={t("admin.productEdit.seo")} defaultOpen={false}>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-[#999]">{t("admin.productEdit.metaTitle")}</label>
                <input type="text" value={form.metaTitle || ""} onChange={(e) => updateField("metaTitle", e.target.value)} placeholder={t("admin.productEdit.metaTitlePlaceholder")} className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-gray-900" />
                <p className="mt-1 text-[10px] text-[#999]">{(form.metaTitle || "").length}/60</p>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-[#999]">{t("admin.productEdit.metaDescription")}</label>
                <textarea rows={2} value={form.metaDescription || ""} onChange={(e) => updateField("metaDescription", e.target.value)} placeholder={t("admin.productEdit.metaDescPlaceholder")} className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-gray-900" />
                <p className="mt-1 text-[10px] text-[#999]">{(form.metaDescription || "").length}/160</p>
              </div>
            </div>
          </Section>

          {/* Save button */}
          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="rounded-[3px] bg-black px-6 py-2.5 text-sm font-semibold text-[#fff] hover:bg-[#222] disabled:opacity-50">
              {saving ? t("admin.common.saving") : t("admin.productEdit.saveChanges")}
            </button>
            <button
              type="button"
              onClick={() => updateField("isActive", !form.isActive)}
              className={`rounded-[3px] border px-4 py-2.5 text-sm font-medium ${form.isActive ? "border-red-200 text-red-600 hover:bg-red-50" : "border-green-200 text-green-600 hover:bg-green-50"}`}
            >
              {form.isActive ? t("admin.productEdit.deactivate") : t("admin.productEdit.activate")}
            </button>
          </div>

          <div className="rounded-[3px] border border-[#e0e0e0] bg-[#fafafa] p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#666] mb-2">{t("admin.productEdit.workflow")}</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={workflowLoading}
                onClick={() => handleWorkflow("save_draft")}
                className="rounded-[3px] border border-[#d0d0d0] px-3 py-1.5 text-xs font-medium text-black hover:bg-white disabled:opacity-50"
              >
                {t("admin.productEdit.saveDraft")}
              </button>
              <button
                type="button"
                disabled={workflowLoading}
                onClick={() => handleWorkflow("submit_review")}
                className="rounded-[3px] border border-[#d0d0d0] px-3 py-1.5 text-xs font-medium text-black hover:bg-white disabled:opacity-50"
              >
                {t("admin.productEdit.submitReview")}
              </button>
              <button
                type="button"
                disabled={workflowLoading}
                onClick={() => handleWorkflow("publish")}
                className="rounded-[3px] bg-black px-3 py-1.5 text-xs font-semibold text-[#fff] hover:bg-[#222] disabled:opacity-50"
              >
                {t("admin.productEdit.publish")}
              </button>
            </div>
          </div>
        </form>

        {/* ── Sidebar ── */}
        <div className="space-y-4">
          {/* Images — drag & drop zone */}
          <div
            className="rounded-[3px] border border-[#e0e0e0] bg-white p-5 transition-all"
            onDragOver={(e) => {
              const types = Array.from(e.dataTransfer?.types || []);
              if (!types.includes("Files")) return;
              e.preventDefault();
              e.currentTarget.classList.add("ring-2", "ring-black");
            }}
            onDragLeave={(e) => { e.currentTarget.classList.remove("ring-2", "ring-black"); }}
            onDrop={handleImageDrop}
          >
            <h2 className="text-sm font-semibold text-black">
              {t("admin.productEdit.images")} ({product.images?.length || 0})
            </h2>
            <p className="mb-3 mt-1 text-[10px] text-[#999]">{t("admin.productEdit.imagesDragHint")}</p>
            {imageSourceMeta && (
              <div className="mb-3 rounded-[3px] border border-[#e8e8e8] bg-[#fafafa] px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#666]">
                    {t("admin.productEdit.imageSource")}
                  </span>
                  <span
                    className={`rounded px-2 py-0.5 text-[10px] font-semibold ${
                      imageSourceMeta.resolvedSource === "asset"
                        ? "bg-green-50 text-green-700"
                        : imageSourceMeta.resolvedSource === "legacy"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {imageSourceLabel}
                  </span>
                </div>
                <div className="mt-1 grid grid-cols-2 gap-x-3 gap-y-1 text-[10px] text-[#777]">
                  <div>{t("admin.productEdit.assetLinks")}: {imageSourceMeta.assetLinkCount || 0}</div>
                  <div>{t("admin.productEdit.galleryLinks")}: {imageSourceMeta.galleryAssetLinkCount || 0}</div>
                  <div>{t("admin.productEdit.legacyImages")}: {imageSourceMeta.legacyImageCount || 0}</div>
                  <div>{t("admin.productEdit.frontendUses")}: {imageSourceMeta.resolvedSource}</div>
                </div>
                {(imageSourceMeta.resolvedSource === "legacy" || imageSourceMeta.hasMixedStorage) && (
                  <>
                    <p className="mt-2 text-[10px] text-[#8a6a00]">
                      {t("admin.productEdit.legacyWarning")}
                    </p>
                    {imageSourceMeta.legacyImageCount > 0 && (
                      <button
                        type="button"
                        onClick={async () => {
                          const broken = (product.images || []).filter(
                            (img) => img.url && !img.url.startsWith("http")
                          );
                          if (!broken.length) {
                            showMsg("No local/broken images found");
                            return;
                          }
                          if (!confirm(`Delete ${broken.length} broken local image(s)? They point to files that no longer exist.`)) return;
                          for (const img of broken) {
                            try {
                              await fetch(`/api/admin/products/${productId}/images?imageId=${img.id}`, { method: "DELETE" });
                            } catch {}
                          }
                          fetchProduct();
                          showMsg(`Deleted ${broken.length} broken image(s)`);
                        }}
                        className="mt-2 rounded bg-red-600 px-2.5 py-1 text-[10px] font-semibold text-white hover:bg-red-700"
                      >
                        Delete all broken local images
                      </button>
                    )}
                  </>
                )}
                {imageSourceMeta.resolvedSource !== "asset" && (
                  <p className="mt-2 text-[10px] text-blue-600">
                    Storefront shows an auto-generated placeholder (blue gradient). Upload a real image to replace it.
                  </p>
                )}
              </div>
            )}

            {product.images && product.images.length > 0 ? (
              <div className="mb-4 grid grid-cols-2 gap-2">
                {product.images.map((img, idx) => (
                  <div
                    key={img.id}
                    draggable
                    onDragStart={(e) => {
                      setDragIdx(idx);
                      e.dataTransfer.effectAllowed = "move";
                      e.dataTransfer.setData("text/image-index", String(idx));
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setDropIdx(idx);
                      e.dataTransfer.dropEffect = "move";
                    }}
                    onDragLeave={() => {
                      setDropIdx((prev) => (prev === idx ? null : prev));
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const raw = e.dataTransfer.getData("text/image-index");
                      const from = dragIdx !== null ? dragIdx : Number(raw);
                      if (Number.isInteger(from) && from >= 0 && from !== idx) {
                        handleReorderImages(from, idx);
                      }
                      setDragIdx(null);
                      setDropIdx(null);
                    }}
                    onDragEnd={() => {
                      setDragIdx(null);
                      setDropIdx(null);
                    }}
                    className={`group relative overflow-hidden rounded-[3px] border border-[#e0e0e0] ${dropIdx === idx && dragIdx !== idx ? "ring-2 ring-black" : ""} ${dragIdx === idx ? "opacity-40" : ""}`}
                  >
                    {/* Image thumbnail — draggable area */}
                    <div className="relative cursor-grab active:cursor-grabbing">
                      <img
                        src={img.url}
                        alt={img.alt || product.name}
                        className="h-28 w-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                          const wrap = e.currentTarget.parentElement;
                          if (wrap && !wrap.querySelector(".broken-img-placeholder")) {
                            const ph = document.createElement("div");
                            ph.className = "broken-img-placeholder flex h-28 w-full flex-col items-center justify-center gap-1 bg-red-50 text-red-400";
                            ph.innerHTML = `<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"/></svg><span class="text-[9px] font-medium">404 Broken</span><span class="max-w-full truncate px-2 text-[8px] text-red-300">${img.url.length > 40 ? "..." + img.url.slice(-37) : img.url}</span>`;
                            wrap.prepend(ph);
                          }
                        }}
                      />
                      {idx === 0 && (
                        <span className="absolute left-1 top-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-[#fff]">{t("admin.productEdit.cover")}</span>
                      )}
                      {(bgRemovingId === img.id || compressingId === img.id) && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                          <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        </div>
                      )}
                    </div>
                    {/* Action bar — always visible, touch-friendly */}
                    <div className="flex items-center justify-between bg-[#fafafa] px-1 py-1">
                      {/* Left: reorder arrows */}
                      <div className="flex gap-0.5">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleReorderImages(idx, idx - 1)}
                          title="Move up"
                          className="rounded p-1 text-[#666] hover:bg-[#e0e0e0] disabled:opacity-25"
                        >
                          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          disabled={idx === product.images.length - 1}
                          onClick={() => handleReorderImages(idx, idx + 1)}
                          title="Move down"
                          className="rounded p-1 text-[#666] hover:bg-[#e0e0e0] disabled:opacity-25"
                        >
                          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                      {/* Right: action buttons */}
                      <div className="flex gap-0.5">
                        {idx !== 0 && (
                          <button type="button" onClick={() => handleSetPrimaryImage(img.id)} title="Set as cover" className="rounded p-1 text-[#666] hover:bg-[#e0e0e0]">
                            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                            </svg>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveBg(img.id, img.url)}
                          disabled={!!bgRemovingId}
                          title="Remove background"
                          className="rounded p-1 text-[#666] hover:bg-[#e0e0e0] disabled:opacity-40"
                        >
                          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => setTextOverlayImg({ id: img.id, url: img.url })}
                          title="Add text overlay"
                          className="rounded p-1 text-[#666] hover:bg-[#e0e0e0]"
                        >
                          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 5h14M12 5v14" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCompressImage(img.id, img.url)}
                          disabled={!!compressingId}
                          title="Compress image"
                          className="rounded p-1 text-[#666] hover:bg-[#e0e0e0] disabled:opacity-40"
                        >
                          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => setCropImg({ id: img.id, url: img.url })}
                          title="Crop image"
                          className="rounded p-1 text-[#666] hover:bg-[#e0e0e0]"
                        >
                          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 3.75H6A2.25 2.25 0 003.75 6v1.5M16.5 3.75H18A2.25 2.25 0 0120.25 6v1.5M16.5 20.25H18A2.25 2.25 0 0020.25 18v-1.5M7.5 20.25H6A2.25 2.25 0 013.75 18v-1.5" />
                          </svg>
                        </button>
                        <button type="button" onClick={() => triggerReplaceImage(img.id)} title="Replace image" className="rounded p-1 text-[#666] hover:bg-[#e0e0e0]">
                          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </button>
                        <button type="button" onClick={() => handleDeleteImage(img.id)} title="Delete image" className="rounded p-1 text-red-500 hover:bg-red-50">
                          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mb-4 flex h-24 flex-col items-center justify-center rounded-[3px] border-2 border-dashed border-[#e0e0e0] text-xs text-[#999]">
                <p>{t("admin.productEdit.dropImages")}</p>
                <p className="text-[10px]">{t("admin.productEdit.orClickUpload")}</p>
              </div>
            )}

            {/* Upload progress queue */}
            {uploadQueue.length > 0 && (
              <div className="mb-3 space-y-1">
                {uploadQueue.map((q) => (
                  <div key={q.id} className="flex items-center gap-2 text-[11px]">
                    <span className={`flex-shrink-0 h-1.5 w-1.5 rounded-full ${
                      q.status === "pending" ? "bg-[#d0d0d0]" :
                      q.status === "uploading" ? "bg-blue-500 animate-pulse" :
                      q.status === "done" ? "bg-green-500" : "bg-red-500"
                    }`} />
                    <span className="truncate text-[#666]">{q.name}</span>
                    <span className={`flex-shrink-0 text-[10px] font-medium ${
                      q.status === "uploading" ? "text-blue-600" :
                      q.status === "done" ? "text-green-600" :
                      q.status === "error" ? "text-red-500" : "text-[#999]"
                    }`}>
                      {q.status === "uploading" ? t("admin.productEdit.uploading") : q.status === "done" ? t("admin.productEdit.done") : q.status === "error" ? t("admin.productEdit.failed") : t("admin.productEdit.queued")}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Upload button (multi-file) */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => assetFileRef.current?.click()}
                disabled={uploadingAsset}
                className="w-full rounded-[3px] bg-black py-2 text-xs font-semibold text-[#fff] hover:bg-[#222] disabled:opacity-50"
              >
                {uploadingAsset ? t("admin.productEdit.uploading") : t("admin.productEdit.uploadImages")}
              </button>
              <input ref={assetFileRef} type="file" accept="image/*" multiple onChange={handleAssetUpload} className="hidden" />
              <input ref={replaceFileRef} type="file" accept="image/*" onChange={handleReplaceFile} className="hidden" />
            </div>

            {/* Legacy: Add by URL */}
            <details className="mt-3">
              <summary className="cursor-pointer text-[10px] text-[#999] hover:text-[#666]">{t("admin.productEdit.addByUrl")}</summary>
              <div className="mt-2 space-y-2">
                <input type="url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder={t("admin.productEdit.imageUrlPlaceholder")} className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-gray-900" />
                <input type="text" value={imageAlt} onChange={(e) => setImageAlt(e.target.value)} placeholder={t("admin.productEdit.altTextPlaceholder")} className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-gray-900" />
                <button type="button" onClick={handleAddImage} disabled={!imageUrl.trim() || addingImage} className="w-full rounded-[3px] border border-[#d0d0d0] py-2 text-xs font-medium text-black hover:bg-[#fafafa] disabled:opacity-50">
                  {addingImage ? t("admin.productEdit.adding") : t("admin.productEdit.addByUrl")}
                </button>
              </div>
            </details>
          </div>

          {/* Quick Info */}
          <div className="rounded-[3px] border border-[#e0e0e0] bg-white p-5">
            <h2 className="mb-3 text-sm font-semibold text-black">{t("admin.productEdit.quickInfo")}</h2>
            <dl className="space-y-2 text-xs">
              <div className="flex justify-between">
                <dt className="text-[#999]">{t("admin.productEdit.id")}</dt>
                <dd className="font-mono text-black truncate max-w-[120px]" title={product.id}>{product.id}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[#999]">{t("admin.productEdit.created")}</dt>
                <dd className="text-black">{new Date(product.createdAt).toLocaleDateString()}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[#999]">{t("admin.productEdit.updatedLabel")}</dt>
                <dd className="text-black">{new Date(product.updatedAt).toLocaleDateString()}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[#999]">{t("admin.productEdit.subseries")}</dt>
                <dd className="text-black">{form.subseries ? titleizeSlug(form.subseries) : t("admin.productEdit.missing")}</dd>
              </div>
              {imageSourceMeta && (
                <div className="flex justify-between">
                  <dt className="text-[#999]">{t("admin.productEdit.imageSource")}</dt>
                  <dd className="text-black text-right max-w-[170px]">{imageSourceMeta.resolvedSource}</dd>
                </div>
              )}
              {product.pricingPresetId && (
                <div className="flex justify-between">
                  <dt className="text-[#999]">{t("admin.productEdit.pricingPreset")}</dt>
                  <dd className="text-black truncate max-w-[160px]" title={product.pricingPresetId}>
                    {presets.find((p) => p.id === product.pricingPresetId)?.name || product.pricingPresetId}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          <div className="rounded-[3px] border border-[#e0e0e0] bg-white p-5">
            <h2 className="mb-3 text-sm font-semibold text-black">{t("admin.productEdit.checklist")}</h2>
            <div className="space-y-1.5 text-xs">
              <div className={checklist.hasImage ? "text-green-700" : "text-red-600"}>{checklist.hasImage ? "✓" : "✕"} {t("admin.productEdit.checkHasImage")}</div>
              <div className={checklist.hasPrice ? "text-green-700" : "text-red-600"}>{checklist.hasPrice ? "✓" : "✕"} {t("admin.productEdit.checkHasPrice")}</div>
              <div className={checklist.hasDescription ? "text-green-700" : "text-red-600"}>{checklist.hasDescription ? "✓" : "✕"} {t("admin.productEdit.checkHasDesc")}</div>
              <div className={checklist.hasSeo ? "text-green-700" : "text-red-600"}>{checklist.hasSeo ? "✓" : "✕"} {t("admin.productEdit.checkHasSeo")}</div>
              <div className={checklist.hasSubseries ? "text-green-700" : "text-red-600"}>{checklist.hasSubseries ? "✓" : "✕"} {t("admin.productEdit.checkHasSubseries")}</div>
            </div>
            <div className={`mt-3 rounded-[3px] px-2.5 py-2 text-xs font-semibold ${checklistReady ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>
              {checklistReady ? t("admin.productEdit.readyPublish") : t("admin.productEdit.notReadyPublish")}
            </div>
          </div>
        </div>
      </div>

      {/* Text Overlay Modal */}
      {textOverlayImg && (
        <TextOverlayModal
          image={textOverlayImg}
          onSave={handleTextOverlaySave}
          onClose={() => setTextOverlayImg(null)}
        />
      )}

      {/* Crop Modal */}
      {cropImg && (
        <CropModal
          image={cropImg}
          onSave={handleTextOverlaySave}
          onClose={() => setCropImg(null)}
        />
      )}
    </div>
  );
}
