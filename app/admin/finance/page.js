"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

const formatCad = (cents) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(
    cents / 100
  );

function formatDate(dateStr) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("en-CA");
}

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "expenses", label: "Expenses" },
  { key: "invoices", label: "Invoices" },
  { key: "suppliers", label: "Suppliers" },
  { key: "profitability", label: "Profitability" },
];

const EXPENSE_CATEGORIES = [
  { value: "material", label: "Material", color: "bg-blue-500" },
  { value: "labor", label: "Labor", color: "bg-purple-500" },
  { value: "shipping", label: "Shipping", color: "bg-amber-500" },
  { value: "equipment", label: "Equipment", color: "bg-indigo-500" },
  { value: "rent", label: "Rent", color: "bg-rose-500" },
  { value: "utilities", label: "Utilities", color: "bg-cyan-500" },
  { value: "software", label: "Software", color: "bg-teal-500" },
  { value: "marketing", label: "Marketing", color: "bg-orange-500" },
  { value: "other", label: "Other", color: "bg-gray-400" },
];

const CATEGORY_MAP = Object.fromEntries(
  EXPENSE_CATEGORIES.map((c) => [c.value, c])
);

const INVOICE_STATUS_STYLES = {
  draft: "bg-gray-100 text-gray-700",
  sent: "bg-blue-100 text-blue-700",
  paid: "bg-green-100 text-green-700",
  overdue: "bg-red-100 text-red-700",
  void: "bg-gray-100 text-gray-500 line-through",
};

const TERMS_LABELS = {
  net_15: "Net 15",
  net_30: "Net 30",
  net_45: "Net 45",
  due_on_receipt: "Due on Receipt",
};

/* ══════════════════════════════════════════════ */
/*  MAIN FINANCE PAGE                            */
/* ══════════════════════════════════════════════ */

