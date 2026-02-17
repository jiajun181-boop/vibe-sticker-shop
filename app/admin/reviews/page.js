"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

const filterTabs = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
];

function StarDisplay({ rating, size = 14 }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <svg
          key={i}
          width={size}
          height={size}
          viewBox="0 0 20 20"
          fill="currentColor"
          className={i < rating ? "text-amber-400" : "text-[#d0d0d0]"}
          aria-hidden="true"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-CA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function ReviewsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-48 items-center justify-center text-sm text-[#999]">
          Loading...
        </div>
      }
    >
      <ReviewsContent />
    </Suspense>
  );
}

function ReviewsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [reviews, setReviews] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState(
    searchParams.get("filter") || "all"
  );
  const [message, setMessage] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const page = parseInt(searchParams.get("page") || "1");

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", "20");
    if (activeFilter !== "all") params.set("filter", activeFilter);

    try {
      const res = await fetch(`/api/admin/reviews?${params}`);
      const data = await res.json();
      setReviews(data.reviews || []);
      setPagination(data.pagination || null);
    } catch (err) {
      console.error("Failed to load reviews:", err);
    } finally {
      setLoading(false);
    }
  }, [page, activeFilter]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  function updateParams(updates) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    router.push(`/admin/reviews?${params}`);
  }

  function showMsg(text, isError = false) {
    setMessage({ text, isError });
    setTimeout(() => setMessage(null), 3000);
  }

  async function handleAction(reviewId, action) {
    setActionLoading(reviewId);
    try {
      const res = await fetch("/api/admin/reviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: reviewId, action }),
      });
      const data = await res.json();

      if (!res.ok) {
        showMsg(data.error || `Failed to ${action} review`, true);
      } else {
        showMsg(
          action === "approve"
            ? "Review approved"
            : "Review deleted"
        );
        fetchReviews();
      }
    } catch {
      showMsg("Network error", true);
    } finally {
      setActionLoading(null);
    }
  }

  function handleDelete(reviewId) {
    if (!confirm("Delete this review? This cannot be undone.")) return;
    handleAction(reviewId, "reject");
  }

  const totalCount = pagination?.total ?? reviews.length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-black">
          Reviews
          {totalCount > 0 && (
            <span className="ml-2 text-sm font-normal text-[#999]">
              ({totalCount})
            </span>
          )}
        </h1>
      </div>

      {/* Toast */}
      {message && (
        <div
          className={`rounded-[3px] px-4 py-3 text-sm font-medium ${
            message.isError
              ? "bg-red-50 text-red-600"
              : "bg-green-50 text-green-600"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-1">
        {filterTabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => {
              setActiveFilter(tab.value);
              updateParams({
                filter: tab.value === "all" ? null : tab.value,
                page: "1",
              });
            }}
            className={`rounded-[3px] px-3 py-1.5 text-xs font-medium transition-colors ${
              activeFilter === tab.value
                ? "bg-black text-white"
                : "bg-white text-[#666] border border-[#e0e0e0] hover:border-black hover:text-black"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Reviews List */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex h-48 items-center justify-center rounded-[3px] border border-[#e0e0e0] bg-white text-sm text-[#999]">
            Loading...
          </div>
        ) : reviews.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center rounded-[3px] border border-[#e0e0e0] bg-white text-sm text-[#999]">
            <p>No reviews found</p>
            {activeFilter !== "all" && (
              <button
                type="button"
                onClick={() => {
                  setActiveFilter("all");
                  updateParams({ filter: null, page: "1" });
                }}
                className="mt-2 text-xs text-black underline hover:no-underline"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          reviews.map((review) => (
            <div
              key={review.id}
              className="rounded-[3px] border border-[#e0e0e0] bg-white p-4 transition-colors hover:border-[#ccc]"
            >
              {/* Top row: stars + status + product */}
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <StarDisplay rating={review.rating} />
                  {review.status === "pending" && (
                    <span className="inline-block rounded-[2px] bg-yellow-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-yellow-800">
                      Pending
                    </span>
                  )}
                  {review.status === "approved" && (
                    <span className="inline-block rounded-[2px] bg-green-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-green-700">
                      Approved
                    </span>
                  )}
                </div>
                <span className="text-xs text-[#999]">
                  {formatDate(review.createdAt)}
                </span>
              </div>

              {/* Customer + product info */}
              <div className="mt-2 flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium text-black">
                    {review.customerName || review.customerEmail || "Anonymous"}
                  </span>
                  {review.isVerified && (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                      <svg
                        className="h-3 w-3"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.403 12.652a3 3 0 010-5.304 3 3 0 00-3.75-3.751 3 3 0 00-5.305 0 3 3 0 00-3.751 3.75 3 3 0 000 5.305 3 3 0 003.75 3.751 3 3 0 005.305 0 3 3 0 003.751-3.75zm-2.546-4.46a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Verified Purchase
                    </span>
                  )}
                </div>
                {review.productName && (
                  <span className="text-xs text-[#999]">
                    on{" "}
                    <span className="font-medium text-[#666]">
                      {review.productName}
                    </span>
                  </span>
                )}
              </div>

              {/* Review content */}
              <div className="mt-3">
                {review.title && (
                  <p className="text-sm font-semibold text-black">
                    {review.title}
                  </p>
                )}
                {review.body && (
                  <p className="mt-1 text-sm leading-relaxed text-[#666]">
                    {review.body}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="mt-3 flex items-center gap-2 border-t border-[#f0f0f0] pt-3">
                {review.status === "pending" && (
                  <button
                    type="button"
                    disabled={actionLoading === review.id}
                    onClick={() => handleAction(review.id, "approve")}
                    className="rounded-[3px] bg-green-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-green-700 disabled:opacity-50"
                  >
                    {actionLoading === review.id ? "..." : "Approve"}
                  </button>
                )}
                <button
                  type="button"
                  disabled={actionLoading === review.id}
                  onClick={() => handleDelete(review.id)}
                  className="rounded-[3px] bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-[#999]">
            Showing {(pagination.page - 1) * pagination.limit + 1}-
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
            {pagination.total}
          </p>
          <div className="flex gap-1">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => updateParams({ page: String(page - 1) })}
              className="rounded-[3px] border border-[#d0d0d0] px-3 py-1.5 text-xs font-medium text-black hover:border-black disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page >= pagination.totalPages}
              onClick={() => updateParams({ page: String(page + 1) })}
              className="rounded-[3px] border border-[#d0d0d0] px-3 py-1.5 text-xs font-medium text-black hover:border-black disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
