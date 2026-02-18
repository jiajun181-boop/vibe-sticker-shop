"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useCartStore } from "@/lib/store";

const formatCad = (cents) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);

const STATUS_COLORS = {
  paid: "bg-emerald-100 text-emerald-700",
  pending: "bg-amber-100 text-amber-700",
  canceled: "bg-red-100 text-red-700",
  refunded: "bg-[var(--color-gray-100)] text-[var(--color-gray-600)]",
};

const PRODUCTION_COLORS = {
  not_started: "bg-[var(--color-gray-100)] text-[var(--color-gray-500)]",
  preflight: "bg-blue-100 text-blue-700",
  in_production: "bg-amber-100 text-amber-700",
  ready_to_ship: "bg-emerald-100 text-emerald-700",
  shipped: "bg-emerald-100 text-emerald-700",
  completed: "bg-emerald-100 text-emerald-700",
  on_hold: "bg-red-100 text-red-600",
  canceled: "bg-red-100 text-red-600",
};

function parseSizeRows(item) {
  const meta = item?.meta && typeof item.meta === "object" ? item.meta : null;
  const specs = item?.specsJson && typeof item.specsJson === "object" ? item.specsJson : null;
  const raw = specs?.sizeRows ?? meta?.sizeRows;
  let rows = raw;
  if (typeof raw === "string") {
    try {
      rows = JSON.parse(raw);
    } catch {
      rows = [];
    }
  }
  if (!Array.isArray(rows)) return [];
  return rows
    .map((row) => {
      const width = Number(row?.width ?? row?.widthIn);
      const height = Number(row?.height ?? row?.heightIn);
      const quantity = Number(row?.quantity);
      if (!Number.isFinite(width) || !Number.isFinite(height) || !Number.isFinite(quantity)) return null;
      if (width <= 0 || height <= 0 || quantity <= 0) return null;
      return { width, height, quantity };
    })
    .filter(Boolean);
}

