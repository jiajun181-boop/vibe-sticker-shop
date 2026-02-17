"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

const formatCad = (cents) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(
    cents / 100
  );

const statusColors = {
  draft: "bg-[#f5f5f5] text-black",
  pending: "bg-yellow-100 text-yellow-800",
  paid: "bg-green-100 text-green-800",
  canceled: "bg-red-100 text-red-700",
  refunded: "bg-purple-100 text-purple-700",
};

const productionColors = {
  not_started: "bg-[#f5f5f5] text-[#666]",
  preflight: "bg-blue-100 text-blue-700",
  in_production: "bg-indigo-100 text-indigo-700",
  ready_to_ship: "bg-cyan-100 text-cyan-700",
  shipped: "bg-purple-100 text-purple-700",
  completed: "bg-green-100 text-green-700",
  on_hold: "bg-yellow-100 text-yellow-800",
  canceled: "bg-red-100 text-red-700",
};

export default function CustomerDetailPage() {
  const { email: rawEmail } = useParams();
  const router = useRouter();
  const email = decodeURIComponent(rawEmail);

  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/customers/${encodeURIComponent(email)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setCustomer(null);
        } else {
          setCustomer(data);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [email]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-[#999]">
        Loading...
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2">
        <p className="text-sm text-[#999]">Customer not found</p>
        <Link
          href="/admin/customers"
          className="text-sm text-black underline hover:no-underline"
        >
          Back to Customers
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <button
          type="button"
          onClick={() => router.push("/admin/customers")}
          className="mb-1 text-xs text-[#999] hover:text-black"
        >
          &larr; Back to Customers
        </button>
        <h1 className="text-xl font-semibold text-black">
          Customer Details
        </h1>
      </div>

      {/* Customer summary card */}
      <div className="rounded-[3px] border border-[#e0e0e0] bg-white p-5">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs text-[#999]">Email</p>
            <p className="mt-0.5 text-sm font-medium text-black">
              {customer.email}
            </p>
          </div>
          <div>
            <p className="text-xs text-[#999]">Name</p>
            <p className="mt-0.5 text-sm font-medium text-black">
              {customer.name || "\u2014"}
            </p>
          </div>
          <div>
            <p className="text-xs text-[#999]">Total Orders</p>
            <p className="mt-0.5 text-sm font-semibold text-black">
              {customer.orderCount}
            </p>
          </div>
          <div>
            <p className="text-xs text-[#999]">Lifetime Spend</p>
            <p className="mt-0.5 text-sm font-semibold text-black">
              {formatCad(customer.totalSpent)}
            </p>
          </div>
        </div>
      </div>

      {/* Order history */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-black">
          Order History ({customer.orders?.length || 0})
        </h2>

        <div className="overflow-hidden rounded-[3px] border border-[#e0e0e0] bg-white">
          {customer.orders && customer.orders.length > 0 ? (
            <>
              {/* Desktop table */}
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#e0e0e0] bg-[#fafafa]">
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-[#999]">
                        Order ID
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-[#999]">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-[#999]">
                        Production
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-[#999]">
                        Items
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-[#999]">
                        Amount
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-[#999]">
                        Date
                      </th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e0e0e0]">
                    {customer.orders.map((order) => (
                      <tr key={order.id} className="hover:bg-[#fafafa]">
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs text-[#666]">
                            {order.id.slice(0, 8)}...
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-block rounded-[2px] px-2.5 py-0.5 text-xs font-medium ${
                              statusColors[order.status] || "bg-[#f5f5f5]"
                            }`}
                          >
                            {order.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-block rounded-[2px] px-2.5 py-0.5 text-xs font-medium ${
                              productionColors[order.productionStatus] ||
                              "bg-[#f5f5f5]"
                            }`}
                          >
                            {order.productionStatus?.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-[#666]">
                          {order.items?.length || 0}{" "}
                          {(order.items?.length || 0) === 1 ? "item" : "items"}
                        </td>
                        <td className="px-4 py-3 font-semibold text-black">
                          {formatCad(order.totalAmount)}
                        </td>
                        <td className="px-4 py-3 text-xs text-[#999]">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            href={`/admin/orders/${order.id}`}
                            className="text-xs font-medium text-black underline hover:no-underline"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="divide-y divide-[#e0e0e0] lg:hidden">
                {customer.orders.map((order) => (
                  <Link
                    key={order.id}
                    href={`/admin/orders/${order.id}`}
                    className="block px-4 py-3 transition-colors hover:bg-[#fafafa]"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-mono text-xs text-[#666]">
                          {order.id.slice(0, 12)}...
                        </p>
                        <p className="mt-0.5 text-xs text-[#999]">
                          {order.items?.length || 0}{" "}
                          {(order.items?.length || 0) === 1 ? "item" : "items"}
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-black">
                        {formatCad(order.totalAmount)}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <span
                        className={`rounded-[2px] px-2 py-0.5 text-xs font-medium ${
                          statusColors[order.status] || "bg-[#f5f5f5]"
                        }`}
                      >
                        {order.status}
                      </span>
                      <span
                        className={`rounded-[2px] px-2 py-0.5 text-xs font-medium ${
                          productionColors[order.productionStatus] ||
                          "bg-[#f5f5f5]"
                        }`}
                      >
                        {order.productionStatus?.replace(/_/g, " ")}
                      </span>
                      <span className="text-xs text-[#999]">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          ) : (
            <div className="flex h-32 items-center justify-center text-sm text-[#999]">
              No orders found
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
