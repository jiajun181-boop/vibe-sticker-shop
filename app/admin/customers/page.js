"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";

const formatCad = (cents) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(
    cents / 100
  );

export default function CustomersPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-48 items-center justify-center text-sm text-[#999]">
          Loading...
        </div>
      }
    >
      <CustomersContent />
    </Suspense>
  );
}

function CustomersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [customers, setCustomers] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [sort, setSort] = useState(searchParams.get("sort") || "totalSpent");
  const [order, setOrder] = useState(searchParams.get("order") || "desc");
  const page = parseInt(searchParams.get("page") || "1");

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", "20");
    if (search) params.set("search", search);
    params.set("sort", sort);
    params.set("order", order);

    try {
      const res = await fetch(`/api/admin/customers?${params}`);
      const data = await res.json();
      setCustomers(data.customers || []);
      setPagination(data.pagination || null);
    } catch (err) {
      console.error("Failed to load customers:", err);
    } finally {
      setLoading(false);
    }
  }, [page, search, sort, order]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  function updateParams(updates) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    router.push(`/admin/customers?${params}`);
  }

  function handleSearch(e) {
    e.preventDefault();
    updateParams({ search: search || null, page: "1" });
  }

  function handleSortChange(e) {
    const value = e.target.value;
    const [newSort, newOrder] = value.split(":");
    setSort(newSort);
    setOrder(newOrder);
    updateParams({ sort: newSort, order: newOrder, page: "1" });
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-black">Customers</h1>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Sort dropdown */}
        <div className="flex items-center gap-2">
          <label
            htmlFor="sort-select"
            className="text-xs font-medium text-[#999]"
          >
            Sort by
          </label>
          <select
            id="sort-select"
            value={`${sort}:${order}`}
            onChange={handleSortChange}
            className="rounded-[3px] border border-[#d0d0d0] px-3 py-1.5 text-xs font-medium text-black outline-none focus:border-black"
          >
            <option value="totalSpent:desc">Total Spent (High to Low)</option>
            <option value="totalSpent:asc">Total Spent (Low to High)</option>
            <option value="orderCount:desc">Order Count (High to Low)</option>
            <option value="orderCount:asc">Order Count (Low to High)</option>
            <option value="lastOrder:desc">Last Order (Newest)</option>
            <option value="lastOrder:asc">Last Order (Oldest)</option>
          </select>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search email or name..."
            className="w-full sm:w-64 rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-black"
          />
          <button
            type="submit"
            className="rounded-[3px] bg-black px-4 py-2 text-xs font-semibold text-white hover:bg-[#222]"
          >
            Search
          </button>
        </form>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-[3px] border border-[#e0e0e0] bg-white">
        {loading ? (
          <div className="flex h-48 items-center justify-center text-sm text-[#999]">
            Loading...
          </div>
        ) : customers.length === 0 ? (
          <div className="flex h-48 items-center justify-center text-sm text-[#999]">
            No customers found
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#e0e0e0] bg-[#fafafa]">
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-[#999]">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-[#999]">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-[#999]">
                      Orders
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-[#999]">
                      Total Spent
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-[#999]">
                      First Order
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-[#999]">
                      Last Order
                    </th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e0e0e0]">
                  {customers.map((customer) => (
                    <tr key={customer.email} className="hover:bg-[#fafafa]">
                      <td className="px-4 py-3">
                        <span className="font-medium text-black">
                          {customer.email}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[#666]">
                        {customer.name || "\u2014"}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-block rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                          {customer.orderCount}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-black">
                        {formatCad(customer.totalSpent)}
                      </td>
                      <td className="px-4 py-3 text-xs text-[#999]">
                        {new Date(customer.firstOrder).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-xs text-[#999]">
                        {new Date(customer.lastOrder).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/customers/${encodeURIComponent(customer.email)}`}
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
              {customers.map((customer) => (
                <Link
                  key={customer.email}
                  href={`/admin/customers/${encodeURIComponent(customer.email)}`}
                  className="block px-4 py-3 transition-colors hover:bg-[#fafafa]"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-black">
                        {customer.email}
                      </p>
                      {customer.name && (
                        <p className="mt-0.5 text-xs text-[#999]">
                          {customer.name}
                        </p>
                      )}
                    </div>
                    <span className="text-sm font-semibold text-black">
                      {formatCad(customer.totalSpent)}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                      {customer.orderCount}{" "}
                      {customer.orderCount === 1 ? "order" : "orders"}
                    </span>
                    <span className="text-xs text-[#999]">
                      Last:{" "}
                      {new Date(customer.lastOrder).toLocaleDateString()}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </>
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
              className="rounded-[3px] border border-[#d0d0d0] px-3 py-1.5 text-xs font-medium text-black hover:bg-[#fafafa] disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page >= pagination.totalPages}
              onClick={() => updateParams({ page: String(page + 1) })}
              className="rounded-[3px] border border-[#d0d0d0] px-3 py-1.5 text-xs font-medium text-black hover:bg-[#fafafa] disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
