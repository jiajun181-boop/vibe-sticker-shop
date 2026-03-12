"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { formatCad } from "@/lib/admin/format-cad";
import { buildCustomerCenterHref, CUSTOMER_CENTER_VIEWS, getCustomerCenterView } from "@/lib/admin-centers";

const CENTER_WORKSPACE_LINKS = {
  messages: "/admin/customers/messages",
  support: "/admin/customers/support",
  b2b: "/admin/customers/b2b",
};

const TICKET_STATUS_KEYS = {
  open: "admin.support.statusOpen",
  in_progress: "admin.support.statusInProgress",
  waiting_customer: "admin.support.statusWaiting",
  resolved: "admin.support.statusResolved",
  closed: "admin.support.statusClosed",
};

const TICKET_PRIORITY_KEYS = {
  low: "admin.support.priorityLow",
  normal: "admin.support.priorityNormal",
  high: "admin.support.priorityHigh",
  urgent: "admin.support.priorityUrgent",
};

export default function CustomersPage() {
  const { t } = useTranslation();
  return (
    <Suspense
      fallback={
        <div className="flex h-48 items-center justify-center text-sm text-[#999]">
          {t("admin.customers.loading")}
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
  const { t, locale } = useTranslation();
  const dateLocale = locale === "zh" ? "zh-CN" : "en-CA";
  const activeView = getCustomerCenterView(searchParams.get("view"));

  const [customers, setCustomers] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [centerRows, setCenterRows] = useState([]);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [sort, setSort] = useState(searchParams.get("sort") || "totalSpent");
  const [order, setOrder] = useState(searchParams.get("order") || "desc");
  const page = parseInt(searchParams.get("page") || "1");

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", "20");
    if (search) params.set("search", search);
    params.set("sort", sort);
    params.set("order", order);

    try {
      const res = await fetch(`/api/admin/customers?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setCustomers(data.customers || []);
      setPagination(data.pagination || null);
    } catch (err) {
      console.error("Failed to load customers:", err);
      setLoadError(t("admin.customers.loadError"));
    } finally {
      setLoading(false);
    }
  }, [page, search, sort, order, t]);

  const fetchCenterRows = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    setCenterRows([]);
    try {
      let res;
      if (activeView.id === "messages") {
        res = await fetch("/api/conversations");
      } else if (activeView.id === "support") {
        res = await fetch("/api/admin/support?limit=20");
      } else if (activeView.id === "b2b") {
        res = await fetch("/api/admin/b2b?filter=all");
      }

      if (!res) return;
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      if (activeView.id === "messages") setCenterRows(data.conversations || []);
      else if (activeView.id === "support") setCenterRows(data.tickets || []);
      else if (activeView.id === "b2b") setCenterRows(data.users || []);
    } catch (err) {
      console.error("Failed to load customer center view:", err);
      setLoadError(t("admin.customers.centerLoadError"));
    } finally {
      setLoading(false);
    }
  }, [activeView.id, t]);

  useEffect(() => {
    setSearch(searchParams.get("search") || "");
    setSort(searchParams.get("sort") || "totalSpent");
    setOrder(searchParams.get("order") || "desc");
  }, [searchParams]);

  useEffect(() => {
    if (activeView.id === "customers") fetchCustomers();
    else fetchCenterRows();
  }, [activeView.id, fetchCustomers, fetchCenterRows]);

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

  const workspaceHref = CENTER_WORKSPACE_LINKS[activeView.id];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-black">{t("admin.customers.title")}</h1>
          <p className="mt-1 text-sm text-[#666]">{t("admin.customers.subtitle")}</p>
        </div>
        {workspaceHref && (
          <Link
            href={workspaceHref}
            className="text-xs font-medium text-[#666] underline hover:text-black hover:no-underline"
          >
            {t("admin.customers.openWorkspace")}
          </Link>
        )}
      </div>

      <div className="overflow-x-auto">
        <div className="flex min-w-max gap-2">
          {Object.values(CUSTOMER_CENTER_VIEWS).map((view) => (
            <Link
              key={view.id}
              href={buildCustomerCenterHref(view.id)}
              className={`rounded-[3px] border px-3 py-1.5 text-xs font-semibold transition-colors ${
                activeView.id === view.id
                  ? "border-black bg-black text-white"
                  : "border-[#e0e0e0] bg-white text-[#666] hover:border-black hover:text-black"
              }`}
            >
              {t(view.labelKey)}
            </Link>
          ))}
        </div>
      </div>

      {activeView.id === "customers" && (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <label
                htmlFor="sort-select"
                className="text-xs font-medium text-[#999]"
              >
                {t("admin.customers.sortBy")}
              </label>
              <select
                id="sort-select"
                value={`${sort}:${order}`}
                onChange={handleSortChange}
                className="rounded-[3px] border border-[#d0d0d0] px-3 py-1.5 text-xs font-medium text-black outline-none focus:border-black"
              >
                <option value="totalSpent:desc">{t("admin.customers.totalSpentDesc")}</option>
                <option value="totalSpent:asc">{t("admin.customers.totalSpentAsc")}</option>
                <option value="orderCount:desc">{t("admin.customers.orderCountDesc")}</option>
                <option value="orderCount:asc">{t("admin.customers.orderCountAsc")}</option>
                <option value="lastOrder:desc">{t("admin.customers.lastOrderDesc")}</option>
                <option value="lastOrder:asc">{t("admin.customers.lastOrderAsc")}</option>
              </select>
            </div>

            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("admin.customers.searchPlaceholder")}
                className="w-full sm:w-64 rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-black"
              />
              <button
                type="submit"
                className="rounded-[3px] bg-black px-4 py-2 text-xs font-semibold text-[#fff] hover:bg-[#222]"
              >
                {t("admin.common.search")}
              </button>
            </form>
          </div>

          <div className="overflow-hidden rounded-[3px] border border-[#e0e0e0] bg-white">
            {loading ? (
              <div className="flex h-48 items-center justify-center text-sm text-[#999]">
                {t("admin.customers.loading")}
              </div>
            ) : loadError ? (
              <div className="flex h-48 items-center justify-center text-sm text-red-600">
                {loadError}
              </div>
            ) : customers.length === 0 ? (
              <div className="flex h-48 items-center justify-center text-sm text-[#999]">
                {t("admin.customers.noCustomers")}
              </div>
            ) : (
              <>
                <div className="hidden overflow-x-auto lg:block">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#e0e0e0] bg-[#fafafa]">
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-[#999]">{t("admin.customers.email")}</th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-[#999]">{t("admin.customers.name")}</th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-[#999]">{t("admin.customers.orders")}</th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-[#999]">{t("admin.customers.totalSpent")}</th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-[#999]">{t("admin.customers.firstOrder")}</th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-[#999]">{t("admin.customers.lastOrder")}</th>
                        <th className="px-4 py-3" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e0e0e0]">
                      {customers.map((customer) => (
                        <tr key={customer.email} className="hover:bg-[#fafafa]">
                          <td className="px-4 py-3"><span className="font-medium text-black">{customer.email}</span></td>
                          <td className="px-4 py-3 text-[#666]">{customer.name || "-"}</td>
                          <td className="px-4 py-3"><span className="inline-block rounded-xl bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">{customer.orderCount}</span></td>
                          <td className="px-4 py-3 font-semibold text-black">{formatCad(customer.totalSpent)}</td>
                          <td className="px-4 py-3 text-xs text-[#999]">{new Date(customer.firstOrder).toLocaleDateString(dateLocale)}</td>
                          <td className="px-4 py-3 text-xs text-[#999]">{new Date(customer.lastOrder).toLocaleDateString(dateLocale)}</td>
                          <td className="px-4 py-3">
                            <Link href={`/admin/customers/${encodeURIComponent(customer.email)}`} className="text-xs font-medium text-black underline hover:no-underline">
                              {t("admin.customers.view")}
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="divide-y divide-[#e0e0e0] lg:hidden">
                  {customers.map((customer) => (
                    <Link
                      key={customer.email}
                      href={`/admin/customers/${encodeURIComponent(customer.email)}`}
                      className="block px-4 py-3 transition-colors hover:bg-[#fafafa]"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium text-black">{customer.email}</p>
                          {customer.name && <p className="mt-0.5 text-xs text-[#999]">{customer.name}</p>}
                        </div>
                        <span className="text-sm font-semibold text-black">{formatCad(customer.totalSpent)}</span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <span className="rounded-xl bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                          {customer.orderCount} {customer.orderCount === 1 ? t("admin.customers.order") : t("admin.customers.ordersPlural")}
                        </span>
                        <span className="text-xs text-[#999]">
                          {t("admin.customers.last")} {new Date(customer.lastOrder).toLocaleDateString(dateLocale)}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-[#999]">
                {t("admin.common.showing")} {(pagination.page - 1) * pagination.limit + 1}-
                {Math.min(pagination.page * pagination.limit, pagination.total)} {t("admin.common.of")} {pagination.total}
              </p>
              <div className="flex gap-1">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => updateParams({ page: String(page - 1) })}
                  className="rounded-[3px] border border-[#d0d0d0] px-3 py-1.5 text-xs font-medium text-black hover:bg-[#fafafa] disabled:opacity-40"
                >
                  {t("admin.common.previous")}
                </button>
                <button
                  type="button"
                  disabled={page >= pagination.totalPages}
                  onClick={() => updateParams({ page: String(page + 1) })}
                  className="rounded-[3px] border border-[#d0d0d0] px-3 py-1.5 text-xs font-medium text-black hover:bg-[#fafafa] disabled:opacity-40"
                >
                  {t("admin.common.next")}
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {activeView.id === "messages" && (
        <CenterList
          loading={loading}
          error={loadError}
          empty={t("admin.customers.noMessages")}
          rows={centerRows}
          renderRow={(conversation) => (
            <div key={conversation.id} className="flex items-start justify-between gap-3 rounded-[3px] border border-[#ececec] bg-white p-4">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-black">{conversation.customerName || conversation.customerEmail || "-"}</p>
                <p className="mt-0.5 text-xs text-[#999]">{conversation.customerEmail || t("admin.customers.noEmail")}</p>
                <p className="mt-2 truncate text-sm text-[#444]">{conversation.lastMessage || t("admin.customers.noMessagePreview")}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-[10px] text-[#999]">{new Date(conversation.lastMessageAt).toLocaleString(dateLocale)}</p>
                {conversation.unreadCount > 0 && (
                  <span className="mt-2 inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">
                    {conversation.unreadCount} {t("admin.customers.unread")}
                  </span>
                )}
              </div>
            </div>
          )}
        />
      )}

      {activeView.id === "support" && (
        <CenterList
          loading={loading}
          error={loadError}
          empty={t("admin.customers.noSupport")}
          rows={centerRows}
          renderRow={(ticket) => (
            <div key={ticket.id} className="flex items-start justify-between gap-3 rounded-[3px] border border-[#ececec] bg-white p-4">
              <div className="min-w-0 flex-1">
                <Link href={`/admin/customers/support/${ticket.id}`} className="text-sm font-semibold text-black hover:underline">
                  {ticket.subject}
                </Link>
                <p className="mt-0.5 text-xs text-[#999]">{ticket.user?.name || ticket.email}</p>
                <div className="mt-2 flex flex-wrap gap-1.5 text-[10px] text-[#666]">
                  <span className="rounded-[2px] bg-[#f3f4f6] px-2 py-0.5">{t(TICKET_STATUS_KEYS[ticket.status] || ticket.status)}</span>
                  <span className="rounded-[2px] bg-[#f9fafb] px-2 py-0.5">{t(TICKET_PRIORITY_KEYS[ticket.priority] || ticket.priority)}</span>
                  <span>{ticket._count?.messages || 0} {t("admin.customers.messagesCount")}</span>
                </div>
              </div>
              <p className="shrink-0 text-[10px] text-[#999]">{new Date(ticket.updatedAt).toLocaleString(dateLocale)}</p>
            </div>
          )}
        />
      )}

      {activeView.id === "b2b" && (
        <CenterList
          loading={loading}
          error={loadError}
          empty={t("admin.customers.noB2B")}
          rows={centerRows}
          renderRow={(user) => (
            <div key={user.id} className="flex items-start justify-between gap-3 rounded-[3px] border border-[#ececec] bg-white p-4">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-black">{user.companyName || user.name || user.email}</p>
                <p className="mt-0.5 text-xs text-[#999]">{user.email}</p>
                <div className="mt-2 flex flex-wrap gap-1.5 text-[10px] text-[#666]">
                  <span className="rounded-[2px] bg-[#f3f4f6] px-2 py-0.5">{user.partnerTier || t("admin.customers.noTier")}</span>
                  <span className="rounded-[2px] bg-[#f9fafb] px-2 py-0.5">{user.partnerDiscount || 0}%</span>
                  <span>{user._count?.orders || 0} {t("admin.customers.orders")}</span>
                </div>
              </div>
              <span className={`rounded-[2px] px-2 py-0.5 text-[10px] font-semibold ${user.b2bApproved ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                {user.b2bApproved ? t("admin.customers.approved") : t("admin.customers.pendingApproval")}
              </span>
            </div>
          )}
        />
      )}
    </div>
  );
}

function CenterList({ loading, error, empty, rows, renderRow }) {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-20 animate-pulse rounded-[3px] border border-[#ececec] bg-[#fafafa]" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-[3px] border border-red-200 bg-red-50 p-4 text-sm text-red-600">
        {error}
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div className="rounded-[3px] border border-[#e0e0e0] bg-white p-8 text-center text-sm text-[#999]">
        {empty}
      </div>
    );
  }

  return <div className="space-y-2">{rows.map(renderRow)}</div>;
}