export default function FinancePage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [message, setMessage] = useState(null);

  function showMsg(text, isError = false) {
    setMessage({ text, isError });
    setTimeout(() => setMessage(null), 3500);
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-black">Finance</h1>
        <p className="text-xs text-[#999]">
          {new Date().toLocaleDateString("en-CA", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </p>
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

      {/* Tab navigation */}
      <div className="flex flex-wrap gap-1 border-b border-[#e0e0e0] pb-0">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`rounded-t-[3px] px-4 py-2 text-xs font-medium transition-colors ${
              activeTab === tab.key
                ? "border-b-2 border-black bg-white text-black"
                : "text-[#666] hover:bg-[#fafafa] hover:text-black"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "overview" && <OverviewTab />}
      {activeTab === "expenses" && <ExpensesTab showMsg={showMsg} />}
      {activeTab === "invoices" && <InvoicesTab showMsg={showMsg} />}
      {activeTab === "suppliers" && <SuppliersTab showMsg={showMsg} />}
      {activeTab === "profitability" && <ProfitabilityTab />}
    </div>
  );
}

/* ══════════════════════════════════════════════ */
/*  TAB 1: OVERVIEW                              */
/* ══════════════════════════════════════════════ */

function OverviewTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState("30d");

  const fetchOverview = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/finance?period=${period}`);
      if (!res.ok) throw new Error("Failed to fetch financial data");
      const json = await res.json();
      setData(json.data);
    } catch (err) {
      console.error("Finance overview error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-sm text-[#999]">Loading financial data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-sm text-red-500">{error}</div>
      </div>
    );
  }

  if (!data) return null;

  const monthRev = data.revenue.month;
  const monthExp = data.expenses.month;
  const monthProfit = monthRev - monthExp;
  const periodOrders = data.topProducts.reduce((s, p) => s + p.orderCount, 0);
  const avgOrderMargin =
    data.profit.marginPercent !== undefined ? data.profit.marginPercent : 0;

  const statCards = [
    {
      label: "Revenue (this month)",
      value: formatCad(monthRev),
      colorClass: "text-green-600",
      borderColor: "border-l-green-500",
    },
    {
      label: "Expenses (this month)",
      value: formatCad(monthExp),
      colorClass: "text-red-600",
      borderColor: "border-l-red-500",
    },
    {
      label: "Net Profit (this month)",
      value: formatCad(monthProfit),
      colorClass: monthProfit >= 0 ? "text-blue-600" : "text-red-600",
      borderColor: "border-l-blue-500",
    },
    {
      label: "Avg Order Margin",
      value: `${avgOrderMargin}%`,
      colorClass: "text-amber-600",
      borderColor: "border-l-amber-500",
    },
  ];

  // Expense breakdown totals
  const totalExpenseBreakdown = data.expenseBreakdown.reduce(
    (s, e) => s + e.total,
    0
  );

  // Revenue trend chart
  const trend = data.revenueTrend || [];
  const maxTrend = Math.max(...trend.map((d) => d.amount), 1);

  return (
    <div className="space-y-6">
      {/* Period selector */}
      <div className="flex justify-end">
        <div className="flex flex-wrap gap-1">
          {[
            { key: "7d", label: "7 Days" },
            { key: "30d", label: "30 Days" },
            { key: "90d", label: "90 Days" },
            { key: "12m", label: "12 Months" },
          ].map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => setPeriod(p.key)}
              className={`rounded-[3px] px-3 py-1.5 text-xs font-medium transition-colors ${
                period === p.key
                  ? "bg-black text-[#fff]"
                  : "bg-white text-[#666] hover:bg-[#fafafa]"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className={`rounded-[3px] border border-[#e0e0e0] border-l-4 ${card.borderColor} bg-white p-5`}
          >
            <p className="text-xs text-[#999]">{card.label}</p>
            <p className={`mt-1 text-2xl font-semibold ${card.colorClass}`}>
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {/* Revenue vs Expense trend chart */}
      <div className="rounded-[3px] border border-[#e0e0e0] bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-black">Revenue Trend</h2>
          <p className="text-xs text-[#999]">
            {trend.length} {period === "12m" ? "months" : "days"}
          </p>
        </div>

        {trend.length === 0 ? (
          <div className="flex h-48 items-center justify-center text-sm text-[#999]">
            No revenue data for this period
          </div>
        ) : (
          <>
            <div
              className="flex items-end gap-[2px]"
              style={{ height: "200px" }}
            >
              {trend.map((d) => {
                const heightPercent = (d.amount / maxTrend) * 100;
                return (
                  <div
                    key={d.date}
                    className="group relative flex flex-1 flex-col items-center justify-end"
                    style={{ height: "100%" }}
                  >
                    {/* Tooltip */}
                    <div
                      className="pointer-events-none absolute bottom-full mb-2 hidden rounded-[3px] border border-[#e0e0e0] bg-white px-3 py-2 shadow-lg group-hover:block"
                      style={{ zIndex: 10, whiteSpace: "nowrap" }}
                    >
                      <p className="text-xs font-semibold text-black">
                        {formatCad(d.amount)}
                      </p>
                      <p className="text-xs text-[#999]">
                        {new Date(d.date).toLocaleDateString("en-CA", {
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                    <div
                      className="w-full cursor-pointer rounded-t bg-green-500 transition-colors hover:bg-green-600"
                      style={{
                        height: `${Math.max(heightPercent, 1)}%`,
                        minHeight: "2px",
                      }}
                    />
                  </div>
                );
              })}
            </div>

            {/* Date labels */}
            {(() => {
              const showEveryN =
                trend.length > 15 ? Math.ceil(trend.length / 10) : 1;
              return (
                <div className="mt-2 flex gap-[2px]">
                  {trend.map((d, i) => (
                    <div key={d.date} className="flex-1 text-center">
                      {i % showEveryN === 0 ? (
                        <span className="text-[10px] text-[#999]">
                          {new Date(d.date).toLocaleDateString("en-CA", {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      ) : null}
                    </div>
                  ))}
                </div>
              );
            })()}
          </>
        )}
      </div>

      {/* Bottom grid: Expense breakdown + Top products */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Expense breakdown */}
        <div className="rounded-[3px] border border-[#e0e0e0] bg-white">
          <div className="border-b border-[#e0e0e0] px-5 py-4">
            <h2 className="text-sm font-semibold text-black">
              Expense Breakdown by Category
            </h2>
          </div>

          {data.expenseBreakdown.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-[#999]">
              No expenses recorded in this period
            </div>
          ) : (
            <div className="space-y-3 p-5">
              {data.expenseBreakdown
                .sort((a, b) => b.total - a.total)
                .map((exp) => {
                  const cat = CATEGORY_MAP[exp.category] || {
                    label: exp.category,
                    color: "bg-gray-400",
                  };
                  const pct =
                    totalExpenseBreakdown > 0
                      ? ((exp.total / totalExpenseBreakdown) * 100).toFixed(1)
                      : 0;
                  return (
                    <div key={exp.category}>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="font-medium text-black">
                          {cat.label}
                        </span>
                        <span className="text-[#666]">
                          {formatCad(exp.total)} ({pct}%)
                        </span>
                      </div>
                      <div className="h-3 w-full overflow-hidden rounded-[2px] bg-[#f0f0f0]">
                        <div
                          className={`h-full ${cat.color} transition-all`}
                          style={{
                            width: `${
                              totalExpenseBreakdown > 0
                                ? (exp.total / totalExpenseBreakdown) * 100
                                : 0
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {/* Top 5 products */}
        <div className="rounded-[3px] border border-[#e0e0e0] bg-white">
          <div className="border-b border-[#e0e0e0] px-5 py-4">
            <h2 className="text-sm font-semibold text-black">
              Top 5 Products by Revenue
            </h2>
          </div>

          {data.topProducts.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-[#999]">
              No product data for this period
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#e0e0e0] bg-[#fafafa]">
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-[#999]">
                      Product
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-[#999]">
                      Revenue
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-[#999]">
                      Orders
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e0e0e0]">
                  {data.topProducts.map((product, i) => (
                    <tr
                      key={`${product.productName}-${i}`}
                      className="hover:bg-[#fafafa]"
                    >
                      <td className="px-4 py-3">
                        <p className="max-w-[200px] truncate font-medium text-black">
                          {product.productName}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-black">
                        {formatCad(product.revenue)}
                      </td>
                      <td className="px-4 py-3 text-right text-[#666]">
                        {product.orderCount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════ */
/*  TAB 2: EXPENSES                              */
/* ══════════════════════════════════════════════ */

function ExpensesTab({ showMsg }) {
  const [expenses, setExpenses] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [suppliers, setSuppliers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [saving, setSaving] = useState(false);

  // Filters
  const [filterCategory, setFilterCategory] = useState("");
  const [filterSupplier, setFilterSupplier] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [page, setPage] = useState(1);

  // Fetch suppliers for dropdowns
  useEffect(() => {
    fetch("/api/admin/finance/suppliers?limit=100")
      .then((r) => r.json())
      .then((json) => setSuppliers(json.data || []))
      .catch(() => {});
  }, []);

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", "20");
    if (filterCategory) params.set("category", filterCategory);
    if (filterSupplier) params.set("supplierId", filterSupplier);
    if (filterFrom) params.set("from", filterFrom);
    if (filterTo) params.set("to", filterTo);

    try {
      const res = await fetch(`/api/admin/finance/expenses?${params}`);
      const json = await res.json();
      setExpenses(json.data || []);
      setPagination(json.pagination || null);
    } catch (err) {
      console.error("Failed to load expenses:", err);
    } finally {
      setLoading(false);
    }
  }, [page, filterCategory, filterSupplier, filterFrom, filterTo]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);

    const fd = new FormData(e.target);
    const amountDollars = parseFloat(fd.get("amountDollars"));
    if (isNaN(amountDollars) || amountDollars <= 0) {
      showMsg("Amount must be a positive number", true);
      setSaving(false);
      return;
    }

    const payload = {
      category: fd.get("category"),
      description: fd.get("description"),
      amountCents: Math.round(amountDollars * 100),
      date: fd.get("date") || undefined,
      supplierId: fd.get("supplierId") || null,
      receiptUrl: fd.get("receiptUrl") || null,
      notes: fd.get("notes") || null,
    };

    try {
      const url = editingExpense
        ? `/api/admin/finance/expenses/${editingExpense.id}`
        : "/api/admin/finance/expenses";
      const method = editingExpense ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (!res.ok) {
        showMsg(json.error || "Failed to save expense", true);
      } else {
        showMsg(editingExpense ? "Expense updated" : "Expense created");
        setShowForm(false);
        setEditingExpense(null);
        fetchExpenses();
      }
    } catch {
      showMsg("Network error", true);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(expense) {
    if (
      !window.confirm(
        `Delete expense "${expense.description}" (${formatCad(expense.amountCents)})?`
      )
    )
      return;

    try {
      const res = await fetch(`/api/admin/finance/expenses/${expense.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) {
        showMsg(json.error || "Failed to delete expense", true);
      } else {
        showMsg("Expense deleted");
        fetchExpenses();
      }
    } catch {
      showMsg("Network error", true);
    }
  }

  function openEdit(expense) {
    setEditingExpense(expense);
    setShowForm(true);
  }

  function openCreate() {
    setEditingExpense(null);
    setShowForm(true);
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <div>
          <label className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-[#999]">
            Category
          </label>
          <select
            value={filterCategory}
            onChange={(e) => {
              setFilterCategory(e.target.value);
              setPage(1);
            }}
            className="w-36 rounded-[3px] border border-[#d0d0d0] px-2 py-1.5 text-xs outline-none focus:border-black"
          >
            <option value="">All Categories</option>
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-[#999]">
            Supplier
          </label>
          <select
            value={filterSupplier}
            onChange={(e) => {
              setFilterSupplier(e.target.value);
              setPage(1);
            }}
            className="w-36 rounded-[3px] border border-[#d0d0d0] px-2 py-1.5 text-xs outline-none focus:border-black"
          >
            <option value="">All Suppliers</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-[#999]">
            From
          </label>
          <input
            type="date"
            value={filterFrom}
            onChange={(e) => {
              setFilterFrom(e.target.value);
              setPage(1);
            }}
            className="rounded-[3px] border border-[#d0d0d0] px-2 py-1.5 text-xs outline-none focus:border-black"
          />
        </div>

        <div>
          <label className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-[#999]">
            To
          </label>
          <input
            type="date"
            value={filterTo}
            onChange={(e) => {
              setFilterTo(e.target.value);
              setPage(1);
            }}
            className="rounded-[3px] border border-[#d0d0d0] px-2 py-1.5 text-xs outline-none focus:border-black"
          />
        </div>

        <div className="sm:ml-auto">
          <button
            type="button"
            onClick={openCreate}
            className="rounded-[3px] bg-black px-4 py-2 text-xs font-semibold text-[#fff] hover:bg-[#222]"
          >
            Add Expense
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-[3px] border border-[#e0e0e0] bg-white">
        {loading ? (
          <div className="flex h-48 items-center justify-center text-sm text-[#999]">
            Loading expenses...
          </div>
        ) : expenses.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center gap-2 text-sm text-[#999]">
            <p>No expenses found</p>
            <button
              type="button"
              onClick={openCreate}
              className="text-xs text-black underline hover:no-underline"
            >
              Add your first expense
            </button>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#e0e0e0] bg-[#fafafa]">
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-[#999]">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-[#999]">
                      Category
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-[#999]">
                      Description
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-[#999]">
                      Amount
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-[#999]">
                      Supplier
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-[#999]">
                      Receipt
                    </th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e0e0e0]">
                  {expenses.map((exp) => {
                    const cat = CATEGORY_MAP[exp.category] || {
                      label: exp.category,
                      color: "bg-gray-400",
                    };
                    return (
                      <tr key={exp.id} className="hover:bg-[#fafafa]">
                        <td className="px-4 py-3 text-xs text-[#666]">
                          {formatDate(exp.date)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-block rounded-[2px] px-2.5 py-0.5 text-xs font-medium text-white ${cat.color}`}
                          >
                            {cat.label}
                          </span>
                        </td>
                        <td className="max-w-[200px] truncate px-4 py-3 text-sm text-black">
                          {exp.description}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-black">
                          {formatCad(exp.amountCents)}
                        </td>
                        <td className="px-4 py-3 text-xs text-[#666]">
                          {exp.supplier?.name || "-"}
                        </td>
                        <td className="px-4 py-3">
                          {exp.receiptUrl ? (
                            <a
                              href={exp.receiptUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 underline hover:no-underline"
                            >
                              View
                            </a>
                          ) : (
                            <span className="text-xs text-[#999]">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => openEdit(exp)}
                              className="text-xs font-medium text-black underline hover:no-underline"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(exp)}
                              className="text-xs font-medium text-red-500 hover:text-red-700"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="divide-y divide-[#e0e0e0] lg:hidden">
              {expenses.map((exp) => {
                const cat = CATEGORY_MAP[exp.category] || {
                  label: exp.category,
                  color: "bg-gray-400",
                };
                return (
                  <div key={exp.id} className="px-4 py-3">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-black">
                          {exp.description}
                        </p>
                        <div className="mt-1 flex items-center gap-2">
                          <span
                            className={`inline-block rounded-[2px] px-2 py-0.5 text-[10px] font-medium text-white ${cat.color}`}
                          >
                            {cat.label}
                          </span>
                          <span className="text-xs text-[#999]">
                            {formatDate(exp.date)}
                          </span>
                        </div>
                      </div>
                      <span className="shrink-0 text-sm font-semibold text-black">
                        {formatCad(exp.amountCents)}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => openEdit(exp)}
                        className="text-xs font-medium text-black underline hover:no-underline"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(exp)}
                        className="text-xs font-medium text-red-500 hover:text-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
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
              onClick={() => setPage(page - 1)}
              className="rounded-[3px] border border-[#d0d0d0] px-3 py-1.5 text-xs font-medium text-black hover:bg-[#fafafa] disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page >= pagination.pages}
              onClick={() => setPage(page + 1)}
              className="rounded-[3px] border border-[#d0d0d0] px-3 py-1.5 text-xs font-medium text-black hover:bg-[#fafafa] disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Create/Edit modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-[3px] bg-white p-8 shadow-xl">
            <h2 className="mb-6 text-lg font-semibold text-black">
              {editingExpense ? "Edit Expense" : "Add Expense"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#999]">
                    Category *
                  </label>
                  <select
                    name="category"
                    required
                    defaultValue={editingExpense?.category || "material"}
                    className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-black"
                  >
                    {EXPENSE_CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#999]">
                    Amount (CAD) *
                  </label>
                  <input
                    name="amountDollars"
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    defaultValue={
                      editingExpense
                        ? (editingExpense.amountCents / 100).toFixed(2)
                        : ""
                    }
                    placeholder="0.00"
                    className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-black"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-[#999]">
                  Description *
                </label>
                <input
                  name="description"
                  required
                  defaultValue={editingExpense?.description || ""}
                  placeholder="e.g. White vinyl roll 54&quot; x 150'"
                  className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-black"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#999]">
                    Date
                  </label>
                  <input
                    name="date"
                    type="date"
                    defaultValue={
                      editingExpense
                        ? new Date(editingExpense.date)
                            .toISOString()
                            .split("T")[0]
                        : todayStr()
                    }
                    className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-black"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#999]">
                    Supplier
                  </label>
                  <select
                    name="supplierId"
                    defaultValue={editingExpense?.supplierId || ""}
                    className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-black"
                  >
                    <option value="">None</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-[#999]">
                  Receipt URL
                </label>
                <input
                  name="receiptUrl"
                  type="url"
                  defaultValue={editingExpense?.receiptUrl || ""}
                  placeholder="https://..."
                  className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-[#999]">
                  Notes
                </label>
                <textarea
                  name="notes"
                  rows={2}
                  defaultValue={editingExpense?.notes || ""}
                  placeholder="Optional internal note"
                  className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-black"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 rounded-[3px] bg-black py-2.5 text-sm font-semibold text-[#fff] hover:bg-[#222] disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editingExpense
                      ? "Update Expense"
                      : "Create Expense"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingExpense(null);
                  }}
                  className="flex-1 rounded-[3px] border border-[#e0e0e0] py-2.5 text-sm font-medium text-black hover:bg-[#fafafa]"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════ */
/*  TAB 3: INVOICES                              */
/* ══════════════════════════════════════════════ */

function InvoicesTab({ showMsg }) {
  const [invoices, setInvoices] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [saving, setSaving] = useState(false);

  // Filters
  const [filterStatus, setFilterStatus] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [page, setPage] = useState(1);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", "20");
    if (filterStatus) params.set("status", filterStatus);
    if (filterFrom) params.set("from", filterFrom);
    if (filterTo) params.set("to", filterTo);

    try {
      const res = await fetch(`/api/admin/finance/invoices?${params}`);
      const json = await res.json();
      setInvoices(json.data || []);
      setPagination(json.pagination || null);
    } catch (err) {
      console.error("Failed to load invoices:", err);
    } finally {
      setLoading(false);
    }
  }, [page, filterStatus, filterFrom, filterTo]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);

    const fd = new FormData(e.target);
    const subtotalDollars = parseFloat(fd.get("subtotalDollars"));
    const taxDollars = parseFloat(fd.get("taxDollars") || "0");

    if (isNaN(subtotalDollars) || subtotalDollars < 0) {
      showMsg("Subtotal must be a non-negative number", true);
      setSaving(false);
      return;
    }

    const subtotalCents = Math.round(subtotalDollars * 100);
    const taxCents = Math.round(taxDollars * 100);
    const totalCents = subtotalCents + taxCents;

    const payload = {
      customerEmail: fd.get("customerEmail"),
      customerName: fd.get("customerName") || null,
      companyName: fd.get("companyName") || null,
      subtotalCents,
      taxCents,
      totalCents,
      terms: fd.get("terms") || "net_30",
      status: fd.get("status") || "draft",
      issuedAt: fd.get("issuedAt") || null,
      dueAt: fd.get("dueAt") || null,
      notes: fd.get("notes") || null,
    };

    try {
      const url = editingInvoice
        ? `/api/admin/finance/invoices/${editingInvoice.id}`
        : "/api/admin/finance/invoices";
      const method = editingInvoice ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (!res.ok) {
        showMsg(json.error || "Failed to save invoice", true);
      } else {
        showMsg(editingInvoice ? "Invoice updated" : "Invoice created");
        setShowForm(false);
        setEditingInvoice(null);
        fetchInvoices();
      }
    } catch {
      showMsg("Network error", true);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(invoice) {
    if (
      !window.confirm(
        `Delete invoice ${invoice.invoiceNumber}? This cannot be undone.`
      )
    )
      return;

    try {
      const res = await fetch(`/api/admin/finance/invoices/${invoice.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) {
        showMsg(json.error || "Failed to delete invoice", true);
      } else {
        showMsg("Invoice deleted");
        fetchInvoices();
      }
    } catch {
      showMsg("Network error", true);
    }
  }

  async function handleStatusChange(invoice, newStatus) {
    try {
      const res = await fetch(`/api/admin/finance/invoices/${invoice.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();
      if (!res.ok) {
        showMsg(json.error || "Failed to update status", true);
      } else {
        showMsg(`Invoice marked as ${newStatus}`);
        fetchInvoices();
      }
    } catch {
      showMsg("Network error", true);
    }
  }

  function openEdit(invoice) {
    setEditingInvoice(invoice);
    setShowForm(true);
  }

  function openCreate() {
    setEditingInvoice(null);
    setShowForm(true);
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <div>
          <label className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-[#999]">
            Status
          </label>
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setPage(1);
            }}
            className="w-36 rounded-[3px] border border-[#d0d0d0] px-2 py-1.5 text-xs outline-none focus:border-black"
          >
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
            <option value="void">Void</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-[#999]">
            From
          </label>
          <input
            type="date"
            value={filterFrom}
            onChange={(e) => {
              setFilterFrom(e.target.value);
              setPage(1);
            }}
            className="rounded-[3px] border border-[#d0d0d0] px-2 py-1.5 text-xs outline-none focus:border-black"
          />
        </div>

        <div>
          <label className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-[#999]">
            To
          </label>
          <input
            type="date"
            value={filterTo}
            onChange={(e) => {
              setFilterTo(e.target.value);
              setPage(1);
            }}
            className="rounded-[3px] border border-[#d0d0d0] px-2 py-1.5 text-xs outline-none focus:border-black"
          />
        </div>

        <div className="sm:ml-auto">
          <button
            type="button"
            onClick={openCreate}
            className="rounded-[3px] bg-black px-4 py-2 text-xs font-semibold text-[#fff] hover:bg-[#222]"
          >
            Create Invoice
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-[3px] border border-[#e0e0e0] bg-white">
        {loading ? (
          <div className="flex h-48 items-center justify-center text-sm text-[#999]">
            Loading invoices...
          </div>
        ) : invoices.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center gap-2 text-sm text-[#999]">
            <p>No invoices found</p>
            <button
              type="button"
              onClick={openCreate}
              className="text-xs text-black underline hover:no-underline"
            >
              Create your first invoice
            </button>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#e0e0e0] bg-[#fafafa]">
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-[#999]">
                      Invoice #
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-[#999]">
                      Customer
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-[#999]">
                      Company
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-[#999]">
                      Amount
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-[#999]">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-[#999]">
                      Terms
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-[#999]">
                      Due Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-[#999]">
                      Issued
                    </th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e0e0e0]">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-[#fafafa]">
                      <td className="px-4 py-3">
                        <span className="font-mono text-sm font-semibold text-black">
                          {inv.invoiceNumber}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="max-w-[160px] truncate text-sm text-black">
                          {inv.customerName || inv.customerEmail}
                        </p>
                        {inv.customerName && (
                          <p className="max-w-[160px] truncate text-xs text-[#999]">
                            {inv.customerEmail}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-[#666]">
                        {inv.companyName || "-"}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-black">
                        {formatCad(inv.totalCents)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block rounded-[2px] px-2.5 py-0.5 text-xs font-medium capitalize ${
                            INVOICE_STATUS_STYLES[inv.status] ||
                            "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-[#666]">
                        {TERMS_LABELS[inv.terms] || inv.terms}
                      </td>
                      <td className="px-4 py-3 text-xs text-[#666]">
                        {formatDate(inv.dueAt)}
                      </td>
                      <td className="px-4 py-3 text-xs text-[#999]">
                        {formatDate(inv.issuedAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          {inv.status === "draft" && (
                            <button
                              type="button"
                              onClick={() =>
                                handleStatusChange(inv, "sent")
                              }
                              className="text-xs font-medium text-blue-600 hover:text-blue-800"
                            >
                              Send
                            </button>
                          )}
                          {(inv.status === "sent" ||
                            inv.status === "overdue") && (
                            <button
                              type="button"
                              onClick={() =>
                                handleStatusChange(inv, "paid")
                              }
                              className="text-xs font-medium text-green-600 hover:text-green-800"
                            >
                              Mark Paid
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => openEdit(inv)}
                            className="text-xs font-medium text-black underline hover:no-underline"
                          >
                            Edit
                          </button>
                          {inv.status !== "paid" && (
                            <button
                              type="button"
                              onClick={() => handleDelete(inv)}
                              className="text-xs font-medium text-red-500 hover:text-red-700"
                            >
                              Delete
                            </button>
                          )}
                          {inv.status === "paid" && (
                            <button
                              type="button"
                              onClick={() =>
                                handleStatusChange(inv, "void")
                              }
                              className="text-xs font-medium text-red-500 hover:text-red-700"
                            >
                              Void
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="divide-y divide-[#e0e0e0] lg:hidden">
              {invoices.map((inv) => (
                <div key={inv.id} className="px-4 py-3">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0">
                      <p className="font-mono text-sm font-semibold text-black">
                        {inv.invoiceNumber}
                      </p>
                      <p className="mt-0.5 text-xs text-[#666]">
                        {inv.customerName || inv.customerEmail}
                        {inv.companyName && ` - ${inv.companyName}`}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span
                        className={`rounded-[2px] px-2 py-0.5 text-[10px] font-medium capitalize ${
                          INVOICE_STATUS_STYLES[inv.status] ||
                          "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {inv.status}
                      </span>
                      <span className="text-sm font-semibold text-black">
                        {formatCad(inv.totalCents)}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => openEdit(inv)}
                      className="text-xs font-medium text-black underline hover:no-underline"
                    >
                      Edit
                    </button>
                    {inv.status !== "paid" && (
                      <button
                        type="button"
                        onClick={() => handleDelete(inv)}
                        className="text-xs font-medium text-red-500 hover:text-red-700"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
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
              onClick={() => setPage(page - 1)}
              className="rounded-[3px] border border-[#d0d0d0] px-3 py-1.5 text-xs font-medium text-black hover:bg-[#fafafa] disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page >= pagination.pages}
              onClick={() => setPage(page + 1)}
              className="rounded-[3px] border border-[#d0d0d0] px-3 py-1.5 text-xs font-medium text-black hover:bg-[#fafafa] disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Create/Edit Invoice modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-[3px] bg-white p-8 shadow-xl">
            <h2 className="mb-6 text-lg font-semibold text-black">
              {editingInvoice ? "Edit Invoice" : "Create Invoice"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-[#999]">
                  Customer Email *
                </label>
                <input
                  name="customerEmail"
                  type="email"
                  required
                  defaultValue={editingInvoice?.customerEmail || ""}
                  placeholder="customer@example.com"
                  className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-black"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#999]">
                    Customer Name
                  </label>
                  <input
                    name="customerName"
                    defaultValue={editingInvoice?.customerName || ""}
                    placeholder="John Smith"
                    className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-black"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#999]">
                    Company Name
                  </label>
                  <input
                    name="companyName"
                    defaultValue={editingInvoice?.companyName || ""}
                    placeholder="Acme Inc."
                    className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-black"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#999]">
                    Subtotal (CAD) *
                  </label>
                  <input
                    name="subtotalDollars"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    defaultValue={
                      editingInvoice
                        ? (editingInvoice.subtotalCents / 100).toFixed(2)
                        : ""
                    }
                    placeholder="0.00"
                    className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-black"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#999]">
                    Tax (CAD)
                  </label>
                  <input
                    name="taxDollars"
                    type="number"
                    step="0.01"
                    min="0"
                    defaultValue={
                      editingInvoice
                        ? (editingInvoice.taxCents / 100).toFixed(2)
                        : "0.00"
                    }
                    placeholder="0.00"
                    className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-black"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#999]">
                    Terms
                  </label>
                  <select
                    name="terms"
                    defaultValue={editingInvoice?.terms || "net_30"}
                    className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-black"
                  >
                    <option value="due_on_receipt">Due on Receipt</option>
                    <option value="net_15">Net 15</option>
                    <option value="net_30">Net 30</option>
                    <option value="net_45">Net 45</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#999]">
                    Status
                  </label>
                  <select
                    name="status"
                    defaultValue={editingInvoice?.status || "draft"}
                    className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-black"
                  >
                    <option value="draft">Draft</option>
                    <option value="sent">Sent</option>
                    <option value="paid">Paid</option>
                    <option value="overdue">Overdue</option>
                    <option value="void">Void</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#999]">
                    Issue Date
                  </label>
                  <input
                    name="issuedAt"
                    type="date"
                    defaultValue={
                      editingInvoice?.issuedAt
                        ? new Date(editingInvoice.issuedAt)
                            .toISOString()
                            .split("T")[0]
                        : todayStr()
                    }
                    className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-black"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#999]">
                    Due Date
                  </label>
                  <input
                    name="dueAt"
                    type="date"
                    defaultValue={
                      editingInvoice?.dueAt
                        ? new Date(editingInvoice.dueAt)
                            .toISOString()
                            .split("T")[0]
                        : ""
                    }
                    className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-black"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-[#999]">
                  Notes
                </label>
                <textarea
                  name="notes"
                  rows={2}
                  defaultValue={editingInvoice?.notes || ""}
                  placeholder="Optional notes"
                  className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-black"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 rounded-[3px] bg-black py-2.5 text-sm font-semibold text-[#fff] hover:bg-[#222] disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editingInvoice
                      ? "Update Invoice"
                      : "Create Invoice"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingInvoice(null);
                  }}
                  className="flex-1 rounded-[3px] border border-[#e0e0e0] py-2.5 text-sm font-medium text-black hover:bg-[#fafafa]"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════ */
/*  TAB 4: SUPPLIERS                             */
/* ══════════════════════════════════════════════ */

function SuppliersTab({ showMsg }) {
  const [suppliers, setSuppliers] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);

  const fetchSuppliers = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", "20");

    try {
      const res = await fetch(`/api/admin/finance/suppliers?${params}`);
      const json = await res.json();
      setSuppliers(json.data || []);
      setPagination(json.pagination || null);
    } catch (err) {
      console.error("Failed to load suppliers:", err);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);

    const fd = new FormData(e.target);
    const payload = {
      name: fd.get("name"),
      contactName: fd.get("contactName") || null,
      email: fd.get("email") || null,
      phone: fd.get("phone") || null,
      website: fd.get("website") || null,
      address: fd.get("address") || null,
      notes: fd.get("notes") || null,
    };

    try {
      const url = editingSupplier
        ? `/api/admin/finance/suppliers/${editingSupplier.id}`
        : "/api/admin/finance/suppliers";
      const method = editingSupplier ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (!res.ok) {
        showMsg(json.error || "Failed to save supplier", true);
      } else {
        showMsg(editingSupplier ? "Supplier updated" : "Supplier created");
        setShowForm(false);
        setEditingSupplier(null);
        fetchSuppliers();
      }
    } catch {
      showMsg("Network error", true);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(supplier) {
    if (
      !window.confirm(
        `Delete supplier "${supplier.name}"? This cannot be undone.`
      )
    )
      return;

    try {
      const res = await fetch(`/api/admin/finance/suppliers/${supplier.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) {
        showMsg(json.error || "Failed to delete supplier", true);
      } else {
        showMsg("Supplier deleted");
        fetchSuppliers();
      }
    } catch {
      showMsg("Network error", true);
    }
  }

  async function toggleActive(supplier) {
    try {
      const res = await fetch(`/api/admin/finance/suppliers/${supplier.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !supplier.isActive }),
      });
      const json = await res.json();
      if (!res.ok) {
        showMsg(json.error || "Failed to update supplier", true);
      } else {
        showMsg(
          `Supplier ${supplier.isActive ? "deactivated" : "activated"}`
        );
        fetchSuppliers();
      }
    } catch {
      showMsg("Network error", true);
    }
  }

  function openEdit(supplier) {
    setEditingSupplier(supplier);
    setShowForm(true);
  }

  function openCreate() {
    setEditingSupplier(null);
    setShowForm(true);
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={openCreate}
          className="rounded-[3px] bg-black px-4 py-2 text-xs font-semibold text-[#fff] hover:bg-[#222]"
        >
          Add Supplier
        </button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-[3px] border border-[#e0e0e0] bg-white">
        {loading ? (
          <div className="flex h-48 items-center justify-center text-sm text-[#999]">
            Loading suppliers...
          </div>
        ) : suppliers.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center gap-2 text-sm text-[#999]">
            <p>No suppliers yet</p>
            <button
              type="button"
              onClick={openCreate}
              className="text-xs text-black underline hover:no-underline"
            >
              Add your first supplier
            </button>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#e0e0e0] bg-[#fafafa]">
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-[#999]">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-[#999]">
                      Contact
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-[#999]">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-[#999]">
                      Phone
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-[#999]">
                      Expenses
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-[#999]">
                      Status
                    </th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e0e0e0]">
                  {suppliers.map((sup) => (
                    <tr key={sup.id} className="hover:bg-[#fafafa]">
                      <td className="px-4 py-3">
                        <p className="font-medium text-black">{sup.name}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-[#666]">
                        {sup.contactName || "-"}
                      </td>
                      <td className="px-4 py-3 text-xs text-[#666]">
                        {sup.email || "-"}
                      </td>
                      <td className="px-4 py-3 text-xs text-[#666]">
                        {sup.phone || "-"}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-medium text-black">
                        {sup._count?.expenses ?? 0}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => toggleActive(sup)}
                          className={`inline-block rounded-[2px] px-2.5 py-0.5 text-xs font-medium ${
                            sup.isActive
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-[#999]"
                          }`}
                        >
                          {sup.isActive ? "Active" : "Inactive"}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEdit(sup)}
                            className="text-xs font-medium text-black underline hover:no-underline"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(sup)}
                            className="text-xs font-medium text-red-500 hover:text-red-700"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="divide-y divide-[#e0e0e0] lg:hidden">
              {suppliers.map((sup) => (
                <div key={sup.id} className="px-4 py-3">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-black">
                        {sup.name}
                      </p>
                      <p className="mt-0.5 text-xs text-[#999]">
                        {sup.contactName || sup.email || "No contact info"}
                      </p>
                    </div>
                    <span
                      className={`rounded-[2px] px-2 py-0.5 text-[10px] font-medium ${
                        sup.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-[#999]"
                      }`}
                    >
                      {sup.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => openEdit(sup)}
                      className="text-xs font-medium text-black underline hover:no-underline"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleActive(sup)}
                      className="text-xs font-medium text-[#666]"
                    >
                      {sup.isActive ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(sup)}
                      className="text-xs font-medium text-red-500 hover:text-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
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
              onClick={() => setPage(page - 1)}
              className="rounded-[3px] border border-[#d0d0d0] px-3 py-1.5 text-xs font-medium text-black hover:bg-[#fafafa] disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page >= pagination.pages}
              onClick={() => setPage(page + 1)}
              className="rounded-[3px] border border-[#d0d0d0] px-3 py-1.5 text-xs font-medium text-black hover:bg-[#fafafa] disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Create/Edit Supplier modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-[3px] bg-white p-8 shadow-xl">
            <h2 className="mb-6 text-lg font-semibold text-black">
              {editingSupplier ? "Edit Supplier" : "Add Supplier"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-[#999]">
                  Supplier Name *
                </label>
                <input
                  name="name"
                  required
                  defaultValue={editingSupplier?.name || ""}
                  placeholder="e.g. 3M Canada"
                  className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-black"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#999]">
                    Contact Name
                  </label>
                  <input
                    name="contactName"
                    defaultValue={editingSupplier?.contactName || ""}
                    placeholder="Jane Doe"
                    className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-black"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#999]">
                    Email
                  </label>
                  <input
                    name="email"
                    type="email"
                    defaultValue={editingSupplier?.email || ""}
                    placeholder="contact@supplier.com"
                    className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-black"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#999]">
                    Phone
                  </label>
                  <input
                    name="phone"
                    defaultValue={editingSupplier?.phone || ""}
                    placeholder="(416) 555-0123"
                    className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-black"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#999]">
                    Website
                  </label>
                  <input
                    name="website"
                    type="url"
                    defaultValue={editingSupplier?.website || ""}
                    placeholder="https://..."
                    className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-black"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-[#999]">
                  Address
                </label>
                <input
                  name="address"
                  defaultValue={editingSupplier?.address || ""}
                  placeholder="123 Main St, Toronto, ON"
                  className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-[#999]">
                  Notes
                </label>
                <textarea
                  name="notes"
                  rows={2}
                  defaultValue={editingSupplier?.notes || ""}
                  placeholder="Internal notes about this supplier"
                  className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-black"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 rounded-[3px] bg-black py-2.5 text-sm font-semibold text-[#fff] hover:bg-[#222] disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editingSupplier
                      ? "Update Supplier"
                      : "Add Supplier"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingSupplier(null);
                  }}
                  className="flex-1 rounded-[3px] border border-[#e0e0e0] py-2.5 text-sm font-medium text-black hover:bg-[#fafafa]"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════ */
/*  TAB 5: PROFITABILITY                         */
/* ══════════════════════════════════════════════ */

function ProfitabilityTab() {
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [page, setPage] = useState(1);

  const fetchProfitability = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", "20");
    if (filterFrom) params.set("from", filterFrom);
    if (filterTo) params.set("to", filterTo);

    try {
      const res = await fetch(`/api/admin/finance/profitability?${params}`);
      if (!res.ok) throw new Error("Failed to fetch profitability data");
      const json = await res.json();
      setData(json.data || []);
      setSummary(json.summary || null);
      setPagination(json.pagination || null);
    } catch (err) {
      console.error("Profitability error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, filterFrom, filterTo]);

  useEffect(() => {
    fetchProfitability();
  }, [fetchProfitability]);

  function marginColor(margin) {
    if (margin >= 30) return "text-green-600";
    if (margin >= 10) return "text-amber-600";
    return "text-red-600";
  }

  function marginBg(margin) {
    if (margin >= 30) return "bg-green-50";
    if (margin >= 10) return "bg-amber-50";
    return "bg-red-50";
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <div>
          <label className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-[#999]">
            From
          </label>
          <input
            type="date"
            value={filterFrom}
            onChange={(e) => {
              setFilterFrom(e.target.value);
              setPage(1);
            }}
            className="rounded-[3px] border border-[#d0d0d0] px-2 py-1.5 text-xs outline-none focus:border-black"
          />
        </div>
        <div>
          <label className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-[#999]">
            To
          </label>
          <input
            type="date"
            value={filterTo}
            onChange={(e) => {
              setFilterTo(e.target.value);
              setPage(1);
            }}
            className="rounded-[3px] border border-[#d0d0d0] px-2 py-1.5 text-xs outline-none focus:border-black"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="text-sm text-[#999]">Loading profitability...</div>
        </div>
      ) : error ? (
        <div className="flex h-64 items-center justify-center">
          <div className="text-sm text-red-500">{error}</div>
        </div>
      ) : (
        <>
          {/* Summary cards */}
          {summary && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-[3px] border border-[#e0e0e0] border-l-4 border-l-green-500 bg-white p-5">
                <p className="text-xs text-[#999]">Total Revenue</p>
                <p className="mt-1 text-2xl font-semibold text-green-600">
                  {formatCad(summary.totalRevenue)}
                </p>
                <p className="mt-1 text-xs text-[#999]">
                  {summary.orderCount} orders (this page)
                </p>
              </div>
              <div className="rounded-[3px] border border-[#e0e0e0] border-l-4 border-l-red-500 bg-white p-5">
                <p className="text-xs text-[#999]">Total Costs</p>
                <p className="mt-1 text-2xl font-semibold text-red-600">
                  {formatCad(summary.totalCosts)}
                </p>
              </div>
              <div className="rounded-[3px] border border-[#e0e0e0] border-l-4 border-l-blue-500 bg-white p-5">
                <p className="text-xs text-[#999]">Total Profit</p>
                <p
                  className={`mt-1 text-2xl font-semibold ${
                    summary.totalProfit >= 0 ? "text-blue-600" : "text-red-600"
                  }`}
                >
                  {formatCad(summary.totalProfit)}
                </p>
              </div>
              <div className="rounded-[3px] border border-[#e0e0e0] border-l-4 border-l-amber-500 bg-white p-5">
                <p className="text-xs text-[#999]">Avg Margin</p>
                <p
                  className={`mt-1 text-2xl font-semibold ${marginColor(
                    summary.avgMarginPercent
                  )}`}
                >
                  {summary.avgMarginPercent}%
                </p>
              </div>
            </div>
          )}

          {/* Orders profitability table */}
          <div className="overflow-hidden rounded-[3px] border border-[#e0e0e0] bg-white">
            {data.length === 0 ? (
              <div className="flex h-48 items-center justify-center text-sm text-[#999]">
                No paid orders found for this period
              </div>
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden overflow-x-auto xl:block">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#e0e0e0] bg-[#fafafa]">
                        <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wide text-[#999]">
                          Order
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wide text-[#999]">
                          Customer
                        </th>
                        <th className="px-3 py-3 text-right text-xs font-medium uppercase tracking-wide text-[#999]">
                          Revenue
                        </th>
                        <th className="px-3 py-3 text-right text-xs font-medium uppercase tracking-wide text-[#999]">
                          Material
                        </th>
                        <th className="px-3 py-3 text-right text-xs font-medium uppercase tracking-wide text-[#999]">
                          Labor
                        </th>
                        <th className="px-3 py-3 text-right text-xs font-medium uppercase tracking-wide text-[#999]">
                          Shipping
                        </th>
                        <th className="px-3 py-3 text-right text-xs font-medium uppercase tracking-wide text-[#999]">
                          Total Cost
                        </th>
                        <th className="px-3 py-3 text-right text-xs font-medium uppercase tracking-wide text-[#999]">
                          Profit
                        </th>
                        <th className="px-3 py-3 text-right text-xs font-medium uppercase tracking-wide text-[#999]">
                          Margin
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e0e0e0]">
                      {data.map((order) => (
                        <tr
                          key={order.id}
                          className={`hover:bg-[#fafafa] ${marginBg(
                            order.marginPercent
                          )}`}
                        >
                          <td className="px-3 py-3">
                            <Link
                              href={`/admin/orders/${order.id}`}
                              className="font-mono text-xs font-medium text-blue-600 underline hover:no-underline"
                            >
                              {order.id.slice(0, 8)}...
                            </Link>
                            <p className="text-[10px] text-[#999]">
                              {formatDate(order.paidAt)}
                            </p>
                          </td>
                          <td className="max-w-[140px] truncate px-3 py-3 text-xs text-[#666]">
                            {order.customerName || order.customerEmail}
                          </td>
                          <td className="px-3 py-3 text-right font-semibold text-black">
                            {formatCad(order.revenue)}
                          </td>
                          <td className="px-3 py-3 text-right text-xs text-[#666]">
                            {formatCad(order.costs.material)}
                          </td>
                          <td className="px-3 py-3 text-right text-xs text-[#666]">
                            {formatCad(order.costs.labor)}
                          </td>
                          <td className="px-3 py-3 text-right text-xs text-[#666]">
                            {formatCad(order.costs.shipping)}
                          </td>
                          <td className="px-3 py-3 text-right text-xs font-medium text-[#333]">
                            {formatCad(order.costs.total)}
                          </td>
                          <td
                            className={`px-3 py-3 text-right text-xs font-semibold ${
                              order.profit >= 0
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {formatCad(order.profit)}
                          </td>
                          <td className="px-3 py-3 text-right">
                            <span
                              className={`inline-block rounded-[2px] px-2 py-0.5 text-xs font-bold ${marginColor(
                                order.marginPercent
                              )}`}
                            >
                              {order.marginPercent}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Medium/mobile cards */}
                <div className="divide-y divide-[#e0e0e0] xl:hidden">
                  {data.map((order) => (
                    <div
                      key={order.id}
                      className={`px-4 py-3 ${marginBg(order.marginPercent)}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="min-w-0">
                          <Link
                            href={`/admin/orders/${order.id}`}
                            className="font-mono text-xs font-medium text-blue-600 underline hover:no-underline"
                          >
                            {order.id.slice(0, 8)}...
                          </Link>
                          <p className="mt-0.5 text-xs text-[#666]">
                            {order.customerName || order.customerEmail}
                          </p>
                          <p className="text-[10px] text-[#999]">
                            {formatDate(order.paidAt)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-black">
                            {formatCad(order.revenue)}
                          </p>
                          <span
                            className={`inline-block rounded-[2px] px-2 py-0.5 text-xs font-bold ${marginColor(
                              order.marginPercent
                            )}`}
                          >
                            {order.marginPercent}% margin
                          </span>
                        </div>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-[#999]">
                        <span>
                          Cost: {formatCad(order.costs.total)}
                        </span>
                        <span>
                          Profit:{" "}
                          <span
                            className={
                              order.profit >= 0
                                ? "text-green-600"
                                : "text-red-600"
                            }
                          >
                            {formatCad(order.profit)}
                          </span>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-[#999]">
                Showing {(pagination.page - 1) * pagination.limit + 1}-
                {Math.min(
                  pagination.page * pagination.limit,
                  pagination.total
                )}{" "}
                of {pagination.total}
              </p>
              <div className="flex gap-1">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="rounded-[3px] border border-[#d0d0d0] px-3 py-1.5 text-xs font-medium text-black hover:bg-[#fafafa] disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={page >= pagination.pages}
                  onClick={() => setPage(page + 1)}
                  className="rounded-[3px] border border-[#d0d0d0] px-3 py-1.5 text-xs font-medium text-black hover:bg-[#fafafa] disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
