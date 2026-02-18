"use client";

import { useEffect, useState, useCallback, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { resizeImageFile } from "@/lib/client-image-resize";

export default function MediaPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-48 items-center justify-center text-sm text-[#999]">
          Loading...
        </div>
      }
    >
      <MediaContent />
    </Suspense>
  );
}

function MediaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [tab, setTab] = useState("assets"); // "assets" | "legacy"
  const [assets, setAssets] = useState([]);
  const [legacyImages, setLegacyImages] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [statusFilter, setStatusFilter] = useState("published");
  const [message, setMessage] = useState(null);

  // Upload modal — multi-file
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadFiles, setUploadFiles] = useState([]); // [{id, file, preview, alt, status}]
  const [uploadTags, setUploadTags] = useState("");
  const [uploadProductQuery, setUploadProductQuery] = useState("");
  const [uploadProductResults, setUploadProductResults] = useState([]);
  const [uploadProductLoading, setUploadProductLoading] = useState(false);
  const [uploadProductId, setUploadProductId] = useState("");
  const [uploadPreviewSrc, setUploadPreviewSrc] = useState(null);
  const fileInputRef = useRef(null);

  // Detail modal
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [editAlt, setEditAlt] = useState("");
  const [editTags, setEditTags] = useState("");
  const [editFocalX, setEditFocalX] = useState(0.5);
  const [editFocalY, setEditFocalY] = useState(0.5);
  const [savingDetail, setSavingDetail] = useState(false);
  const [detailProductQuery, setDetailProductQuery] = useState("");
  const [detailProductResults, setDetailProductResults] = useState([]);
  const [detailProductLoading, setDetailProductLoading] = useState(false);
  const [detailProductId, setDetailProductId] = useState("");
  const [linkingInDetail, setLinkingInDetail] = useState(false);

  // Background removal
  const [bgRemoving, setBgRemoving] = useState(false);
  const [bgRemovedBlob, setBgRemovedBlob] = useState(null);
  const [bgRemovedPreview, setBgRemovedPreview] = useState(null);
  const [bgSaving, setBgSaving] = useState(false);

  // Page-level drag-and-drop
  const [pageDragOver, setPageDragOver] = useState(false);
  const dragCounter = useRef(0);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [health, setHealth] = useState(null);
  const [healthLoading, setHealthLoading] = useState(false);

  const [batchFiles, setBatchFiles] = useState([]);
  const [batchAutoLink, setBatchAutoLink] = useState(true);
  const [batchUploading, setBatchUploading] = useState(false);
  const [batchReport, setBatchReport] = useState([]);
  const [batchCsvMap, setBatchCsvMap] = useState({});
  const [batchCsvLoaded, setBatchCsvLoaded] = useState(false);
  const batchInputRef = useRef(null);
  const batchCsvRef = useRef(null);

  const page = parseInt(searchParams.get("page") || "1");

  // ── Fetch Assets ──
  const fetchAssets = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", "40");
    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);

    try {
      const res = await fetch(`/api/admin/assets?${params}`);
      const data = await res.json();
      setAssets(data.assets || []);
      setPagination(data.pagination || null);
    } catch (err) {
      console.error("Failed to load assets:", err);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  // ── Fetch Legacy Images ──
  const fetchLegacy = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", "40");
    if (search) params.set("search", search);

    try {
      const res = await fetch(`/api/admin/media?${params}`);
      const data = await res.json();
      setLegacyImages(data.images || []);
      setPagination(data.pagination || null);
    } catch (err) {
      console.error("Failed to load legacy images:", err);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    if (tab === "assets") fetchAssets();
    else fetchLegacy();
  }, [tab, fetchAssets, fetchLegacy]);

  function updateParams(updates) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    router.push(`/admin/media?${params}`);
  }

  function handleSearch(e) {
    e.preventDefault();
    updateParams({ search: search || null, page: "1" });
  }

  function showMsg(text, isError = false) {
    setMessage({ text, isError });
    setTimeout(() => setMessage(null), 3000);
  }

  function filenameToSlug(fileName) {
    return String(fileName || "")
      .replace(/\.[^.]+$/, "")
      .toLowerCase()
      .replace(/[_\s]+/g, "-")
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  }

  function normalizeFileKey(name) {
    return String(name || "").trim().toLowerCase();
  }

  function parseCsvLine(line) {
    const out = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i += 1) {
      const ch = line[i];
      if (ch === "\"") {
        if (inQuotes && line[i + 1] === "\"") {
          cur += "\"";
          i += 1;
        } else {
          inQuotes = !inQuotes;
        }
        continue;
      }
      if (ch === "," && !inQuotes) {
        out.push(cur.trim());
        cur = "";
        continue;
      }
      cur += ch;
    }
    out.push(cur.trim());
    return out;
  }

  function parseCsvMapping(text) {
    const lines = String(text || "")
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    const map = {};
    lines.forEach((line, idx) => {
      const parts = parseCsvLine(line);
      if (parts.length < 2) return;
      if (idx === 0 && /file(name)?/i.test(parts[0]) && /(slug|product)/i.test(parts[1])) return;
      const filename = normalizeFileKey(parts[0]);
      const productSlug = filenameToSlug(parts[1]);
      if (!filename || !productSlug) return;
      map[filename] = productSlug;
    });
    return map;
  }

  const fetchHealth = useCallback(async () => {
    setHealthLoading(true);
    try {
      const res = await fetch("/api/admin/media/health");
      const data = await res.json();
      if (!res.ok) {
        setMessage({ text: data.error || "Failed to load media health", isError: true });
        return;
      }
      setHealth(data);
    } catch {
      setMessage({ text: "Failed to load media health", isError: true });
    } finally {
      setHealthLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === "assets") fetchHealth();
  }, [tab, fetchHealth]);

  async function searchProducts(query, setLoadingFn, setResultsFn) {
    const q = query.trim();
    if (!q) {
      setResultsFn([]);
      return;
    }
    setLoadingFn(true);
    try {
      const params = new URLSearchParams();
      params.set("search", q);
      params.set("active", "true");
      params.set("limit", "12");
      const res = await fetch(`/api/admin/products?${params}`);
      const data = await res.json();
      if (!res.ok) {
        showMsg(data.error || "Product search failed", true);
        setResultsFn([]);
        return;
      }
      setResultsFn(data.products || []);
    } catch {
      showMsg("Product search failed", true);
      setResultsFn([]);
    } finally {
      setLoadingFn(false);
    }
  }

  async function findProductBySlugSlugOrName(slugGuess) {
    const params = new URLSearchParams();
    params.set("search", slugGuess);
    params.set("active", "true");
    params.set("limit", "20");
    const res = await fetch(`/api/admin/products?${params}`);
    const data = await res.json();
    if (!res.ok) return null;
    const list = data.products || [];
    const exact = list.find((p) => p.slug === slugGuess);
    return exact || list[0] || null;
  }

  async function linkAssetToProduct(asset, productId) {
    if (!asset?.id || !productId) return;

    const linkRes = await fetch(`/api/admin/assets/${asset.id}/links`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        entityType: "product",
        entityId: productId,
        purpose: "gallery",
      }),
    });
    const linkData = await linkRes.json().catch(() => ({}));
    if (!linkRes.ok) {
      throw new Error(linkData?.error || "Failed to create asset link");
    }

    const imageRes = await fetch(`/api/admin/products/${productId}/images`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: asset.originalUrl, alt: asset.altText || null }),
    });
    const imageData = await imageRes.json().catch(() => ({}));
    if (!imageRes.ok) {
      throw new Error(imageData?.error || "Failed to add product image");
    }
  }

  function filenameToAlt(fileName) {
    return String(fileName || "")
      .replace(/\.[^.]+$/, "")
      .replace(/[-_]+/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase())
      .trim();
  }

  let fileIdCounter = useRef(0);

  // ── Clipboard paste (Ctrl+V) ──
  useEffect(() => {
    if (!showUpload) return;
    function handlePaste(e) {
      const items = e.clipboardData?.items;
      if (!items) return;
      const imageFiles = [];
      for (const item of items) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) {
            const ext = file.type.split("/")[1] || "png";
            const named = new File([file], `pasted-image-${Date.now()}.${ext}`, { type: file.type });
            imageFiles.push(named);
          }
        }
      }
      if (imageFiles.length > 0) {
        e.preventDefault();
        addFiles(imageFiles);
      }
    }
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [showUpload]);

  async function addFiles(fileList) {
    const rawFiles = Array.from(fileList);
    // Resize large images client-side before queuing
    const resized = await Promise.all(rawFiles.map((f) => resizeImageFile(f)));
    const newEntries = resized.map((file, i) => ({
      id: `f_${++fileIdCounter.current}`,
      file,
      preview: URL.createObjectURL(file),
      alt: filenameToAlt(rawFiles[i].name),
      status: "ready",
      wasResized: file !== rawFiles[i],
    }));
    setUploadFiles((prev) => [...prev, ...newEntries]);

    // Smart auto-match: if no product selected yet, try to find one from first filename
    if (!uploadProductId && newEntries.length > 0) {
      const slug = filenameToSlug(rawFiles[0].name);
      if (slug && slug.length >= 3) {
        findProductBySlugSlugOrName(slug).then((product) => {
          if (product) {
            setUploadProductResults([product]);
            setUploadProductId(product.id);
            setUploadProductQuery(product.name);
          }
        }).catch(() => {});
      }
    }
  }

  // ── File selection (multi) ──
  function handleFileChange(e) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    addFiles(files);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeUploadFile(id) {
    setUploadFiles((prev) => {
      const removed = prev.find((f) => f.id === id);
      if (removed?.preview) URL.revokeObjectURL(removed.preview);
      return prev.filter((f) => f.id !== id);
    });
  }

  function updateUploadFileAlt(id, alt) {
    setUploadFiles((prev) => prev.map((f) => f.id === id ? { ...f, alt } : f));
  }

  // ── Upload all queued files ──
  async function handleUpload(e) {
    e.preventDefault();
    const pending = uploadFiles.filter((f) => f.status === "ready");
    if (pending.length === 0) { showMsg("Select files first", true); return; }

    setUploading(true);
    let doneCount = 0;
    let errorCount = 0;

    for (const entry of pending) {
      setUploadFiles((prev) => prev.map((f) => f.id === entry.id ? { ...f, status: "uploading" } : f));

      try {
        const formData = new FormData();
        formData.append("file", entry.file);
        formData.append("altText", entry.alt || filenameToAlt(entry.file.name));
        if (uploadTags.trim()) formData.append("tags", uploadTags.trim());

        const res = await fetch("/api/admin/assets", { method: "POST", body: formData });
        const data = await res.json();

        if (!res.ok) {
          const errMsg = data.error || "Upload failed";
          console.error("[Upload failed]", entry.file.name, errMsg);
          setUploadFiles((prev) => prev.map((f) => f.id === entry.id ? { ...f, status: "error", errorMsg: errMsg } : f));
          errorCount++;
          if (errorCount === 1) showMsg(errMsg, true);
          continue;
        }

        if (uploadProductId) {
          try { await linkAssetToProduct(data.asset, uploadProductId); } catch {}
        }

        setUploadFiles((prev) => prev.map((f) => f.id === entry.id ? { ...f, status: "done" } : f));
        doneCount++;
      } catch {
        setUploadFiles((prev) => prev.map((f) => f.id === entry.id ? { ...f, status: "error" } : f));
        errorCount++;
      }
    }

    setUploading(false);
    fetchAssets();
    fetchHealth();
    if (errorCount === 0) {
      showMsg(`${doneCount} image${doneCount > 1 ? "s" : ""} uploaded`);
    } else {
      showMsg(`${doneCount} uploaded, ${errorCount} failed`, true);
    }
  }

  function handleBatchFileChange(e) {
    const files = Array.from(e.target.files || []);
    setBatchFiles(files);
    setBatchReport([]);
  }

  async function handleBatchCsvChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const mapping = parseCsvMapping(text);
      setBatchCsvMap(mapping);
      setBatchCsvLoaded(Object.keys(mapping).length > 0);
      showMsg(`CSV mapping loaded: ${Object.keys(mapping).length} rows`);
    } catch {
      showMsg("Failed to parse CSV mapping", true);
    } finally {
      if (batchCsvRef.current) batchCsvRef.current.value = "";
    }
  }

  function getMappedSlugForFile(fileName) {
    const full = normalizeFileKey(fileName);
    const base = normalizeFileKey(String(fileName || "").replace(/\.[^.]+$/, ""));
    return batchCsvMap[full] || batchCsvMap[base] || null;
  }

  async function retryFailedRows() {
    const retryRows = batchReport.filter((r) => ["failed", "uploaded_unmatched"].includes(r.status) && r.file);
    if (!retryRows.length) {
      showMsg("No retryable rows", true);
      return;
    }
    const retryFiles = retryRows.map((r) => r.file);
    setBatchFiles(retryFiles);
    setBatchReport([]);
    await handleBatchUpload({ preventDefault: () => {} }, retryFiles);
  }

  async function handleBatchUpload(e, explicitFiles = null) {
    e.preventDefault();
    const filesToRun = explicitFiles || batchFiles;
    if (!filesToRun.length) {
      showMsg("Select batch files first", true);
      return;
    }
    setBatchUploading(true);
    const nextReport = [];

    for (const file of filesToRun) {
      const row = { fileName: file.name, status: "uploaded", product: null, error: null, file };
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("altText", filenameToAlt(file.name));
        formData.append("tags", uploadTags.trim() || "product");

        const uploadRes = await fetch("/api/admin/assets", {
          method: "POST",
          body: formData,
        });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) {
          row.status = "failed";
          row.error = uploadData?.error || "Upload failed";
          nextReport.push(row);
          continue;
        }

        if (batchAutoLink) {
          const slugGuess = getMappedSlugForFile(file.name) || filenameToSlug(file.name);
          const product = await findProductBySlugSlugOrName(slugGuess);
          if (product?.id) {
            await linkAssetToProduct(uploadData.asset, product.id);
            row.status = "linked";
            row.product = `${product.name} (${product.slug})`;
          } else {
            row.status = "uploaded_unmatched";
            row.error = `No product match for ${slugGuess}`;
          }
        }
      } catch (err) {
        row.status = "failed";
        row.error = err?.message || "Unknown error";
      }
      nextReport.push(row);
      setBatchReport([...nextReport]);
    }

    setBatchUploading(false);
    fetchAssets();
    fetchHealth();
    showMsg("Batch upload finished");
  }

  // ── Background removal ──
  async function handleRemoveBg() {
    if (!selectedAsset || bgRemoving) return;
    setBgRemoving(true);
    setBgRemovedBlob(null);
    setBgRemovedPreview(null);
    try {
      const { removeBackground } = await import("@imgly/background-removal");
      const blob = await removeBackground(selectedAsset.originalUrl, {
        output: { format: "image/png" },
      });
      const url = URL.createObjectURL(blob);
      setBgRemovedBlob(blob);
      setBgRemovedPreview(url);
      showMsg("Background removed successfully");
    } catch (err) {
      console.error("Background removal failed:", err);
      showMsg("Background removal failed — try a clearer photo", true);
    } finally {
      setBgRemoving(false);
    }
  }

  async function handleSaveBgRemoved() {
    if (!bgRemovedBlob || !selectedAsset || bgSaving) return;
    setBgSaving(true);
    try {
      const fileName = selectedAsset.originalName.replace(/\.[^.]+$/, "") + "-nobg.png";
      const file = new File([bgRemovedBlob], fileName, { type: "image/png" });

      const formData = new FormData();
      formData.append("file", file);
      formData.append("altText", (editAlt || selectedAsset.altText || filenameToAlt(fileName)) + " (no background)");
      formData.append("tags", "background-removed");

      const res = await fetch("/api/admin/assets", { method: "POST", body: formData });
      if (!res.ok) {
        showMsg("Failed to save background-removed image", true);
        return;
      }
      showMsg("Saved as new asset");
      setBgRemovedBlob(null);
      if (bgRemovedPreview) URL.revokeObjectURL(bgRemovedPreview);
      setBgRemovedPreview(null);
      fetchAssets();
      fetchHealth();
    } catch {
      showMsg("Failed to save", true);
    } finally {
      setBgSaving(false);
    }
  }

  // ── Open detail ──
  async function openDetail(asset) {
    setSelectedAsset(asset);
    setEditAlt(asset.altText || "");
    setEditTags((asset.tags || []).join(", "));
    setEditFocalX(asset.focalX ?? 0.5);
    setEditFocalY(asset.focalY ?? 0.5);
    setDetailProductQuery("");
    setDetailProductResults([]);
    setDetailProductId("");
    setBgRemovedBlob(null);
    if (bgRemovedPreview) URL.revokeObjectURL(bgRemovedPreview);
    setBgRemovedPreview(null);
    setBgRemoving(false);
  }

  // ── Save detail ──
  async function saveDetail() {
    if (!selectedAsset) return;
    setSavingDetail(true);
    try {
      const tags = editTags.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean);
      const res = await fetch(`/api/admin/assets/${selectedAsset.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          altText: editAlt.trim() || null,
          tags,
          focalX: editFocalX,
          focalY: editFocalY,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        showMsg(data.error || "Failed to save", true);
        return;
      }
      showMsg("Asset updated");
      setSelectedAsset(null);
      fetchAssets();
    } catch {
      showMsg("Failed to save", true);
    } finally {
      setSavingDetail(false);
    }
  }

  // ── Archive asset ──
  async function handleArchive() {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/admin/assets/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) { showMsg("Failed to archive", true); return; }
      showMsg("Asset archived");
      fetchAssets();
      fetchHealth();
    } catch {
      showMsg("Failed to archive", true);
    } finally {
      setDeleteTarget(null);
    }
  }

  // ── Delete legacy image ──
  async function handleDeleteLegacy(id) {
    try {
      const res = await fetch(`/api/admin/media?id=${id}`, { method: "DELETE" });
      if (!res.ok) { showMsg("Failed to delete", true); return; }
      showMsg("Image deleted");
      fetchLegacy();
      fetchHealth();
    } catch {
      showMsg("Failed to delete", true);
    }
  }

  // ── Focal point click handler ──
  function handleFocalClick(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setEditFocalX(Math.round(x * 100) / 100);
    setEditFocalY(Math.round(y * 100) / 100);
  }

  function formatBytes(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  }

  async function handleDetailLink() {
    if (!selectedAsset || !detailProductId) return;
    setLinkingInDetail(true);
    try {
      await linkAssetToProduct(selectedAsset, detailProductId);
      showMsg("Asset linked to product");
      fetchAssets();
      fetchHealth();
    } catch (err) {
      showMsg(err?.message || "Failed to link asset", true);
    } finally {
      setLinkingInDetail(false);
    }
  }

  return (
    <div
      className="space-y-4 relative"
      onDragEnter={(e) => {
        e.preventDefault();
        dragCounter.current++;
        if (e.dataTransfer.types.includes("Files")) setPageDragOver(true);
      }}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={(e) => {
        e.preventDefault();
        dragCounter.current--;
        if (dragCounter.current <= 0) { dragCounter.current = 0; setPageDragOver(false); }
      }}
      onDrop={(e) => {
        e.preventDefault();
        dragCounter.current = 0;
        setPageDragOver(false);
        if (e.dataTransfer.files?.length) {
          setShowUpload(true);
          // Small delay so addFiles runs after modal state is set
          setTimeout(() => addFiles(e.dataTransfer.files), 50);
        }
      }}
    >
      {/* Page-level drop overlay */}
      {pageDragOver && (
        <div className="fixed inset-0 z-[55] flex items-center justify-center bg-black/50 pointer-events-none">
          <div className="rounded-lg border-2 border-dashed border-white bg-black/60 px-12 py-8 text-center">
            <svg className="mx-auto h-12 w-12 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            <p className="mt-3 text-sm font-semibold text-white">Drop images to upload</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-black">Media Library</h1>
        <button
          type="button"
          onClick={() => setShowUpload(true)}
          className="rounded-[3px] bg-black px-4 py-2 text-xs font-semibold text-white hover:bg-[#222]"
        >
          + Upload Asset
        </button>
      </div>

      {/* Toast */}
      {message && (
        <div className={`rounded-[3px] px-4 py-3 text-sm font-medium ${message.isError ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"}`}>
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 rounded-[3px] bg-[#f5f5f5] p-1">
        <button
          type="button"
          onClick={() => setTab("assets")}
          className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${tab === "assets" ? "bg-white text-black shadow-sm" : "text-[#999] hover:text-black"}`}
        >
          Asset Library
        </button>
        <button
          type="button"
          onClick={() => setTab("legacy")}
          className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${tab === "legacy" ? "bg-white text-black shadow-sm" : "text-[#999] hover:text-black"}`}
        >
          Product Images (old)
        </button>
      </div>

        {tab === "assets" && (
        <div className="rounded-[3px] border border-[#e0e0e0] bg-white p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-black">Image Health Check</h2>
            <button
              type="button"
              onClick={fetchHealth}
              className="rounded-[3px] border border-[#d0d0d0] px-3 py-1.5 text-xs font-medium text-black hover:bg-[#fafafa]"
            >
              {healthLoading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
          {!health ? (
            <p className="text-xs text-[#999]">{healthLoading ? "Loading..." : "No health report yet."}</p>
          ) : (
            <>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-[3px] border border-[#e0e0e0] p-2.5">
                  <p className="text-[11px] text-[#666]">Total Assets</p>
                  <p className="text-base font-semibold text-black">{health.summary.totalAssets}</p>
                </div>
                <div className="rounded-[3px] border border-[#e0e0e0] p-2.5">
                  <p className="text-[11px] text-[#666]">Unused Images</p>
                  <p className="text-[10px] text-[#bbb]">Not linked to any product</p>
                  <p className="text-base font-semibold text-black">{health.summary.orphanAssets}</p>
                </div>
                <div className="rounded-[3px] border border-[#e0e0e0] p-2.5">
                  <p className="text-[11px] text-[#666]">Missing URLs</p>
                  <p className="text-[10px] text-[#bbb]">Placeholder / broken links</p>
                  <p className="text-base font-semibold text-black">{health.summary.placeholderAssets}</p>
                </div>
                <div className="rounded-[3px] border border-[#e0e0e0] p-2.5">
                  <p className="text-[11px] text-[#666]">Active Products Missing Image</p>
                  <p className="text-base font-semibold text-black">{health.summary.activeProductsWithoutImage}</p>
                </div>
              </div>
              {(health.orphanExamples?.length > 0 || health.missingImageProducts?.length > 0) && (
                <div className="grid gap-2 lg:grid-cols-2">
                  <div className="rounded-[3px] border border-[#e0e0e0] p-2.5">
                    <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#666]">Unused Images</p>
                    <div className="space-y-1 text-xs">
                      {(health.orphanExamples || []).slice(0, 5).map((a) => (
                        <div key={a.id} className="truncate text-[#666]" title={a.originalName}>
                          {a.originalName}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-[3px] border border-[#e0e0e0] p-2.5">
                    <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#666]">Products Missing Image</p>
                    <div className="space-y-1 text-xs">
                      {(health.missingImageProducts || []).slice(0, 5).map((p) => (
                        <Link key={p.id} href={`/admin/products/${p.id}`} className="block truncate text-black underline hover:no-underline" title={`${p.name} (${p.slug})`}>
                          {p.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Search & Filters */}
      <div className="flex gap-2 flex-wrap">
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={tab === "assets" ? "Search by name, alt text..." : "Search by alt text or product..."}
            className="w-full sm:w-72 rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-black"
          />
          <button type="submit" className="rounded-[3px] bg-black px-4 py-2 text-xs font-semibold text-white hover:bg-[#222]">
            Search
          </button>
        </form>
        {tab === "assets" && (
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none"
          >
            <option value="">All Status</option>
            <option value="published">Published</option>
            <option value="uploaded">Uploaded</option>
            <option value="archived">Archived</option>
          </select>
        )}
        {searchParams.get("search") && (
          <button
            type="button"
            onClick={() => { setSearch(""); updateParams({ search: null, page: "1" }); }}
            className="rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-xs font-medium text-[#666] hover:bg-[#fafafa]"
          >
            Clear
          </button>
        )}
      </div>

      {/* ── Assets Gallery ── */}
      {tab === "assets" && (
        <div className="rounded-[3px] border border-[#e0e0e0] bg-white p-3 sm:p-5">
          {loading ? (
            <div className="flex h-48 items-center justify-center text-sm text-[#999]">Loading...</div>
          ) : assets.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center gap-2 text-sm text-[#999]">
              <p>No assets found</p>
              <button type="button" onClick={() => setShowUpload(true)} className="text-xs text-black underline hover:no-underline">
                Upload your first asset
              </button>
            </div>
          ) : (
            <>
              {/* Mobile: gallery feed (like phone album) */}
              <div className="space-y-3 sm:hidden">
                {assets.map((asset) => (
                  <div key={asset.id} className="rounded-[3px] border border-[#e0e0e0] overflow-hidden">
                    <img src={asset.originalUrl} alt={asset.altText || ""} className="w-full object-contain bg-[#fafafa] max-h-[60vh]" />
                    <div className="flex items-center justify-between gap-2 px-3 py-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-black truncate">{asset.originalName}</p>
                        <p className="text-[10px] text-[#999]">{asset.widthPx}x{asset.heightPx} · {formatBytes(asset.sizeBytes)}</p>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => openDetail(asset)}
                          className="rounded-[3px] border border-[#d0d0d0] px-2.5 py-1.5 text-[10px] font-medium text-black hover:bg-[#fafafa]"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(asset)}
                          className="rounded-[3px] border border-red-200 bg-red-50 px-2.5 py-1.5 text-[10px] font-medium text-red-600 hover:bg-red-100"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop: grid */}
              <div className="hidden sm:grid sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {assets.map((asset) => (
                  <div
                    key={asset.id}
                    className="rounded-[3px] overflow-hidden border border-[#e0e0e0] group relative cursor-pointer"
                    onClick={() => openDetail(asset)}
                  >
                    <div className="aspect-square relative bg-[#fafafa]">
                      <img src={asset.originalUrl} alt={asset.altText || ""} className="h-full w-full object-cover" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2.5">
                        <div className="flex justify-between items-start">
                          <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                            asset.status === "published" ? "bg-green-500/80 text-white" :
                            asset.status === "archived" ? "bg-[#fafafa]0/80 text-white" :
                            "bg-yellow-500/80 text-white"
                          }`}>
                            {asset.status}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setDeleteTarget(asset); }}
                            className="flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white text-xs font-bold hover:bg-red-600"
                          >
                            X
                          </button>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-white/90 truncate">{asset.originalName}</p>
                          <p className="text-[10px] text-white/90">
                            {asset.widthPx}x{asset.heightPx} · {formatBytes(asset.sizeBytes)} · {asset.linkCount || 0} links
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Legacy Grid ── */}
      {tab === "legacy" && (
        <div className="rounded-[3px] border border-[#e0e0e0] bg-white p-5">
          {loading ? (
            <div className="flex h-48 items-center justify-center text-sm text-[#999]">Loading...</div>
          ) : legacyImages.length === 0 ? (
            <div className="flex h-48 items-center justify-center text-sm text-[#999]">No legacy images found</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {legacyImages.map((image) => (
                <div key={image.id} className="rounded-[3px] overflow-hidden border border-[#e0e0e0] group relative">
                  <div className="aspect-square relative">
                    <img src={image.url} alt={image.alt || ""} className="h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2.5">
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleDeleteLegacy(image.id)}
                          className="flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white text-xs font-bold hover:bg-red-600"
                        >
                          X
                        </button>
                      </div>
                      <div className="space-y-1">
                        {image.alt && <p className="text-xs text-white/90 leading-tight line-clamp-2">{image.alt}</p>}
                        {image.product && <p className="text-xs text-white/90 truncate">{image.product.name}</p>}
                      </div>
                    </div>
                  </div>
                  {image.product && (
                    <div className="px-2 py-1.5">
                      <Link href={`/admin/products/${image.product.id}`} className="text-xs text-black underline hover:no-underline truncate block">
                        {image.product.name}
                      </Link>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-[#999]">
            Showing {(pagination.page - 1) * pagination.limit + 1}-
            {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
          </p>
          <div className="flex gap-1">
            <button type="button" disabled={page <= 1} onClick={() => updateParams({ page: String(page - 1) })} className="rounded-[3px] border border-[#d0d0d0] px-3 py-1.5 text-xs font-medium text-black hover:bg-[#fafafa] disabled:opacity-40">
              Previous
            </button>
            <button type="button" disabled={page >= pagination.totalPages} onClick={() => updateParams({ page: String(page + 1) })} className="rounded-[3px] border border-[#d0d0d0] px-3 py-1.5 text-xs font-medium text-black hover:bg-[#fafafa] disabled:opacity-40">
              Next
            </button>
          </div>
        </div>
      )}

      {/* ── Upload Modal (multi-file) ── */}
      {showUpload && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center" onClick={(e) => { if (e.target === e.currentTarget) setShowUpload(false); }}>
          <div className="bg-white rounded-[3px] shadow-lg w-full max-w-lg mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-black">Upload Images</h2>
              <button type="button" onClick={() => { setShowUpload(false); setUploadFiles([]); }} className="text-[#999] hover:text-[#666] text-lg leading-none">&times;</button>
            </div>

            <form onSubmit={handleUpload} className="space-y-4">
              {/* Drop zone (multi-file) */}
              <div
                className="flex flex-col items-center justify-center gap-2 rounded-[3px] border-2 border-dashed border-[#d0d0d0] p-6 cursor-pointer hover:border-[#999] transition-colors"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add("border-black"); }}
                onDragLeave={(e) => { e.currentTarget.classList.remove("border-black"); }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.remove("border-black");
                  if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
                }}
              >
                <svg className="h-8 w-8 text-[#999]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
                <p className="text-xs text-[#999]">Drop images here, click to browse, or Ctrl+V to paste</p>
                <p className="text-[10px] text-[#999]">Multiple files OK — JPEG, PNG, WebP, SVG (max 20MB each)</p>
                {uploadProductId && uploadProductQuery && (
                  <p className="mt-1 rounded bg-green-50 px-2 py-0.5 text-[10px] font-medium text-green-700">
                    Auto-matched: {uploadProductQuery}
                    <button type="button" onClick={(e) => { e.stopPropagation(); setUploadProductId(""); setUploadProductQuery(""); setUploadProductResults([]); }} className="ml-1 text-green-500 hover:text-red-500">&times;</button>
                  </p>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileChange} className="hidden" />
              </div>

              {/* File list with preview */}
              {uploadFiles.length > 0 && (
                <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                  {uploadFiles.map((entry) => (
                    <div key={entry.id} className="rounded-[3px] border border-[#e0e0e0] p-2 space-y-2">
                      {/* Clickable image preview */}
                      <button
                        type="button"
                        onClick={() => setUploadPreviewSrc(entry.preview)}
                        className="block w-full overflow-hidden rounded-[2px] border border-[#e0e0e0] hover:opacity-80 transition-opacity"
                      >
                        <img src={entry.preview} alt="" className="w-full max-h-48 object-contain bg-[#fafafa]" />
                      </button>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 min-w-0">
                          <input
                            type="text"
                            value={entry.alt}
                            onChange={(e) => updateUploadFileAlt(entry.id, e.target.value)}
                            placeholder="Alt text"
                            disabled={entry.status !== "ready"}
                            className="w-full rounded-[2px] border border-transparent px-1.5 py-0.5 text-xs outline-none hover:border-[#d0d0d0] focus:border-black disabled:bg-transparent"
                          />
                          <p className="px-1.5 text-[10px] text-[#999] truncate">
                            {entry.file.name} ({formatBytes(entry.file.size)})
                            {entry.wasResized && <span className="ml-1 text-blue-500">resized</span>}
                          </p>
                        </div>
                        {entry.status === "ready" && (
                          <button type="button" onClick={() => removeUploadFile(entry.id)} className="flex-shrink-0 text-[#999] hover:text-red-500 text-sm">&times;</button>
                        )}
                        {entry.status === "uploading" && (
                          <span className="flex-shrink-0 text-[10px] font-medium text-blue-600">Uploading...</span>
                        )}
                        {entry.status === "done" && (
                          <span className="flex-shrink-0 rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-medium text-green-600">Uploaded</span>
                        )}
                        {entry.status === "error" && (
                          <span className="flex-shrink-0 rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-medium text-red-500" title={entry.errorMsg || ""}>{entry.errorMsg || "Failed"}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Tags (optional, applies to all) */}
              <details className="rounded-[3px] border border-[#e0e0e0]">
                <summary className="cursor-pointer px-3 py-2 text-xs font-medium text-[#666]">Tags & Product Link (optional)</summary>
                <div className="border-t border-[#e0e0e0] p-3 space-y-3">
                  <div>
                    <label className="block text-[11px] font-medium text-[#666] mb-1">Tags (comma-separated)</label>
                    <input type="text" value={uploadTags} onChange={(e) => setUploadTags(e.target.value)} placeholder="product, banner, hero..." className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-black" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-[#666] mb-1">Link to Product</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={uploadProductQuery}
                        onChange={(e) => setUploadProductQuery(e.target.value)}
                        placeholder="Search product name or slug"
                        className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-black"
                      />
                      <button
                        type="button"
                        onClick={() => searchProducts(uploadProductQuery, setUploadProductLoading, setUploadProductResults)}
                        className="rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-xs font-medium text-black hover:bg-[#fafafa]"
                      >
                        {uploadProductLoading ? "..." : "Find"}
                      </button>
                    </div>
                    {uploadProductResults.length > 0 && (
                      <select
                        value={uploadProductId}
                        onChange={(e) => setUploadProductId(e.target.value)}
                        className="mt-2 w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-black"
                      >
                        <option value="">Select product (optional)</option>
                        {uploadProductResults.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.slug})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              </details>

              {/* Batch CSV auto-match (advanced, collapsed) */}
              <details className="rounded-[3px] border border-[#e0e0e0]">
                <summary className="cursor-pointer px-3 py-2 text-xs font-medium text-[#666]">Batch CSV Auto-Match (advanced)</summary>
                <div className="border-t border-[#e0e0e0] p-3 space-y-2">
                  <p className="text-[10px] text-[#999]">Upload a CSV (filename, product-slug) to auto-link images to products by name.</p>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => batchCsvRef.current?.click()}
                      className="rounded-[3px] border border-[#d0d0d0] px-2.5 py-1 text-[11px] font-medium text-black hover:bg-[#fafafa]"
                    >
                      Load CSV map
                    </button>
                    <button
                      type="button"
                      onClick={() => batchInputRef.current?.click()}
                      className="rounded-[3px] border border-[#d0d0d0] px-2.5 py-1 text-[11px] font-medium text-black hover:bg-[#fafafa]"
                    >
                      Select batch files
                    </button>
                    <input ref={batchCsvRef} type="file" accept=".csv,text/csv" onChange={handleBatchCsvChange} className="hidden" />
                    <input ref={batchInputRef} type="file" accept="image/*" multiple onChange={handleBatchFileChange} className="hidden" />
                  </div>
                  <label className="flex items-center gap-2 text-xs text-[#666]">
                    <input type="checkbox" checked={batchAutoLink} onChange={(e) => setBatchAutoLink(e.target.checked)} className="rounded border-[#d0d0d0]" />
                    Auto-link by filename to product slug
                  </label>
                  {batchCsvLoaded && (
                    <div className="flex items-center justify-between rounded-[3px] border border-[#e0e0e0] bg-[#fafafa] px-2 py-1.5 text-[11px] text-[#666]">
                      <span>CSV mapping loaded: {Object.keys(batchCsvMap).length} keys</span>
                      <button type="button" onClick={() => { setBatchCsvMap({}); setBatchCsvLoaded(false); }} className="rounded-[3px] border border-[#d0d0d0] px-2 py-0.5 text-[10px] font-medium text-black hover:bg-white">Clear</button>
                    </div>
                  )}
                  {batchFiles.length > 0 && <p className="text-[11px] text-[#666]">{batchFiles.length} batch files selected</p>}
                  <button
                    type="button"
                    disabled={!batchFiles.length || batchUploading}
                    onClick={handleBatchUpload}
                    className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-xs font-semibold text-black hover:bg-[#fafafa] disabled:opacity-50"
                  >
                    {batchUploading ? "Batch uploading..." : "Run Batch Upload"}
                  </button>
                  {batchReport.length > 0 && (
                    <>
                      <div className="flex items-center justify-between text-[11px] text-[#666]">
                        <span>linked: {batchReport.filter((r) => r.status === "linked").length} | unmatched: {batchReport.filter((r) => r.status === "uploaded_unmatched").length} | failed: {batchReport.filter((r) => r.status === "failed").length}</span>
                        <button type="button" onClick={retryFailedRows} disabled={!batchReport.some((r) => ["failed", "uploaded_unmatched"].includes(r.status))} className="rounded-[3px] border border-[#d0d0d0] px-2 py-1 text-[10px] font-medium text-black hover:bg-[#fafafa] disabled:opacity-40">Retry</button>
                      </div>
                      <div className="max-h-28 overflow-auto rounded-[3px] border border-[#e0e0e0] p-2 text-[11px]">
                        {batchReport.map((r, idx) => (
                          <div key={`${r.fileName}-${idx}`} className="truncate">[{r.status}] {r.fileName}{r.product ? ` -> ${r.product}` : ""}{r.error ? ` (${r.error})` : ""}</div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </details>

              {/* Actions */}
              <div className="flex items-center justify-between pt-2">
                <p className="text-[11px] text-[#999]">
                  {uploadFiles.filter((f) => f.status === "ready").length} ready
                  {uploadFiles.filter((f) => f.status === "done").length > 0 && (
                    <span className="ml-1 text-green-600">{uploadFiles.filter((f) => f.status === "done").length} uploaded</span>
                  )}
                </p>
                <div className="flex gap-2">
                  {uploadFiles.some((f) => f.status === "done") && uploadFiles.every((f) => f.status !== "ready") ? (
                    <button type="button" onClick={() => { setShowUpload(false); setUploadFiles([]); setUploadProductQuery(""); setUploadProductResults([]); setUploadProductId(""); }} className="rounded-[3px] bg-black px-4 py-2 text-xs font-semibold text-white hover:bg-[#222]">
                      Done
                    </button>
                  ) : (
                    <>
                      <button type="button" onClick={() => { setShowUpload(false); setUploadFiles([]); }} className="rounded-[3px] border border-[#d0d0d0] px-4 py-2 text-xs font-medium text-black hover:bg-[#fafafa]">
                        Cancel
                      </button>
                      <button type="submit" disabled={uploadFiles.filter((f) => f.status === "ready").length === 0 || uploading} className="rounded-[3px] bg-black px-4 py-2 text-xs font-semibold text-white hover:bg-[#222] disabled:opacity-50">
                        {uploading ? "Uploading..." : `Upload ${uploadFiles.filter((f) => f.status === "ready").length}`}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </form>

            {/* Image preview lightbox */}
            {uploadPreviewSrc && (
              <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4" onClick={() => setUploadPreviewSrc(null)}>
                <button type="button" onClick={() => setUploadPreviewSrc(null)} className="absolute top-4 right-4 rounded-full bg-white/90 p-2 text-black hover:bg-white z-10">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
                <img src={uploadPreviewSrc} alt="Preview" className="max-h-[85vh] max-w-full rounded object-contain" onClick={(e) => e.stopPropagation()} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Detail Modal ── */}
      {selectedAsset && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center" onClick={(e) => { if (e.target === e.currentTarget) setSelectedAsset(null); }}>
          <div className="bg-white rounded-[3px] shadow-lg w-full max-w-2xl mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-black">Asset Detail</h2>
              <button type="button" onClick={() => setSelectedAsset(null)} className="text-[#999] hover:text-[#666] text-lg leading-none">&times;</button>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Image with focal point */}
              <div>
                <div className="relative aspect-square rounded-[3px] overflow-hidden border border-[#e0e0e0] cursor-crosshair" onClick={handleFocalClick}>
                  <img src={selectedAsset.originalUrl} alt={editAlt} className="h-full w-full object-cover" />
                  {/* Focal point indicator */}
                  <div
                    className="absolute w-6 h-6 rounded-full border-2 border-white shadow-lg bg-blue-500/50 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ left: `${editFocalX * 100}%`, top: `${editFocalY * 100}%` }}
                  />
                </div>
                <p className="mt-2 text-[10px] text-[#999] text-center">
                  Click image to set crop center point
                </p>

                {/* Background Removal */}
                {selectedAsset.mimeType?.startsWith("image/") && (
                  <div className="mt-3 space-y-2">
                    <button
                      type="button"
                      onClick={handleRemoveBg}
                      disabled={bgRemoving}
                      className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-xs font-semibold text-black hover:bg-[#fafafa] disabled:opacity-50"
                    >
                      {bgRemoving ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                          Removing Background...
                        </span>
                      ) : "Remove Background"}
                    </button>

                    {bgRemovedPreview && (
                      <div className="space-y-2">
                        <p className="text-[11px] font-medium text-[#666]">Result Preview</p>
                        <div className="relative aspect-square rounded-[3px] overflow-hidden border border-[#e0e0e0]" style={{ backgroundImage: "linear-gradient(45deg, #eee 25%, transparent 25%), linear-gradient(-45deg, #eee 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #eee 75%), linear-gradient(-45deg, transparent 75%, #eee 75%)", backgroundSize: "16px 16px", backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0px" }}>
                          <img src={bgRemovedPreview} alt="Background removed" className="h-full w-full object-contain" />
                        </div>
                        <button
                          type="button"
                          onClick={handleSaveBgRemoved}
                          disabled={bgSaving}
                          className="w-full rounded-[3px] bg-black px-3 py-2 text-xs font-semibold text-white hover:bg-[#222] disabled:opacity-50"
                        >
                          {bgSaving ? "Saving..." : "Save as New Asset"}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Metadata */}
              <div className="space-y-3">
                <dl className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <dt className="text-[#999]">File</dt>
                    <dd className="text-black truncate max-w-[200px]">{selectedAsset.originalName}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-[#999]">Dimensions</dt>
                    <dd className="text-black">{selectedAsset.widthPx}x{selectedAsset.heightPx}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-[#999]">Size</dt>
                    <dd className="text-black">{formatBytes(selectedAsset.sizeBytes)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-[#999]">Type</dt>
                    <dd className="text-black">{selectedAsset.mimeType}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-[#999]">Status</dt>
                    <dd className="text-black">{selectedAsset.status}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-[#999]">Linked to</dt>
                    <dd className="text-black">{selectedAsset.linkCount || 0} product{(selectedAsset.linkCount || 0) !== 1 ? "s" : ""}</dd>
                  </div>
                </dl>

                <div>
                  <label className="block text-xs font-medium text-[#666] mb-1">Alt Text</label>
                  <input type="text" value={editAlt} onChange={(e) => setEditAlt(e.target.value)} className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-black" />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#666] mb-1">Tags</label>
                  <input type="text" value={editTags} onChange={(e) => setEditTags(e.target.value)} placeholder="Comma-separated tags" className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-black" />
                </div>

                <div className="rounded-[3px] border border-[#e0e0e0] p-3 space-y-2">
                  <label className="block text-xs font-medium text-[#666]">Link This Asset to Product</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={detailProductQuery}
                      onChange={(e) => setDetailProductQuery(e.target.value)}
                      placeholder="Search product name or slug"
                      className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-black"
                    />
                    <button
                      type="button"
                      onClick={() => searchProducts(detailProductQuery, setDetailProductLoading, setDetailProductResults)}
                      className="rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-xs font-medium text-black hover:bg-[#fafafa]"
                    >
                      {detailProductLoading ? "..." : "Find"}
                    </button>
                  </div>
                  {detailProductResults.length > 0 && (
                    <select
                      value={detailProductId}
                      onChange={(e) => setDetailProductId(e.target.value)}
                      className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-black"
                    >
                      <option value="">Select product</option>
                      {detailProductResults.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.slug})
                        </option>
                      ))}
                    </select>
                  )}
                  <button
                    type="button"
                    disabled={!detailProductId || linkingInDetail}
                    onClick={handleDetailLink}
                    className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-xs font-semibold text-black hover:bg-[#fafafa] disabled:opacity-50"
                  >
                    {linkingInDetail ? "Linking..." : "Link to Selected Product"}
                  </button>
                </div>

                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={saveDetail} disabled={savingDetail} className="flex-1 rounded-[3px] bg-black py-2 text-xs font-semibold text-white hover:bg-[#222] disabled:opacity-50">
                    {savingDetail ? "Saving..." : "Save Changes"}
                  </button>
                  <button type="button" onClick={() => { setDeleteTarget(selectedAsset); setSelectedAsset(null); }} className="rounded-[3px] border border-red-200 bg-red-50 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-100">
                    Delete
                  </button>
                  <button type="button" onClick={() => setSelectedAsset(null)} className="rounded-[3px] border border-[#d0d0d0] px-4 py-2 text-xs font-medium text-black hover:bg-[#fafafa]">
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Archive Confirmation ── */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center" onClick={(e) => { if (e.target === e.currentTarget) setDeleteTarget(null); }}>
          <div className="bg-white rounded-[3px] shadow-lg w-full max-w-sm mx-4 p-6">
            <h2 className="text-sm font-semibold text-black mb-2">Archive Asset</h2>
            <p className="text-sm text-[#666] mb-1">
              This will soft-delete the asset. It can be restored later.
            </p>
            <p className="text-xs text-[#999] mb-4 truncate">
              {deleteTarget.originalName}
            </p>
            <div className="flex items-center justify-end gap-2">
              <button type="button" onClick={() => setDeleteTarget(null)} className="rounded-[3px] border border-[#d0d0d0] px-4 py-2 text-xs font-medium text-black hover:bg-[#fafafa]">
                Cancel
              </button>
              <button type="button" onClick={handleArchive} className="rounded-[3px] bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700">
                Archive
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
