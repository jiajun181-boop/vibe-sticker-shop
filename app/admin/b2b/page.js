"use client";

import { useEffect, useState } from "react";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
];

export default function AdminB2BPage() {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/b2b?filter=${filter}`)
      .then((r) => r.json())
      .then((data) => {
        setUsers(data.users || []);
        setTotal(data.total || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filter]);

  async function handleAction(userId, action) {
    setActionLoading(userId);
    try {
      const res = await fetch(`/api/admin/b2b/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        // Refresh list
        setFilter((f) => f);
        const data = await fetch(`/api/admin/b2b?filter=${filter}`).then((r) => r.json());
        setUsers(data.users || []);
        setTotal(data.total || 0);
      }
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-black">B2B Accounts</h1>
          <p className="text-sm text-[#999]">{total} accounts</p>
        </div>
        <div className="flex flex-wrap gap-1 rounded-[3px] border border-[#e0e0e0] p-1">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                filter === f.key ? "bg-black text-white" : "text-[#999] hover:text-black"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-[3px] bg-[#f5f5f5]" />
          ))}
        </div>
      ) : users.length === 0 ? (
        <div className="rounded-[3px] border border-[#e0e0e0] p-8 text-center text-sm text-[#999]">
          No B2B accounts found.
        </div>
      ) : (
        <>
        {/* Desktop table */}
        <div className="hidden overflow-x-auto rounded-[3px] border border-[#e0e0e0] lg:block">
          <table className="w-full text-sm">
            <thead className="bg-[#fafafa] text-left text-xs font-semibold uppercase tracking-wider text-[#999]">
              <tr>
                <th className="px-4 py-3">Company / Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Orders</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Registered</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e0e0e0]">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-[#fafafa]">
                  <td className="px-4 py-3">
                    <p className="font-medium text-black">{user.companyName || "—"}</p>
                    <p className="text-xs text-[#999]">{user.name} {user.companyRole ? `(${user.companyRole})` : ""}</p>
                  </td>
                  <td className="px-4 py-3 text-[#666]">{user.email}</td>
                  <td className="px-4 py-3 text-[#666]">{user._count?.orders || 0}</td>
                  <td className="px-4 py-3">
                    {user.b2bApproved ? (
                      <span className="rounded-[2px] bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                        Approved
                      </span>
                    ) : (
                      <span className="rounded-[2px] bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                        Pending
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-[#999]">
                    {new Date(user.createdAt).toLocaleDateString("en-CA")}
                  </td>
                  <td className="px-4 py-3">
                    {!user.b2bApproved && (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleAction(user.id, "approve")}
                          disabled={actionLoading === user.id}
                          className="rounded-md bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAction(user.id, "reject")}
                          disabled={actionLoading === user.id}
                          className="rounded-md bg-red-100 px-2.5 py-1 text-[11px] font-semibold text-red-700 hover:bg-red-200 disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Mobile cards */}
        <div className="space-y-3 lg:hidden">
          {users.map((user) => (
            <div key={user.id} className="rounded-[3px] border border-[#e0e0e0] bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-black">{user.companyName || "—"}</p>
                  <p className="text-xs text-[#999]">{user.name} {user.companyRole ? `(${user.companyRole})` : ""}</p>
                  <p className="mt-1 truncate text-xs text-[#666]">{user.email}</p>
                </div>
                {user.b2bApproved ? (
                  <span className="shrink-0 rounded-[2px] bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">Approved</span>
                ) : (
                  <span className="shrink-0 rounded-[2px] bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">Pending</span>
                )}
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-[#999]">
                <span>{user._count?.orders || 0} orders</span>
                <span>{new Date(user.createdAt).toLocaleDateString("en-CA")}</span>
              </div>
              {!user.b2bApproved && (
                <div className="mt-3 flex gap-2">
                  <button type="button" onClick={() => handleAction(user.id, "approve")} disabled={actionLoading === user.id} className="rounded-md bg-emerald-600 px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">Approve</button>
                  <button type="button" onClick={() => handleAction(user.id, "reject")} disabled={actionLoading === user.id} className="rounded-md bg-red-100 px-2.5 py-1.5 text-[11px] font-semibold text-red-700 hover:bg-red-200 disabled:opacity-50">Reject</button>
                </div>
              )}
            </div>
          ))}
        </div>
        </>
      )}
    </div>
  );
}
