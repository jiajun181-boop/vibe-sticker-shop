"use client";

import { useEffect, useState, useCallback } from "react";

/* ------------------------------------------------------------------ */
/*  Inline star SVG                                                    */
/* ------------------------------------------------------------------ */
function Star({ size = 16, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      className={className}
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Read-only star display with fractional fill                        */
/* ------------------------------------------------------------------ */
function StarDisplay({ value = 0, size = 16 }) {
  const pct = (Math.min(Math.max(value, 0), 5) / 5) * 100;
  return (
    <div className="relative inline-flex" role="img" aria-label={`${value.toFixed(1)} out of 5 stars`}>
      <div className="flex gap-0.5 text-[var(--color-gray-300)]">
        {Array.from({ length: 5 }, (_, i) => (
          <Star key={i} size={size} />
        ))}
      </div>
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ width: `${pct}%` }}
        aria-hidden="true"
      >
        <div className="flex gap-0.5 text-amber-400">
          {Array.from({ length: 5 }, (_, i) => (
            <Star key={i} size={size} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Interactive star selector                                          */
/* ------------------------------------------------------------------ */
function StarSelector({ value, onChange }) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="flex gap-1" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className="p-0.5 transition-transform hover:scale-110 focus:outline-none"
          aria-label={`${star} star${star > 1 ? "s" : ""}`}
        >
          <Star
            size={24}
            className={
              star <= (hovered || value)
                ? "text-amber-400"
                : "text-[var(--color-gray-300)]"
            }
          />
        </button>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Relative time helper                                               */
/* ------------------------------------------------------------------ */
function timeAgo(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now - date;
  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (years > 0) return `${years} year${years > 1 ? "s" : ""} ago`;
  if (months > 0) return `${months} month${months > 1 ? "s" : ""} ago`;
  if (days > 0) return `${days} day${days > 1 ? "s" : ""} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  return "just now";
}

/* ------------------------------------------------------------------ */
/*  Main ReviewsSection component                                      */
/* ------------------------------------------------------------------ */
export default function ReviewsSection({ productId, productName }) {
  const [reviews, setReviews] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [formRating, setFormRating] = useState(0);
  const [formTitle, setFormTitle] = useState("");
  const [formBody, setFormBody] = useState("");
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState(null);

  const fetchReviews = useCallback(
    async (pageNum, append = false) => {
      if (append) setLoadingMore(true);
      else setLoading(true);

      try {
        const params = new URLSearchParams();
        params.set("productId", productId);
        params.set("page", String(pageNum));

        const res = await fetch(`/api/reviews?${params}`);
        const data = await res.json();

        if (append) {
          setReviews((prev) => [...prev, ...(data.reviews || [])]);
        } else {
          setReviews(data.reviews || []);
        }
        setPagination(data.pagination || null);
      } catch (err) {
        console.error("Failed to load reviews:", err);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [productId]
  );

  useEffect(() => {
    fetchReviews(1);
  }, [fetchReviews]);

  function handleLoadMore() {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchReviews(nextPage, true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError(null);

    if (formRating === 0) {
      setFormError("Please select a star rating.");
      return;
    }
    if (formBody.trim().length < 10) {
      setFormError("Review must be at least 10 characters.");
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        productId,
        rating: formRating,
        title: formTitle.trim() || undefined,
        body: formBody.trim(),
      };

      // Include name/email for guest reviewers
      if (formName.trim()) payload.name = formName.trim();
      if (formEmail.trim()) payload.email = formEmail.trim();

      const res = await fetch("/api/reviews/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        setFormError(data.error || "Failed to submit review. Please try again.");
      } else {
        setSubmitted(true);
        setFormRating(0);
        setFormTitle("");
        setFormBody("");
        setFormName("");
        setFormEmail("");
      }
    } catch {
      setFormError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // Calculate average
  const avgRating =
    pagination?.averageRating ??
    (reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0);
  const totalCount = pagination?.total ?? reviews.length;
  const hasMore = pagination ? pagination.page < pagination.totalPages : false;

  return (
    <section className="rounded-3xl border border-[var(--color-gray-200)] bg-white p-6 md:p-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-[var(--color-gray-900)]">
            Customer Reviews
          </h2>
          {totalCount > 0 && (
            <div className="mt-1.5 flex items-center gap-2">
              <StarDisplay value={Number(avgRating)} size={18} />
              <span className="text-sm font-semibold text-[var(--color-gray-900)]">
                {Number(avgRating).toFixed(1)}
              </span>
              <span className="text-sm text-[var(--color-gray-500)]">
                ({totalCount} review{totalCount !== 1 ? "s" : ""})
              </span>
            </div>
          )}
          {totalCount === 0 && !loading && (
            <p className="mt-1 text-sm text-[var(--color-gray-500)]">
              No reviews yet. Be the first to review this product!
            </p>
          )}
        </div>
        {!showForm && !submitted && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="self-start rounded-xl border border-[var(--color-gray-900)] px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.1em] text-[var(--color-gray-900)] transition-colors hover:bg-[var(--color-gray-900)] hover:text-white"
          >
            Write a Review
          </button>
        )}
      </div>

      {/* Review Form */}
      {showForm && !submitted && (
        <div className="mb-6 rounded-2xl border border-[var(--color-gray-200)] bg-[var(--color-gray-50)] p-5">
          <h3 className="text-base font-semibold text-[var(--color-gray-900)]">
            Review {productName || "this product"}
          </h3>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {/* Star Rating */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--color-gray-600)]">
                Your Rating *
              </label>
              <StarSelector value={formRating} onChange={setFormRating} />
            </div>

            {/* Name + Email (for guests) */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="review-name"
                  className="mb-1.5 block text-xs font-medium text-[var(--color-gray-600)]"
                >
                  Name
                </label>
                <input
                  id="review-name"
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Your name"
                  className="w-full rounded-xl border border-[var(--color-gray-200)] bg-white px-3.5 py-2.5 text-sm text-[var(--color-gray-900)] outline-none transition-colors placeholder:text-[var(--color-gray-400)] focus:border-[var(--color-gray-900)]"
                />
              </div>
              <div>
                <label
                  htmlFor="review-email"
                  className="mb-1.5 block text-xs font-medium text-[var(--color-gray-600)]"
                >
                  Email
                </label>
                <input
                  id="review-email"
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full rounded-xl border border-[var(--color-gray-200)] bg-white px-3.5 py-2.5 text-sm text-[var(--color-gray-900)] outline-none transition-colors placeholder:text-[var(--color-gray-400)] focus:border-[var(--color-gray-900)]"
                />
              </div>
            </div>

            {/* Title */}
            <div>
              <label
                htmlFor="review-title"
                className="mb-1.5 block text-xs font-medium text-[var(--color-gray-600)]"
              >
                Title (optional)
              </label>
              <input
                id="review-title"
                type="text"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="Sum up your experience"
                className="w-full rounded-xl border border-[var(--color-gray-200)] bg-white px-3.5 py-2.5 text-sm text-[var(--color-gray-900)] outline-none transition-colors placeholder:text-[var(--color-gray-400)] focus:border-[var(--color-gray-900)]"
              />
            </div>

            {/* Body */}
            <div>
              <label
                htmlFor="review-body"
                className="mb-1.5 block text-xs font-medium text-[var(--color-gray-600)]"
              >
                Your Review *
              </label>
              <textarea
                id="review-body"
                rows={4}
                value={formBody}
                onChange={(e) => setFormBody(e.target.value)}
                placeholder="Tell others about your experience (min 10 characters)"
                required
                minLength={10}
                className="w-full rounded-xl border border-[var(--color-gray-200)] bg-white px-3.5 py-2.5 text-sm leading-relaxed text-[var(--color-gray-900)] outline-none transition-colors placeholder:text-[var(--color-gray-400)] focus:border-[var(--color-gray-900)]"
              />
              <p className="mt-1 text-xs text-[var(--color-gray-400)]">
                {formBody.length}/10 characters minimum
              </p>
            </div>

            {/* Error */}
            {formError && (
              <p className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-600">
                {formError}
              </p>
            )}

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-xl bg-[var(--color-gray-900)] px-6 py-2.5 text-xs font-semibold uppercase tracking-[0.1em] text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {submitting ? "Submitting..." : "Submit Review"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setFormError(null);
                }}
                className="rounded-xl border border-[var(--color-gray-300)] px-6 py-2.5 text-xs font-semibold uppercase tracking-[0.1em] text-[var(--color-gray-700)] transition-colors hover:bg-[var(--color-gray-50)]"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Success message */}
      {submitted && (
        <div className="mb-6 rounded-2xl border border-green-200 bg-green-50 p-5 text-center">
          <svg
            className="mx-auto h-8 w-8 text-green-500"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="mt-2 text-sm font-semibold text-green-800">
            Thank you! Your review will appear after moderation.
          </p>
          <button
            type="button"
            onClick={() => {
              setSubmitted(false);
              setShowForm(false);
            }}
            className="mt-3 text-xs font-medium text-green-700 underline hover:no-underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Reviews List */}
      {loading ? (
        <div className="flex h-32 items-center justify-center text-sm text-[var(--color-gray-400)]">
          Loading reviews...
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="rounded-2xl border border-[var(--color-gray-100)] bg-[var(--color-gray-50)] p-4"
            >
              {/* Top row */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <StarDisplay value={review.rating} size={14} />
                  <span className="text-xs text-[var(--color-gray-400)]">
                    {timeAgo(review.createdAt)}
                  </span>
                </div>
              </div>

              {/* Author */}
              <div className="mt-2 flex items-center gap-1.5">
                <span className="text-sm font-semibold text-[var(--color-gray-900)]">
                  {review.customerName || "Anonymous"}
                </span>
                {review.isVerified && (
                  <span className="inline-flex items-center gap-0.5 rounded-xl bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
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

              {/* Content */}
              <div className="mt-2">
                {review.title && (
                  <p className="text-sm font-semibold text-[var(--color-gray-900)]">
                    {review.title}
                  </p>
                )}
                {review.body && (
                  <p className="mt-1 text-sm leading-relaxed text-[var(--color-gray-700)]">
                    {review.body}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Load More */}
      {hasMore && (
        <button
          type="button"
          onClick={handleLoadMore}
          disabled={loadingMore}
          className="mt-4 w-full rounded-xl border border-[var(--color-gray-300)] px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-gray-700)] transition-colors hover:bg-[var(--color-gray-50)] disabled:opacity-50"
        >
          {loadingMore ? "Loading..." : "Load More Reviews"}
        </button>
      )}
    </section>
  );
}