export default function OrderDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { t } = useTranslation();
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openCart);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reordering, setReordering] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [templateSaved, setTemplateSaved] = useState(false);
  const [proofs, setProofs] = useState([]);
  const [proofsLoading, setProofsLoading] = useState(true);
  const [proofComments, setProofComments] = useState({});
  const [proofActioning, setProofActioning] = useState(null);
  const [lightboxSrc, setLightboxSrc] = useState(null);

  const fetchProofs = () => {
    fetch(`/api/account/orders/${id}/proofs`)
      .then((r) => (r.ok ? r.json() : { proofs: [] }))
      .then((data) => setProofs(data.proofs ?? []))
      .catch(() => setProofs([]))
      .finally(() => setProofsLoading(false));
  };

  useEffect(() => {
    fetch(`/api/account/orders/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then((data) => setOrder(data.order))
      .catch(() => setError("Order not found"))
      .finally(() => setLoading(false));

    fetchProofs();
  }, [id]);

  const handleProofAction = async (proofId, action) => {
    setProofActioning(proofId);
    try {
      const res = await fetch(`/api/account/orders/${id}/proofs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proofId, action, comment: proofComments[proofId] || "" }),
      });
      if (!res.ok) throw new Error();
      setProofComments((prev) => ({ ...prev, [proofId]: "" }));
      setProofsLoading(true);
      fetchProofs();
    } catch {
      setError("Failed to submit proof review");
    } finally {
      setProofActioning(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-xl bg-[var(--color-gray-100)]" />
        ))}
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-sm text-red-600">{error || "Order not found"}</p>
        <Link href="/account/orders" className="mt-3 inline-block text-sm font-semibold text-[var(--color-gray-900)] hover:underline">
          ← {t("account.nav.orders")}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link href="/account/orders" className="text-xs text-[var(--color-gray-500)] hover:text-[var(--color-gray-900)]">
            ← {t("account.nav.orders")}
          </Link>
          <h1 className="mt-2 text-lg font-semibold text-[var(--color-gray-900)]">
            {t("account.orders.orderNumber")} #{order.id.slice(0, 8)}
          </h1>
          <p className="mt-1 text-xs text-[var(--color-gray-500)]">
            {new Date(order.createdAt).toLocaleDateString("en-CA", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
        <div className="flex gap-2">
          <span
            className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase ${
              STATUS_COLORS[order.status] || "bg-[var(--color-gray-100)] text-[var(--color-gray-500)]"
            }`}
          >
            {order.status}
          </span>
          <span
            className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase ${
              PRODUCTION_COLORS[order.productionStatus] || "bg-[var(--color-gray-100)] text-[var(--color-gray-500)]"
            }`}
          >
            {order.productionStatus?.replace(/_/g, " ")}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      {(order.status === "paid" || order.status === "refunded" || order.productionStatus === "completed" || order.productionStatus === "shipped") && (
        <div className="flex gap-3">
          <button
            type="button"
            disabled={reordering}
            onClick={async () => {
              setReordering(true);
              try {
                const res = await fetch(`/api/account/orders/${id}/reorder`);
                if (!res.ok) throw new Error();
                const data = await res.json();
                for (const item of data.items) {
                  if (!item.isDiscontinued) {
                    addItem({
                      id: item.id,
                      slug: item.slug,
                      name: item.name,
                      price: item.price,
                      quantity: item.quantity,
                      options: item.options,
                    });
                  }
                }
                openCart();
              } catch {
                setError("Failed to reorder");
              } finally {
                setReordering(false);
              }
            }}
            className="flex-1 rounded-xl bg-[var(--color-gray-900)] py-3 text-sm font-semibold text-white hover:bg-black disabled:opacity-50 transition-colors"
          >
            {reordering ? "Adding to cart..." : "Reorder This Order"}
          </button>
          <a
            href={`/api/account/orders/${id}/invoice`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-xl border border-[var(--color-gray-200)] px-5 py-3 text-sm font-semibold text-[var(--color-gray-700)] hover:bg-[var(--color-gray-50)] transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Invoice
          </a>
          <button
            type="button"
            disabled={savingTemplate || templateSaved}
            onClick={async () => {
              setSavingTemplate(true);
              try {
                const res = await fetch("/api/account/templates", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    name: `Order #${order.id.slice(0, 8)}`,
                    items: order.items?.map((item) => ({
                      productId: item.productId,
                      productName: item.productName,
                      quantity: item.quantity,
                      unitPrice: item.unitPrice,
                      options: item.meta || {},
                    })),
                  }),
                });
                if (!res.ok) throw new Error();
                setTemplateSaved(true);
              } catch {
                setError("Failed to save template");
              } finally {
                setSavingTemplate(false);
              }
            }}
            className="flex items-center gap-2 rounded-xl border border-[var(--color-gray-200)] px-5 py-3 text-sm font-semibold text-[var(--color-gray-700)] hover:bg-[var(--color-gray-50)] transition-colors disabled:opacity-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
            {templateSaved ? "Saved!" : savingTemplate ? "Saving..." : "Save as Template"}
          </button>
        </div>
      )}

      {/* Items */}
      <div className="rounded-xl border border-[var(--color-gray-200)]">
        <div className="border-b border-[var(--color-gray-200)] px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-gray-400)]">
            {t("account.orders.items")}
          </p>
        </div>
        <div className="divide-y divide-[var(--color-gray-100)]">
          {order.items?.map((item) => (
            <div key={item.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-medium text-[var(--color-gray-900)]">{item.productName}</p>
                <p className="mt-0.5 text-xs text-[var(--color-gray-500)]">
                  {t("account.orders.qty")}: {item.quantity}
                  {item.material && ` - ${item.material}`}
                  {item.finishing && ` - ${item.finishing}`}
                </p>
                {parseSizeRows(item).length > 0 && (
                  <div className="mt-1 space-y-0.5 text-[11px] text-[var(--color-gray-500)]">
                    {parseSizeRows(item).map((row, idx) => (
                      <p key={`${item.id}-size-${idx}`}>
                        #{idx + 1}: {row.width}&quot; x {row.height}&quot; x {row.quantity}
                      </p>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-sm font-semibold text-[var(--color-gray-900)]">{formatCad(item.totalPrice)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="rounded-xl border border-[var(--color-gray-200)] p-4">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-[var(--color-gray-600)]">
            <span>{t("cart.subtotal")}</span>
            <span>{formatCad(order.subtotalAmount)}</span>
          </div>
          <div className="flex justify-between text-[var(--color-gray-600)]">
            <span>{t("cart.shipping")}</span>
            <span>{order.shippingAmount === 0 ? t("cart.free") : formatCad(order.shippingAmount)}</span>
          </div>
          <div className="flex justify-between text-[var(--color-gray-600)]">
            <span>{t("cart.tax")}</span>
            <span>{formatCad(order.taxAmount)}</span>
          </div>
          {order.discountAmount > 0 && (
            <div className="flex justify-between text-emerald-600">
              <span>{t("cart.discount")}</span>
              <span>-{formatCad(order.discountAmount)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-[var(--color-gray-200)] pt-2 font-semibold text-[var(--color-gray-900)]">
            <span>{t("cart.total")}</span>
            <span>{formatCad(order.totalAmount)} CAD</span>
          </div>
        </div>
      </div>

      {/* Proof Review */}
      {!proofsLoading && proofs.length > 0 && (
        <div className="rounded-xl border border-[var(--color-gray-200)]">
          <div className="border-b border-[var(--color-gray-200)] px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-gray-400)]">
              Proof Review
            </p>
          </div>
          <div className="divide-y divide-[var(--color-gray-100)]">
            {proofs.map((proof) => (
              <div key={proof.id} className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-[var(--color-gray-900)] px-2 py-0.5 text-[10px] font-bold text-white">
                    v{proof.version}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase ${
                      proof.status === "approved"
                        ? "bg-emerald-100 text-emerald-700"
                        : proof.status === "rejected"
                        ? "bg-red-100 text-red-600"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {proof.status}
                  </span>
                </div>

                {proof.imageUrl && (
                  <button
                    type="button"
                    onClick={() => setLightboxSrc(proof.imageUrl)}
                    className="block overflow-hidden rounded-lg border border-[var(--color-gray-200)] hover:opacity-80 transition-opacity"
                  >
                    <img
                      src={proof.imageUrl}
                      alt={`Proof v${proof.version}`}
                      className="h-40 w-full object-cover"
                    />
                  </button>
                )}

                {proof.adminNotes && (
                  <div className="rounded-lg bg-[var(--color-gray-50)] p-3">
                    <p className="text-[11px] font-semibold text-[var(--color-gray-400)] mb-1">Admin Notes</p>
                    <p className="text-sm text-[var(--color-gray-700)]">{proof.adminNotes}</p>
                  </div>
                )}

                {proof.status === "pending" ? (
                  <div className="space-y-2">
                    <textarea
                      value={proofComments[proof.id] || ""}
                      onChange={(e) =>
                        setProofComments((prev) => ({ ...prev, [proof.id]: e.target.value }))
                      }
                      placeholder="Add a comment (optional)..."
                      rows={2}
                      className="w-full rounded-lg border border-[var(--color-gray-200)] bg-white px-3 py-2 text-sm text-[var(--color-gray-900)] placeholder:text-[var(--color-gray-400)] focus:border-[var(--color-gray-400)] focus:outline-none"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={proofActioning === proof.id}
                        onClick={() => handleProofAction(proof.id, "approved")}
                        className="flex-1 rounded-lg bg-emerald-600 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                      >
                        {proofActioning === proof.id ? "Submitting..." : "Approve"}
                      </button>
                      <button
                        type="button"
                        disabled={proofActioning === proof.id}
                        onClick={() => handleProofAction(proof.id, "rejected")}
                        className="flex-1 rounded-lg border border-red-200 bg-red-50 py-2 text-sm font-semibold text-red-600 hover:bg-red-100 disabled:opacity-50 transition-colors"
                      >
                        {proofActioning === proof.id ? "Submitting..." : "Request Changes"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-[var(--color-gray-500)]">
                    {proof.customerComment && (
                      <p className="mb-1">
                        <span className="font-medium text-[var(--color-gray-700)]">Your comment:</span>{" "}
                        {proof.customerComment}
                      </p>
                    )}
                    {proof.reviewedAt && (
                      <p>
                        Reviewed{" "}
                        {new Date(proof.reviewedAt).toLocaleDateString("en-CA", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightboxSrc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setLightboxSrc(null)}
        >
          <button
            type="button"
            onClick={() => setLightboxSrc(null)}
            className="absolute top-4 right-4 rounded-full bg-white/90 p-2 text-[var(--color-gray-900)] hover:bg-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
          <img
            src={lightboxSrc}
            alt="Proof full size"
            className="max-h-[90vh] max-w-full rounded-xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Timeline */}
      {order.timeline && order.timeline.length > 0 && (
        <div className="rounded-xl border border-[var(--color-gray-200)] p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-gray-400)] mb-3">
            {t("account.orders.timeline")}
          </p>
          <div className="space-y-3">
            {order.timeline.map((event) => (
              <div key={event.id} className="flex gap-3">
                <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[var(--color-gray-400)]" />
                <div>
                  <p className="text-sm text-[var(--color-gray-900)]">{event.action}</p>
                  <p className="text-xs text-[var(--color-gray-500)]">
                    {new Date(event.createdAt).toLocaleDateString("en-CA", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

