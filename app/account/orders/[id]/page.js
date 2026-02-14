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
  refunded: "bg-gray-100 text-gray-600",
};

const PRODUCTION_COLORS = {
  not_started: "bg-gray-100 text-gray-500",
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

  useEffect(() => {
    fetch(`/api/account/orders/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then((data) => setOrder(data.order))
      .catch(() => setError("Order not found"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-xl bg-gray-100" />
        ))}
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-sm text-red-600">{error || "Order not found"}</p>
        <Link href="/account/orders" className="mt-3 inline-block text-sm font-semibold text-gray-900 hover:underline">
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
          <Link href="/account/orders" className="text-xs text-gray-500 hover:text-gray-900">
            ← {t("account.nav.orders")}
          </Link>
          <h1 className="mt-2 text-lg font-semibold text-gray-900">
            {t("account.orders.orderNumber")} #{order.id.slice(0, 8)}
          </h1>
          <p className="mt-1 text-xs text-gray-500">
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
              STATUS_COLORS[order.status] || "bg-gray-100 text-gray-500"
            }`}
          >
            {order.status}
          </span>
          <span
            className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase ${
              PRODUCTION_COLORS[order.productionStatus] || "bg-gray-100 text-gray-500"
            }`}
          >
            {order.productionStatus?.replace(/_/g, " ")}
          </span>
        </div>
      </div>

      {/* Reorder Button */}
      {order.status === "paid" || order.status === "refunded" || order.productionStatus === "completed" || order.productionStatus === "shipped" ? (
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
          className="w-full rounded-xl bg-gray-900 py-3 text-sm font-semibold text-white hover:bg-black disabled:opacity-50 transition-colors"
        >
          {reordering ? "Adding to cart..." : "Reorder This Order"}
        </button>
      ) : null}

      {/* Items */}
      <div className="rounded-xl border border-gray-200">
        <div className="border-b border-gray-200 px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-400">
            {t("account.orders.items")}
          </p>
        </div>
        <div className="divide-y divide-gray-100">
          {order.items?.map((item) => (
            <div key={item.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-medium text-gray-900">{item.productName}</p>
                <p className="mt-0.5 text-xs text-gray-500">
                  {t("account.orders.qty")}: {item.quantity}
                  {item.material && ` - ${item.material}`}
                  {item.finishing && ` - ${item.finishing}`}
                </p>
                {parseSizeRows(item).length > 0 && (
                  <div className="mt-1 space-y-0.5 text-[11px] text-gray-500">
                    {parseSizeRows(item).map((row, idx) => (
                      <p key={`${item.id}-size-${idx}`}>
                        #{idx + 1}: {row.width}&quot; x {row.height}&quot; x {row.quantity}
                      </p>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-sm font-semibold text-gray-900">{formatCad(item.totalPrice)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="rounded-xl border border-gray-200 p-4">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>{t("cart.subtotal")}</span>
            <span>{formatCad(order.subtotalAmount)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>{t("cart.shipping")}</span>
            <span>{order.shippingAmount === 0 ? t("cart.free") : formatCad(order.shippingAmount)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>{t("cart.tax")}</span>
            <span>{formatCad(order.taxAmount)}</span>
          </div>
          {order.discountAmount > 0 && (
            <div className="flex justify-between text-emerald-600">
              <span>{t("cart.discount")}</span>
              <span>-{formatCad(order.discountAmount)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-gray-200 pt-2 font-semibold text-gray-900">
            <span>{t("cart.total")}</span>
            <span>{formatCad(order.totalAmount)} CAD</span>
          </div>
        </div>
      </div>

      {/* Timeline */}
      {order.timeline && order.timeline.length > 0 && (
        <div className="rounded-xl border border-gray-200 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-400 mb-3">
            {t("account.orders.timeline")}
          </p>
          <div className="space-y-3">
            {order.timeline.map((event) => (
              <div key={event.id} className="flex gap-3">
                <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-gray-400" />
                <div>
                  <p className="text-sm text-gray-900">{event.action}</p>
                  <p className="text-xs text-gray-500">
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

