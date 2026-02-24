"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CATALOG_DEFAULTS } from "@/lib/catalogConfig";
import { resizeImageFile } from "@/lib/client-image-resize";

const categoryMeta = CATALOG_DEFAULTS.categoryMeta;
const CATEGORY_ORDER = [
  "marketing-business-print",
  "stickers-labels-decals",
  "signs-rigid-boards",
  "banners-displays",
  "canvas-prints",
  "windows-walls-floors",
  "vehicle-graphics-fleet",
];

function filenameToAlt(name) {
  return String(name || "")
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

export default function ImageDashboardPage() {
  const [products, setProducts] = useState([]);
  const [stats, setStats] = useState({ total: 0, withImages: 0, missingImages: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState({});
  const [uploading, setUploading] = useState({}); // productId -> true
  const [justUploaded, setJustUploaded] = useState({}); // productId -> true (brief green flash)
  const fileRefs = useRef({}); // productId -> input ref

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/image-dashboard");
      if (!res.ok) return;
      const data = await res.json();
      setProducts(data.products);
      setStats(data.stats);

      // Auto-expand categories with missing images
      const grouped = {};
      for (const p of data.products) {
        const cat = p.category || "other";
        if (!grouped[cat]) grouped[cat] = { missing: 0 };
        if (p.imageCount === 0) grouped[cat].missing++;
      }
      const autoExpand = {};
      for (const [cat, info] of Object.entries(grouped)) {
        if (info.missing > 0) autoExpand[cat] = true;
      }
      setExpanded(autoExpand);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = search.trim()
    ? products.filter((p) => {
        const q = search.toLowerCase();
        return p.name.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q);
      })
    : products;

  // Group by category
  const grouped = {};
  for (const p of filtered) {
    const cat = p.category || "other";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(p);
  }

  // Order categories
  const orderedCategories = [
    ...CATEGORY_ORDER.filter((c) => grouped[c]),
    ...Object.keys(grouped).filter((c) => !CATEGORY_ORDER.includes(c)),
  ];

  const toggleCategory = (cat) => {
    setExpanded((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  async function handleUpload(e, product) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const ref = fileRefs.current[product.id];
    if (ref) ref.value = "";

    setUploading((prev) => ({ ...prev, [product.id]: true }));

    try {
      let lastUrl = null;
      for (const rawFile of files) {
        const file = await resizeImageFile(rawFile);
        const formData = new FormData();
        formData.append("file", file);
        formData.append("altText", product.name || filenameToAlt(file.name));
        formData.append("tags", "product");

        const uploadRes = await fetch("/api/admin/assets", { method: "POST", body: formData });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadData.error || "Upload failed");

        const asset = uploadData.asset;
        lastUrl = asset.originalUrl;

        await fetch(`/api/admin/assets/${asset.id}/links`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ entityType: "product", entityId: product.id, purpose: "gallery" }),
        });

        await fetch(`/api/admin/products/${product.id}/images`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: asset.originalUrl, alt: asset.altText }),
        });
      }

      // Update local state with actual thumbnail
      setProducts((prev) =>
        prev.map((p) =>
          p.id === product.id
            ? { ...p, imageCount: p.imageCount + files.length, thumbnailUrl: lastUrl || p.thumbnailUrl }
            : p
        )
      );
      setStats((prev) => ({
        ...prev,
        withImages: prev.withImages + (product.imageCount === 0 ? 1 : 0),
        missingImages: prev.missingImages - (product.imageCount === 0 ? 1 : 0),
      }));

      // Brief green highlight
      setJustUploaded((prev) => ({ ...prev, [product.id]: true }));
      setTimeout(() => setJustUploaded((prev) => { const n = { ...prev }; delete n[product.id]; return n; }), 3000);
    } catch (err) {
      alert("Upload failed: " + (err.message || "Unknown error"));
    } finally {
      setUploading((prev) => ({ ...prev, [product.id]: false }));
    }
  }

  function getCategoryLabel(cat) {
    return categoryMeta[cat]?.title || cat.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }

  function getCategoryIcon(cat) {
    return categoryMeta[cat]?.icon || "\uD83D\uDCE6";
  }

  function getMissingCount(cat) {
    return (grouped[cat] || []).filter((p) => p.imageCount === 0).length;
  }

  function getProductUrl(product) {
    const cat = product.category || "other";
    return `/shop/${cat}/${product.slug}`;
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-lg font-bold text-[#111]">Image Dashboard</h1>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-[2px] border border-[#e0e0e0] bg-white" />
          ))}
        </div>
        <div className="h-10 animate-pulse rounded-[3px] border border-[#e0e0e0] bg-white" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 animate-pulse rounded-[2px] border border-[#e0e0e0] bg-white" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold text-[#111]">Image Dashboard</h1>

      {/* Stats bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-[2px] border border-[#e0e0e0] bg-white px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#999]">Total Products</p>
          <p className="mt-1 text-2xl font-bold text-[#111]">{stats.total}</p>
        </div>
        <div className="rounded-[2px] border border-[#e0e0e0] bg-white px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600">With Images</p>
          <p className="mt-1 text-2xl font-bold text-emerald-700">{stats.withImages}</p>
        </div>
        <div className="rounded-[2px] border border-[#e0e0e0] bg-white px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-red-600">Missing Images</p>
          <p className="mt-1 text-2xl font-bold text-red-700">{stats.missingImages}</p>
        </div>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Filter by product name or slug..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full rounded-[3px] border border-[#d0d0d0] bg-white px-3 py-2 text-sm outline-none focus:border-black"
      />

      {/* Category accordion */}
      <div className="space-y-2">
        {orderedCategories.map((cat) => {
          const items = grouped[cat] || [];
          const missing = getMissingCount(cat);
          const isOpen = expanded[cat];

          return (
            <div key={cat} className="rounded-[2px] border border-[#e0e0e0] bg-white">
              <button
                type="button"
                onClick={() => toggleCategory(cat)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-semibold text-[#111] hover:bg-[#fafafa]"
              >
                <span className="text-base">{getCategoryIcon(cat)}</span>
                <span className="flex-1">{getCategoryLabel(cat)}</span>
                <span className="rounded-full bg-[#f0f0f0] px-2 py-0.5 text-xs font-medium text-[#666]">
                  {items.length}
                </span>
                {missing > 0 && (
                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                    {missing} missing
                  </span>
                )}
                <svg
                  className={`h-4 w-4 text-[#999] transition-transform ${isOpen ? "rotate-180" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </button>

              {isOpen && (
                <div className="border-t border-[#f0f0f0]">
                  {items.map((product) => {
                    const uploaded = justUploaded[product.id];
                    return (
                    <div
                      key={product.id}
                      className={`flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-3 px-4 py-2.5 text-sm transition-colors duration-700 ${
                        uploaded
                          ? "border-l-2 border-l-emerald-500 bg-emerald-50"
                          : product.imageCount === 0
                            ? "border-l-2 border-l-red-400 bg-red-50"
                            : "border-l-2 border-l-transparent hover:bg-[#fafafa]"
                      }`}
                    >
                      {/* Thumbnail */}
                      <div className="h-10 w-10 shrink-0 overflow-hidden rounded bg-[#f5f5f5]">
                        {product.thumbnailUrl && product.thumbnailUrl !== "uploaded" ? (
                          <img
                            src={product.thumbnailUrl}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[#ccc]">
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                            </svg>
                          </div>
                        )}
                      </div>

                      {/* Name + slug */}
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-[#111]">{product.name}</p>
                        <p className="truncate font-mono text-xs text-[#999]">{product.slug}</p>
                      </div>

                      {/* Image count badge */}
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${
                          product.imageCount === 0
                            ? "bg-red-100 text-red-700"
                            : "bg-emerald-50 text-emerald-700"
                        }`}
                      >
                        {product.imageCount} {product.imageCount === 1 ? "image" : "images"}
                      </span>

                      {/* Action buttons — full-width row on mobile, inline on desktop */}
                      <div className="flex w-full sm:w-auto items-center gap-2">
                        {/* Upload */}
                        <div className="flex-1 sm:flex-initial">
                          <input
                            ref={(el) => { fileRefs.current[product.id] = el; }}
                            type="file"
                            accept="image/*"
                            capture="environment"
                            multiple
                            className="hidden"
                            onChange={(e) => handleUpload(e, product)}
                          />
                          <button
                            type="button"
                            onClick={() => fileRefs.current[product.id]?.click()}
                            disabled={uploading[product.id]}
                            className="h-11 sm:h-auto w-full sm:w-auto rounded-[3px] bg-teal-600 px-2.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-teal-700 disabled:opacity-50"
                          >
                            {uploading[product.id] ? "Uploading..." : "Upload"}
                          </button>
                        </div>

                        {/* View on Site */}
                        <a
                          href={getProductUrl(product)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex h-11 sm:h-auto flex-1 sm:flex-initial items-center justify-center rounded-[3px] border border-[#e0e0e0] px-2.5 py-1.5 text-xs font-medium text-[#666] transition-colors hover:border-[#000] hover:text-black"
                        >
                          View
                        </a>

                        {/* Edit link */}
                        <Link
                          href={`/admin/products/${product.id}`}
                          className="flex h-11 sm:h-auto flex-1 sm:flex-initial items-center justify-center rounded-[3px] border border-[#e0e0e0] px-2.5 py-1.5 text-xs font-medium text-[#4f46e5] transition-colors hover:border-[#4f46e5]"
                        >
                          Edit
                        </Link>
                      </div>
                    </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {orderedCategories.length === 0 && (
          <p className="py-8 text-center text-sm text-[#999]">
            {search ? "No products match your search." : "No products found."}
          </p>
        )}
      </div>
    </div>
  );
}
