"use client";

import { useEffect, useState } from "react";

const STATUS_COLORS = {
  submitted: "bg-blue-50 text-blue-700",
  under_review: "bg-yellow-50 text-yellow-700",
  approved: "bg-green-50 text-green-700",
  denied: "bg-red-50 text-red-700",
  fulfilled: "bg-emerald-50 text-emerald-700",
};

const ISSUE_TYPES = [
  { value: "defective", label: "Defective Product" },
  { value: "damaged", label: "Damaged in Shipping" },
  { value: "wrong_item", label: "Wrong Item Received" },
  { value: "quality", label: "Quality Issue" },
  { value: "other", label: "Other" },
];

function formatStatus(status) {
  return (status || "").replace(/_/g, " ");
}

export default function WarrantyClaimsPage() {
  const [claims, setClaims] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form state
  const [orderId, setOrderId] = useState("");
  const [issueType, setIssueType] = useState("");
  const [description, setDescription] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [photoUrls, setPhotoUrls] = useState([]);

  useEffect(() => {
    loadClaims();
    loadOrders();
  }, []);

  async function loadClaims() {
    try {
      const res = await fetch("/api/account/warranty");
      const data = await res.json();
      setClaims(data.claims || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  async function loadOrders() {
    try {
      const res = await fetch("/api/account/orders?limit=50");
      const data = await res.json();
      setOrders(data.orders || []);
    } catch {
      // silent
    }
  }

  function addPhoto() {
    const url = photoUrl.trim();
    if (url && !photoUrls.includes(url)) {
      setPhotoUrls((prev) => [...prev, url]);
      setPhotoUrl("");
    }
  }

  function removePhoto(url) {
    setPhotoUrls((prev) => prev.filter((u) => u !== url));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!orderId || !issueType || !description.trim()) return;

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/account/warranty", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          issueType,
          description: description.trim(),
          photoUrls,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to submit claim");
        return;
      }

      setClaims((prev) => [data.claim, ...prev]);
      setShowNew(false);
      setOrderId("");
      setIssueType("");
      setDescription("");
      setPhotoUrls([]);
      setPhotoUrl("");
      setSuccess(`Warranty claim ${data.claim.claimNumber} submitted successfully.`);
    } catch {
      setError("Failed to submit warranty claim. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-[var(--color-gray-900)]">
          Warranty Claims
        </h1>
        <button
          type="button"
          onClick={() => {
            setShowNew(!showNew);
            setError("");
            setSuccess("");
          }}
          className="rounded-lg bg-[var(--color-gray-900)] px-4 py-2 text-sm font-semibold text-[#fff] hover:bg-black transition-colors"
        >
          {showNew ? "Cancel" : "New Claim"}
        </button>
      </div>

      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      )}

      {/* New Claim Form */}
      {showNew && (
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-xl border border-[var(--color-gray-200)] p-4"
        >
          {error && <p className="text-sm text-red-600">{error}</p>}

          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--color-gray-500)]">
              Order
            </label>
            <select
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              className="w-full rounded-lg border border-[var(--color-gray-200)] px-3 py-2 text-sm text-[var(--color-gray-900)] focus:border-[var(--color-gray-400)] focus:outline-none"
              required
            >
              <option value="">Select an order...</option>
              {orders.map((order) => (
                <option key={order.id} value={order.id}>
                  #{order.id.slice(0, 8)} &mdash;{" "}
                  {new Date(order.createdAt).toLocaleDateString("en-CA", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--color-gray-500)]">
              Issue Type
            </label>
            <select
              value={issueType}
              onChange={(e) => setIssueType(e.target.value)}
              className="w-full rounded-lg border border-[var(--color-gray-200)] px-3 py-2 text-sm text-[var(--color-gray-900)] focus:border-[var(--color-gray-400)] focus:outline-none"
              required
            >
              <option value="">Select issue type...</option>
              {ISSUE_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--color-gray-500)]">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Please describe the issue in detail..."
              rows={4}
              className="w-full rounded-lg border border-[var(--color-gray-200)] px-3 py-2 text-sm text-[var(--color-gray-900)] placeholder:text-[var(--color-gray-400)] focus:border-[var(--color-gray-400)] focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--color-gray-500)]">
              Photo URLs (optional)
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                placeholder="https://example.com/photo.jpg"
                className="flex-1 rounded-lg border border-[var(--color-gray-200)] px-3 py-2 text-sm text-[var(--color-gray-900)] placeholder:text-[var(--color-gray-400)] focus:border-[var(--color-gray-400)] focus:outline-none"
              />
              <button
                type="button"
                onClick={addPhoto}
                disabled={!photoUrl.trim()}
                className="rounded-lg border border-[var(--color-gray-200)] px-3 py-2 text-sm font-medium text-[var(--color-gray-700)] hover:bg-[var(--color-gray-50)] disabled:opacity-40 transition-colors"
              >
                Add
              </button>
            </div>
            {photoUrls.length > 0 && (
              <div className="mt-2 space-y-1">
                {photoUrls.map((url) => (
                  <div
                    key={url}
                    className="flex items-center gap-2 rounded-lg bg-[var(--color-gray-50)] px-3 py-1.5 text-xs text-[var(--color-gray-700)]"
                  >
                    <span className="min-w-0 flex-1 truncate">{url}</span>
                    <button
                      type="button"
                      onClick={() => removePhoto(url)}
                      className="shrink-0 text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-[var(--color-gray-900)] px-6 py-2.5 text-sm font-semibold text-[#fff] hover:bg-black disabled:opacity-50 transition-colors"
          >
            {submitting ? "Submitting..." : "Submit Claim"}
          </button>
        </form>
      )}

      {/* Claims List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-xl bg-[var(--color-gray-100)]"
            />
          ))}
        </div>
      ) : claims.length === 0 ? (
        <div className="rounded-xl border border-[var(--color-gray-200)] p-8 text-center">
          <p className="text-sm text-[var(--color-gray-500)]">
            No warranty claims yet.
          </p>
          <p className="mt-1 text-xs text-[var(--color-gray-400)]">
            If you received a defective or damaged product, click &ldquo;New
            Claim&rdquo; above to submit a warranty claim.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-[var(--color-gray-100)] rounded-xl border border-[var(--color-gray-200)]">
          {claims.map((claim) => (
            <div
              key={claim.id}
              className="px-4 py-4 hover:bg-[var(--color-gray-50)] transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-[var(--color-gray-900)]">
                      {claim.claimNumber}
                    </p>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase ${
                        STATUS_COLORS[claim.status] ||
                        "bg-[var(--color-gray-100)] text-[var(--color-gray-500)]"
                      }`}
                    >
                      {formatStatus(claim.status)}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-[var(--color-gray-500)]">
                    Order #{claim.orderId?.slice(0, 8)} &bull;{" "}
                    {ISSUE_TYPES.find((t) => t.value === claim.issueType)?.label ||
                      claim.issueType}{" "}
                    &bull;{" "}
                    {new Date(claim.createdAt).toLocaleDateString("en-CA", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                  <p className="mt-1.5 text-sm text-[var(--color-gray-700)] line-clamp-2">
                    {claim.description}
                  </p>

                  {claim.photoUrls?.length > 0 && (
                    <p className="mt-1 text-xs text-[var(--color-gray-400)]">
                      {claim.photoUrls.length} photo{claim.photoUrls.length !== 1 ? "s" : ""} attached
                    </p>
                  )}

                  {claim.resolution && (
                    <div className="mt-2 rounded-lg bg-[var(--color-gray-50)] px-3 py-2">
                      <p className="text-xs font-medium text-[var(--color-gray-700)]">
                        Resolution: <span className="capitalize">{claim.resolution}</span>
                      </p>
                      {claim.resolutionNote && (
                        <p className="mt-0.5 text-xs text-[var(--color-gray-500)]">
                          {claim.resolutionNote}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
