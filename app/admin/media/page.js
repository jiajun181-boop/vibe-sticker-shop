"use client";

import { useEffect, useState, useCallback, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";

export default function MediaPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-48 items-center justify-center text-sm text-gray-500">
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

  // Upload modal
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadAlt, setUploadAlt] = useState("");
  const [uploadTags, setUploadTags] = useState("");
  const [uploadPreview, setUploadPreview] = useState(null);
  const fileInputRef = useRef(null);

  // Detail modal
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [editAlt, setEditAlt] = useState("");
  const [editTags, setEditTags] = useState("");
  const [editFocalX, setEditFocalX] = useState(0.5);
  const [editFocalY, setEditFocalY] = useState(0.5);
  const [savingDetail, setSavingDetail] = useState(false);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState(null);

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

  // ── File selection ──
  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadFile(file);
    setUploadPreview(URL.createObjectURL(file));
  }

  // ── Upload asset ──
  async function handleUpload(e) {
    e.preventDefault();
    if (!uploadFile) { showMsg("Select a file first", true); return; }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", uploadFile);
      if (uploadAlt.trim()) formData.append("altText", uploadAlt.trim());
      if (uploadTags.trim()) formData.append("tags", uploadTags.trim());

      const res = await fetch("/api/admin/assets", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        showMsg(data.error || "Upload failed", true);
        return;
      }

      if (data.deduplicated) {
        showMsg(`Duplicate detected — existing asset reused (${data.asset.originalName})`);
      } else {
        showMsg("Asset uploaded successfully");
      }

      setShowUpload(false);
      setUploadFile(null);
      setUploadAlt("");
      setUploadTags("");
      setUploadPreview(null);
      fetchAssets();
    } catch (err) {
      console.error("Upload error:", err);
      showMsg("Upload failed", true);
    } finally {
      setUploading(false);
    }
  }

  // ── Open detail ──
  async function openDetail(asset) {
    setSelectedAsset(asset);
    setEditAlt(asset.altText || "");
    setEditTags((asset.tags || []).join(", "));
    setEditFocalX(asset.focalX ?? 0.5);
    setEditFocalY(asset.focalY ?? 0.5);
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

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Media Library</h1>
        <button
          type="button"
          onClick={() => setShowUpload(true)}
          className="rounded-lg bg-gray-900 px-4 py-2 text-xs font-semibold text-white hover:bg-black"
        >
          + Upload Asset
        </button>
      </div>

      {/* Toast */}
      {message && (
        <div className={`rounded-lg px-4 py-3 text-sm font-medium ${message.isError ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"}`}>
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
        <button
          type="button"
          onClick={() => setTab("assets")}
          className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${tab === "assets" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
        >
          Asset Library
        </button>
        <button
          type="button"
          onClick={() => setTab("legacy")}
          className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${tab === "legacy" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
        >
          Legacy Images
        </button>
      </div>

      {/* Search & Filters */}
      <div className="flex gap-2 flex-wrap">
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={tab === "assets" ? "Search by name, alt text..." : "Search by alt text or product..."}
            className="w-72 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900"
          />
          <button type="submit" className="rounded-lg bg-gray-900 px-4 py-2 text-xs font-semibold text-white hover:bg-black">
            Search
          </button>
        </form>
        {tab === "assets" && (
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none"
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
            className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100"
          >
            Clear
          </button>
        )}
      </div>

      {/* ── Assets Grid ── */}
      {tab === "assets" && (
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          {loading ? (
            <div className="flex h-48 items-center justify-center text-sm text-gray-500">Loading...</div>
          ) : assets.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center gap-2 text-sm text-gray-500">
              <p>No assets found</p>
              <button type="button" onClick={() => setShowUpload(true)} className="text-xs text-blue-600 hover:underline">
                Upload your first asset
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {assets.map((asset) => (
                <div
                  key={asset.id}
                  className="rounded-lg overflow-hidden border border-gray-200 group relative cursor-pointer"
                  onClick={() => openDetail(asset)}
                >
                  <div className="aspect-square relative bg-gray-50">
                    <img src={asset.originalUrl} alt={asset.altText || ""} className="h-full w-full object-cover" />
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2.5">
                      <div className="flex justify-between items-start">
                        <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                          asset.status === "published" ? "bg-green-500/80 text-white" :
                          asset.status === "archived" ? "bg-gray-500/80 text-white" :
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
                        <p className="text-[10px] text-white/70">
                          {asset.widthPx}x{asset.heightPx} · {formatBytes(asset.sizeBytes)} · {asset.linkCount || 0} links
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Legacy Grid ── */}
      {tab === "legacy" && (
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          {loading ? (
            <div className="flex h-48 items-center justify-center text-sm text-gray-500">Loading...</div>
          ) : legacyImages.length === 0 ? (
            <div className="flex h-48 items-center justify-center text-sm text-gray-500">No legacy images found</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {legacyImages.map((image) => (
                <div key={image.id} className="rounded-lg overflow-hidden border border-gray-200 group relative">
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
                        {image.product && <p className="text-xs text-white/70 truncate">{image.product.name}</p>}
                      </div>
                    </div>
                  </div>
                  {image.product && (
                    <div className="px-2 py-1.5">
                      <Link href={`/admin/products/${image.product.id}`} className="text-xs text-gray-600 hover:text-blue-600 truncate block">
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
          <p className="text-xs text-gray-500">
            Showing {(pagination.page - 1) * pagination.limit + 1}-
            {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
          </p>
          <div className="flex gap-1">
            <button type="button" disabled={page <= 1} onClick={() => updateParams({ page: String(page - 1) })} className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-40">
              Previous
            </button>
            <button type="button" disabled={page >= pagination.totalPages} onClick={() => updateParams({ page: String(page + 1) })} className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-40">
              Next
            </button>
          </div>
        </div>
      )}

      {/* ── Upload Modal ── */}
      {showUpload && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={(e) => { if (e.target === e.currentTarget) setShowUpload(false); }}>
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-900">Upload Asset</h2>
              <button type="button" onClick={() => setShowUpload(false)} className="text-gray-400 hover:text-gray-600 text-lg leading-none">&times;</button>
            </div>

            <form onSubmit={handleUpload} className="space-y-4">
              {/* Drop zone */}
              <div
                className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 p-6 cursor-pointer hover:border-gray-400 transition-colors"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files?.[0];
                  if (file) { setUploadFile(file); setUploadPreview(URL.createObjectURL(file)); }
                }}
              >
                {uploadPreview ? (
                  <img src={uploadPreview} alt="Preview" className="h-32 w-32 rounded-lg object-cover" />
                ) : (
                  <>
                    <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                    </svg>
                    <p className="text-xs text-gray-500">Drop image or click to browse</p>
                    <p className="text-[10px] text-gray-400">JPEG, PNG, WebP, SVG, AVIF (max 20MB)</p>
                  </>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              </div>

              {uploadFile && (
                <p className="text-xs text-gray-500 truncate">
                  {uploadFile.name} ({formatBytes(uploadFile.size)})
                </p>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Alt Text</label>
                <input type="text" value={uploadAlt} onChange={(e) => setUploadAlt(e.target.value)} placeholder="Describe the image..." className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900" />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Tags (comma-separated)</label>
                <input type="text" value={uploadTags} onChange={(e) => setUploadTags(e.target.value)} placeholder="product, banner, hero..." className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900" />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowUpload(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100">
                  Cancel
                </button>
                <button type="submit" disabled={!uploadFile || uploading} className="rounded-lg bg-gray-900 px-4 py-2 text-xs font-semibold text-white hover:bg-black disabled:opacity-50">
                  {uploading ? "Uploading..." : "Upload"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Detail Modal ── */}
      {selectedAsset && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={(e) => { if (e.target === e.currentTarget) setSelectedAsset(null); }}>
          <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-900">Asset Detail</h2>
              <button type="button" onClick={() => setSelectedAsset(null)} className="text-gray-400 hover:text-gray-600 text-lg leading-none">&times;</button>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Image with focal point */}
              <div>
                <div className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 cursor-crosshair" onClick={handleFocalClick}>
                  <img src={selectedAsset.originalUrl} alt={editAlt} className="h-full w-full object-cover" />
                  {/* Focal point indicator */}
                  <div
                    className="absolute w-6 h-6 rounded-full border-2 border-white shadow-lg bg-blue-500/50 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ left: `${editFocalX * 100}%`, top: `${editFocalY * 100}%` }}
                  />
                </div>
                <p className="mt-2 text-[10px] text-gray-400 text-center">
                  Click to set focal point ({editFocalX.toFixed(2)}, {editFocalY.toFixed(2)})
                </p>
              </div>

              {/* Metadata */}
              <div className="space-y-3">
                <dl className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <dt className="text-gray-500">File</dt>
                    <dd className="text-gray-900 truncate max-w-[200px]">{selectedAsset.originalName}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Dimensions</dt>
                    <dd className="text-gray-900">{selectedAsset.widthPx}x{selectedAsset.heightPx}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Size</dt>
                    <dd className="text-gray-900">{formatBytes(selectedAsset.sizeBytes)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Type</dt>
                    <dd className="text-gray-900">{selectedAsset.mimeType}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Status</dt>
                    <dd className="text-gray-900">{selectedAsset.status}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Links</dt>
                    <dd className="text-gray-900">{selectedAsset.linkCount || 0} usages</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">SHA256</dt>
                    <dd className="text-gray-900 font-mono text-[10px] truncate max-w-[200px]" title={selectedAsset.sha256}>{selectedAsset.sha256}</dd>
                  </div>
                </dl>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Alt Text</label>
                  <input type="text" value={editAlt} onChange={(e) => setEditAlt(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900" />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Tags</label>
                  <input type="text" value={editTags} onChange={(e) => setEditTags(e.target.value)} placeholder="Comma-separated tags" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900" />
                </div>

                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={saveDetail} disabled={savingDetail} className="flex-1 rounded-lg bg-gray-900 py-2 text-xs font-semibold text-white hover:bg-black disabled:opacity-50">
                    {savingDetail ? "Saving..." : "Save Changes"}
                  </button>
                  <button type="button" onClick={() => setSelectedAsset(null)} className="rounded-lg border border-gray-300 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100">
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
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={(e) => { if (e.target === e.currentTarget) setDeleteTarget(null); }}>
          <div className="bg-white rounded-xl shadow-lg w-full max-w-sm mx-4 p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-2">Archive Asset</h2>
            <p className="text-sm text-gray-600 mb-1">
              This will soft-delete the asset. It can be restored later.
            </p>
            <p className="text-xs text-gray-400 mb-4 truncate">
              {deleteTarget.originalName}
            </p>
            <div className="flex items-center justify-end gap-2">
              <button type="button" onClick={() => setDeleteTarget(null)} className="rounded-lg border border-gray-300 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100">
                Cancel
              </button>
              <button type="button" onClick={handleArchive} className="rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700">
                Archive
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
