"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
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

  const [images, setImages] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [message, setMessage] = useState(null);

  // Add image modal
  const [showModal, setShowModal] = useState(false);
  const [modalUrl, setModalUrl] = useState("");
  const [modalAlt, setModalAlt] = useState("");
  const [modalProductId, setModalProductId] = useState("");
  const [products, setProducts] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState(null);

  const page = parseInt(searchParams.get("page") || "1");

  const fetchImages = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", "40");
    if (search) params.set("search", search);

    try {
      const res = await fetch(`/api/admin/media?${params}`);
      const data = await res.json();
      setImages(data.images || []);
      setPagination(data.pagination || null);
    } catch (err) {
      console.error("Failed to load images:", err);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  // Fetch products for dropdown when modal opens
  useEffect(() => {
    if (showModal && products.length === 0) {
      fetch("/api/admin/products?limit=100")
        .then((res) => res.json())
        .then((data) => setProducts(data.products || []))
        .catch((err) => console.error("Failed to load products:", err));
    }
  }, [showModal, products.length]);

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

  function openModal() {
    setModalUrl("");
    setModalAlt("");
    setModalProductId("");
    setShowModal(true);
  }

  async function handleAdd(e) {
    e.preventDefault();
    if (!modalUrl.trim()) {
      showMsg("Image URL is required", true);
      return;
    }
    if (!modalProductId) {
      showMsg("Please select a product", true);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: modalUrl.trim(),
          alt: modalAlt.trim() || undefined,
          productId: modalProductId,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        showMsg(data.error || "Failed to add image", true);
        return;
      }
      setShowModal(false);
      showMsg("Image added successfully");
      fetchImages();
    } catch (err) {
      console.error("Failed to add image:", err);
      showMsg("Failed to add image", true);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/admin/media?id=${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        showMsg(data.error || "Failed to delete image", true);
        return;
      }
      showMsg("Image deleted");
      fetchImages();
    } catch (err) {
      console.error("Failed to delete image:", err);
      showMsg("Failed to delete image", true);
    } finally {
      setDeleteTarget(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Media Library</h1>
        <button
          type="button"
          onClick={openModal}
          className="rounded-lg bg-gray-900 px-4 py-2 text-xs font-semibold text-white hover:bg-black"
        >
          + Add Image
        </button>
      </div>

      {/* Toast */}
      {message && (
        <div
          className={`rounded-lg px-4 py-3 text-sm font-medium ${
            message.isError
              ? "bg-red-50 text-red-600"
              : "bg-green-50 text-green-600"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by alt text or product name..."
          className="w-72 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900"
        />
        <button
          type="submit"
          className="rounded-lg bg-gray-900 px-4 py-2 text-xs font-semibold text-white hover:bg-black"
        >
          Search
        </button>
        {searchParams.get("search") && (
          <button
            type="button"
            onClick={() => {
              setSearch("");
              updateParams({ search: null, page: "1" });
            }}
            className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100"
          >
            Clear
          </button>
        )}
      </form>

      {/* Image Grid */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        {loading ? (
          <div className="flex h-48 items-center justify-center text-sm text-gray-500">
            Loading...
          </div>
        ) : images.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center gap-2 text-sm text-gray-500">
            <p>No images found</p>
            {searchParams.get("search") && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  updateParams({ search: null, page: "1" });
                }}
                className="text-xs text-blue-600 hover:underline"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {images.map((image) => (
              <div
                key={image.id}
                className="rounded-lg overflow-hidden border border-gray-200 group relative"
              >
                {/* Thumbnail */}
                <div className="aspect-square relative">
                  <img
                    src={image.url}
                    alt={image.alt || ""}
                    className="h-full w-full object-cover"
                  />

                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2.5">
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(image)}
                        className="flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white text-xs font-bold hover:bg-red-600"
                      >
                        X
                      </button>
                    </div>
                    <div className="space-y-1">
                      {image.alt && (
                        <p className="text-xs text-white/90 leading-tight line-clamp-2">
                          {image.alt}
                        </p>
                      )}
                      {image.product && (
                        <p className="text-xs text-white/70 truncate">
                          {image.product.name}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Product name below image */}
                {image.product && (
                  <div className="px-2 py-1.5">
                    <Link
                      href={`/admin/products/${image.product.id}`}
                      className="text-xs text-gray-600 hover:text-blue-600 truncate block"
                    >
                      {image.product.name}
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-500">
            Showing {(pagination.page - 1) * pagination.limit + 1}-
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
            {pagination.total}
          </p>
          <div className="flex gap-1">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => updateParams({ page: String(page - 1) })}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page >= pagination.totalPages}
              onClick={() => updateParams({ page: String(page + 1) })}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Add Image Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowModal(false);
          }}
        >
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-900">
                Add Image
              </h2>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 text-lg leading-none"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAdd} className="space-y-4">
              {/* URL */}
              <div>
                <label
                  htmlFor="modal-url"
                  className="block text-xs font-medium text-gray-600 mb-1"
                >
                  Image URL *
                </label>
                <input
                  id="modal-url"
                  type="text"
                  value={modalUrl}
                  onChange={(e) => setModalUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900"
                />
              </div>

              {/* Alt text */}
              <div>
                <label
                  htmlFor="modal-alt"
                  className="block text-xs font-medium text-gray-600 mb-1"
                >
                  Alt Text
                </label>
                <input
                  id="modal-alt"
                  type="text"
                  value={modalAlt}
                  onChange={(e) => setModalAlt(e.target.value)}
                  placeholder="Describe the image..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900"
                />
              </div>

              {/* Product selector */}
              <div>
                <label
                  htmlFor="modal-product"
                  className="block text-xs font-medium text-gray-600 mb-1"
                >
                  Product *
                </label>
                <select
                  id="modal-product"
                  value={modalProductId}
                  onChange={(e) => setModalProductId(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900"
                >
                  <option value="">Select a product...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Preview */}
              {modalUrl.trim() && (
                <div>
                  <p className="text-xs font-medium text-gray-600 mb-1">
                    Preview
                  </p>
                  <div className="w-24 h-24 rounded-lg border border-gray-200 overflow-hidden">
                    <img
                      src={modalUrl.trim()}
                      alt="Preview"
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        e.target.style.display = "none";
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-gray-900 px-4 py-2 text-xs font-semibold text-white hover:bg-black disabled:opacity-50"
                >
                  {submitting ? "Adding..." : "Add Image"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteTarget && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center"
          onClick={(e) => {
            if (e.target === e.currentTarget) setDeleteTarget(null);
          }}
        >
          <div className="bg-white rounded-xl shadow-lg w-full max-w-sm mx-4 p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-2">
              Delete Image
            </h2>
            <p className="text-sm text-gray-600 mb-1">
              Are you sure you want to delete this image?
            </p>
            {deleteTarget.alt && (
              <p className="text-xs text-gray-400 mb-4 truncate">
                &ldquo;{deleteTarget.alt}&rdquo;
              </p>
            )}
            {!deleteTarget.alt && <div className="mb-4" />}
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
