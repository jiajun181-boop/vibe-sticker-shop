"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";

const STATUS_COLORS = {
  submitted: "bg-blue-50 text-blue-700",
  under_review: "bg-yellow-50 text-yellow-700",
  approved: "bg-green-50 text-green-700",
  denied: "bg-red-50 text-red-700",
  fulfilled: "bg-emerald-50 text-emerald-700",
};

const ISSUE_VALUES = ["defective", "damaged", "wrong_item", "quality", "other"];

const ISSUE_LABEL_KEYS = {
  defective: "warranty.issueDefective",
  damaged: "warranty.issueDamaged",
  wrong_item: "warranty.issueWrongItem",
  quality: "warranty.issueQuality",
  other: "warranty.issueOther",
};

const STATUS_LABEL_KEYS = {
  submitted: "warranty.statusSubmitted",
  under_review: "warranty.statusUnderReview",
  approved: "warranty.statusApproved",
  denied: "warranty.statusDenied",
  fulfilled: "warranty.statusFulfilled",
};

const RESOLUTION_LABEL_KEYS = {
  replace: "warranty.resolutionReplace",
  refund: "warranty.resolutionRefund",
  repair: "warranty.resolutionRepair",
  credit: "warranty.resolutionCredit",
};

function formatDate(dateStr, locale) {
  return new Date(dateStr).toLocaleDateString(locale === "zh" ? "zh-CN" : "en-CA", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getMappedLabel(t, map, value) {
  return map[value] ? t(map[value]) : (value || "").replace(/_/g, " ");
}

export default function WarrantyClaimsPage() {
  const { t, locale } = useTranslation();
  const [claims, setClaims] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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
      setClaims([]);
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
      setOrders([]);
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
    setPhotoUrls((prev) => prev.filter((value) => value !== url));
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
        setError(data.error || t("warranty.submitFailed"));
        return;
      }

      setClaims((prev) => [data.claim, ...prev]);
      setShowNew(false);
      setOrderId("");
      setIssueType("");
      setDescription("");
      setPhotoUrls([]);
      setPhotoUrl("");
      setSuccess(
        t("warranty.submittedWithNumber", {
          claimNumber: data.claim.claimNumber,
        })
      );
    } catch {
      setError(t("warranty.submitFailed"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-[var(--color-gray-900)]">
          {t("warranty.title")}
        </h1>
        <button
          type="button"
          onClick={() => {
            setShowNew(!showNew);
            setError("");
            setSuccess("");
          }}
          className="rounded-lg bg-[var(--color-gray-900)] px-4 py-2 text-sm font-semibold text-[#fff] transition-colors hover:bg-black"
        >
          {showNew ? t("warranty.cancel") : t("warranty.newClaim")}
        </button>
      </div>

      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      )}

      {showNew && (
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-xl border border-[var(--color-gray-200)] p-4"
        >
          {error && <p className="text-sm text-red-600">{error}</p>}

          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--color-gray-500)]">
              {t("warranty.selectOrder")}
            </label>
            <select
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              className="w-full rounded-lg border border-[var(--color-gray-200)] px-3 py-2 text-sm text-[var(--color-gray-900)] focus:border-[var(--color-gray-400)] focus:outline-none"
              required
            >
              <option value="">{t("warranty.selectOrderPlaceholder")}</option>
              {orders.map((order) => (
                <option key={order.id} value={order.id}>
                  #{order.id.slice(0, 8)} - {formatDate(order.createdAt, locale)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--color-gray-500)]">
              {t("warranty.issueType")}
            </label>
            <select
              value={issueType}
              onChange={(e) => setIssueType(e.target.value)}
              className="w-full rounded-lg border border-[var(--color-gray-200)] px-3 py-2 text-sm text-[var(--color-gray-900)] focus:border-[var(--color-gray-400)] focus:outline-none"
              required
            >
              <option value="">{t("warranty.issueTypePlaceholder")}</option>
              {ISSUE_VALUES.map((value) => (
                <option key={value} value={value}>
                  {getMappedLabel(t, ISSUE_LABEL_KEYS, value)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--color-gray-500)]">
              {t("warranty.description")}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("warranty.descriptionPlaceholder")}
              rows={4}
              className="w-full rounded-lg border border-[var(--color-gray-200)] px-3 py-2 text-sm text-[var(--color-gray-900)] placeholder:text-[var(--color-gray-400)] focus:border-[var(--color-gray-400)] focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--color-gray-500)]">
              {t("warranty.photosOptional")}
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                placeholder={t("warranty.photoUrlPlaceholder")}
                className="flex-1 rounded-lg border border-[var(--color-gray-200)] px-3 py-2 text-sm text-[var(--color-gray-900)] placeholder:text-[var(--color-gray-400)] focus:border-[var(--color-gray-400)] focus:outline-none"
              />
              <button
                type="button"
                onClick={addPhoto}
                disabled={!photoUrl.trim()}
                className="rounded-lg border border-[var(--color-gray-200)] px-3 py-2 text-sm font-medium text-[var(--color-gray-700)] transition-colors hover:bg-[var(--color-gray-50)] disabled:opacity-40"
              >
                {t("warranty.addPhoto")}
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
                      {t("warranty.removePhoto")}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-[var(--color-gray-900)] px-6 py-2.5 text-sm font-semibold text-[#fff] transition-colors hover:bg-black disabled:opacity-50"
          >
            {submitting ? t("warranty.submitting") : t("warranty.submit")}
          </button>
        </form>
      )}

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
          <p className="text-sm text-[var(--color-gray-500)]">{t("warranty.empty")}</p>
          <p className="mt-1 text-xs text-[var(--color-gray-400)]">
            {t("warranty.emptyHint")}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-[var(--color-gray-100)] rounded-xl border border-[var(--color-gray-200)]">
          {claims.map((claim) => (
            <div
              key={claim.id}
              className="px-4 py-4 transition-colors hover:bg-[var(--color-gray-50)]"
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
                      {getMappedLabel(t, STATUS_LABEL_KEYS, claim.status)}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-[var(--color-gray-500)]">
                    {t("warranty.orderShort", { id: claim.orderId?.slice(0, 8) || "-" })} &bull;{" "}
                    {getMappedLabel(t, ISSUE_LABEL_KEYS, claim.issueType)} &bull;{" "}
                    {formatDate(claim.createdAt, locale)}
                  </p>
                  <p className="mt-1.5 line-clamp-2 text-sm text-[var(--color-gray-700)]">
                    {claim.description}
                  </p>

                  {claim.photoUrls?.length > 0 && (
                    <p className="mt-1 text-xs text-[var(--color-gray-400)]">
                      {t("warranty.photoCount", { count: claim.photoUrls.length })}
                    </p>
                  )}

                  {claim.resolution && (
                    <div className="mt-2 rounded-lg bg-[var(--color-gray-50)] px-3 py-2">
                      <p className="text-xs font-medium text-[var(--color-gray-700)]">
                        {t("warranty.resolution")}:{" "}
                        <span className="capitalize">
                          {getMappedLabel(t, RESOLUTION_LABEL_KEYS, claim.resolution)}
                        </span>
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
