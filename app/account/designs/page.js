"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { showErrorToast, showSuccessToast } from "@/components/Toast";

export default function SavedDesignsPage() {
  const { t, locale } = useTranslation();
  const [designs, setDesigns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/account/designs")
      .then((r) => (r.ok ? r.json() : { designs: [] }))
      .then((data) => setDesigns(data.designs || []))
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete(id) {
    if (!confirm(t("designs.deleteConfirm") || "Delete this saved design?")) return;
    try {
      const res = await fetch(`/api/account/designs/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setDesigns((prev) => prev.filter((d) => d.id !== id));
      showSuccessToast(t("designs.deleted") || "Design deleted");
    } catch {
      showErrorToast(t("designs.deleteFailed") || "Failed to delete design");
    }
  }

  function copyShareLink(shareToken) {
    const url = `${window.location.origin}/designs/${shareToken}`;
    navigator.clipboard.writeText(url).then(() => {
      showSuccessToast(t("designs.linkCopied") || "Share link copied!");
    });
  }

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-[var(--color-gray-400)]">
        {t("common.loading") || "Loading..."}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-[var(--color-gray-900)]">
          {t("designs.title") || "Saved Designs"}
        </h1>
        <p className="mt-1 text-sm text-[var(--color-gray-500)]">
          {t("designs.subtitle") || "Your saved product configurations"}
        </p>
      </div>

      {designs.length === 0 ? (
        <div className="rounded-2xl border border-[var(--color-gray-200)] bg-[var(--color-gray-50)] p-8 text-center">
          <p className="text-sm text-[var(--color-gray-500)]">
            {t("designs.empty") || "No saved designs yet. Configure a product and save your design to see it here."}
          </p>
          <Link
            href="/shop"
            className="mt-4 inline-block rounded-xl bg-[var(--color-gray-900)] px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-white"
          >
            {t("designs.browseProducts") || "Browse Products"}
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {designs.map((design) => (
            <div
              key={design.id}
              className="rounded-2xl border border-[var(--color-gray-200)] bg-white p-4 transition-shadow hover:shadow-md"
            >
              {design.thumbnailUrl && (
                <div className="mb-3 aspect-video overflow-hidden rounded-lg bg-[var(--color-gray-100)]">
                  <img
                    src={design.thumbnailUrl}
                    alt={design.name}
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
              <h3 className="text-sm font-semibold text-[var(--color-gray-900)]">
                {design.name}
              </h3>
              <p className="mt-0.5 text-xs text-[var(--color-gray-400)]">
                {design.productSlug.replace(/-/g, " ")}
              </p>
              <p className="mt-1 text-[10px] text-[var(--color-gray-400)]">
                {new Date(design.updatedAt).toLocaleDateString(locale === "zh" ? "zh-CN" : "en-CA")}
              </p>
              <div className="mt-3 flex gap-2">
                <Link
                  href={`/order/${design.productSlug}?design=${design.id}`}
                  className="rounded-lg bg-[var(--color-gray-900)] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-white"
                >
                  {t("designs.useDesign") || "Use"}
                </Link>
                {design.shareToken && (
                  <button
                    type="button"
                    onClick={() => copyShareLink(design.shareToken)}
                    className="rounded-lg border border-[var(--color-gray-300)] px-3 py-1.5 text-[10px] font-semibold text-[var(--color-gray-600)] hover:border-[var(--color-gray-500)]"
                  >
                    {t("designs.share") || "Share"}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleDelete(design.id)}
                  className="rounded-lg border border-red-200 px-3 py-1.5 text-[10px] font-semibold text-red-500 hover:border-red-400"
                >
                  {t("designs.delete") || "Delete"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
