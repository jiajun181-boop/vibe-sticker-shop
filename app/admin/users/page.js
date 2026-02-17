"use client";

import { useCallback, useEffect, useState } from "react";
import { ALL_ROLES, ROLE_LABELS } from "@/lib/admin-permissions";

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editId, setEditId] = useState(null);
  const [message, setMessage] = useState(null);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/users");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setUsers(data.users);
    } catch {
      setMessage({ type: "error", text: "Failed to load users. You may not have permission." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  if (loading) {
    return <div className="flex h-48 items-center justify-center text-sm text-[#999]">Loading users...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-black">Admin Users</h1>
        <button
          type="button"
          onClick={() => { setShowCreate(true); setEditId(null); }}
          className="rounded-[3px] bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-[#222]"
        >
          + New User
        </button>
      </div>

      {message && (
        <div className={`rounded-[3px] px-4 py-3 text-sm font-medium ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {message.text}
        </div>
      )}

      {/* Permission overview */}
      <div className="rounded-[3px] border border-[#e0e0e0] bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold text-black">Role Overview</h2>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {ALL_ROLES.map((role) => {
            const count = users.filter((u) => u.role === role && u.isActive).length;
            return (
              <div key={role} className="rounded-[3px] border border-[#e0e0e0] bg-[#fafafa] px-3 py-2">
                <p className="text-xs font-semibold text-black">{ROLE_LABELS[role].en}</p>
                <p className="text-[10px] text-[#999]">{ROLE_LABELS[role].zh}</p>
                <p className="mt-1 text-lg font-bold text-black">{count}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* User list */}
      {/* Desktop table */}
      <div className="hidden rounded-[3px] border border-[#e0e0e0] bg-white lg:block">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#e0e0e0] text-left text-xs font-semibold uppercase tracking-wider text-[#999]">
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Last Login</th>
                <th className="px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-[#e0e0e0] hover:bg-[#fafafa]">
                  <td className="px-5 py-3 font-medium text-black">{user.name}</td>
                  <td className="px-5 py-3 text-[#666]">{user.email}</td>
                  <td className="px-5 py-3">
                    <span className="inline-flex rounded-[2px] bg-[#f5f5f5] px-2.5 py-0.5 text-xs font-semibold text-black">
                      {ROLE_LABELS[user.role]?.en || user.role}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex rounded-[2px] px-2.5 py-0.5 text-xs font-semibold ${user.isActive ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
                      {user.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-[#999] text-xs">
                    {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : "Never"}
                  </td>
                  <td className="px-5 py-3">
                    <button
                      type="button"
                      onClick={() => { setEditId(user.id); setShowCreate(false); }}
                      className="text-xs font-semibold text-[#666] hover:text-black"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-[#999]">
                    No admin users yet. Create one to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* Mobile cards */}
      <div className="space-y-3 lg:hidden">
        {users.map((user) => (
          <div key={user.id} className="rounded-[3px] border border-[#e0e0e0] bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium text-black">{user.name}</p>
                <p className="mt-0.5 truncate text-xs text-[#666]">{user.email}</p>
              </div>
              <span className={`shrink-0 rounded-[2px] px-2.5 py-0.5 text-xs font-semibold ${user.isActive ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
                {user.isActive ? "Active" : "Inactive"}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="inline-flex rounded-[2px] bg-[#f5f5f5] px-2.5 py-0.5 text-xs font-semibold text-black">
                {ROLE_LABELS[user.role]?.en || user.role}
              </span>
              <button
                type="button"
                onClick={() => { setEditId(user.id); setShowCreate(false); }}
                className="text-xs font-semibold text-[#666] hover:text-black"
              >
                Edit
              </button>
            </div>
            <p className="mt-2 text-[10px] text-[#999]">
              Last login: {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : "Never"}
            </p>
          </div>
        ))}
        {users.length === 0 && (
          <div className="rounded-[3px] border border-[#e0e0e0] p-8 text-center text-[#999]">
            No admin users yet. Create one to get started.
          </div>
        )}
      </div>

      {/* Create modal */}
      {showCreate && (
        <CreateUserModal
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); fetchUsers(); setMessage({ type: "success", text: "User created successfully." }); }}
        />
      )}

      {/* Edit modal */}
      {editId && (
        <EditUserModal
          user={users.find((u) => u.id === editId)}
          onClose={() => setEditId(null)}
          onUpdated={() => { setEditId(null); fetchUsers(); setMessage({ type: "success", text: "User updated." }); }}
        />
      )}
    </div>
  );
}

function CreateUserModal({ onClose, onCreated }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("cs");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed");
      }
      onCreated();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="Create Admin User" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Name" value={name} onChange={setName} required />
        <Field label="Email" value={email} onChange={setEmail} type="email" required />
        <Field label="Password" value={password} onChange={setPassword} type="password" required placeholder="Min 8 characters" />
        <RoleSelect value={role} onChange={setRole} />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="rounded-[3px] border border-[#d0d0d0] px-4 py-2 text-sm font-medium text-black hover:bg-[#fafafa]">Cancel</button>
          <button type="submit" disabled={saving} className="rounded-[3px] bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-[#222] disabled:opacity-50">{saving ? "Creating..." : "Create User"}</button>
        </div>
      </form>
    </Modal>
  );
}

function EditUserModal({ user, onClose, onUpdated }) {
  const [name, setName] = useState(user?.name || "");
  const [role, setRole] = useState(user?.role || "cs");
  const [isActive, setIsActive] = useState(user?.isActive ?? true);
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (!user) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const body = { name, role, isActive };
      if (password) body.password = password;
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed");
      }
      onUpdated();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={`Edit: ${user.name}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="text-xs text-[#999]">{user.email}</div>
        <Field label="Name" value={name} onChange={setName} required />
        <RoleSelect value={role} onChange={setRole} />
        <Field label="New Password (leave blank to keep)" value={password} onChange={setPassword} type="password" placeholder="Min 8 characters" />
        <div className="flex items-center gap-3">
          <label className="relative inline-flex cursor-pointer items-center">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="peer sr-only" />
            <div className="h-5 w-9 rounded-full bg-[#d0d0d0] after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-transform peer-checked:bg-black peer-checked:after:translate-x-full" />
          </label>
          <span className="text-sm text-black">{isActive ? "Active" : "Inactive"}</span>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="rounded-[3px] border border-[#d0d0d0] px-4 py-2 text-sm font-medium text-black hover:bg-[#fafafa]">Cancel</button>
          <button type="submit" disabled={saving} className="rounded-[3px] bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-[#222] disabled:opacity-50">{saving ? "Saving..." : "Save Changes"}</button>
        </div>
      </form>
    </Modal>
  );
}

/* ── Shared Components ── */

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div className="w-full max-w-md rounded-[3px] border border-[#e0e0e0] bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-black">{title}</h2>
          <button type="button" onClick={onClose} className="text-[#999] hover:text-[#666]">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", placeholder, required }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-[#666]">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-black"
      />
    </div>
  );
}

function RoleSelect({ value, onChange }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-[#666]">Role</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-black"
      >
        {ALL_ROLES.map((r) => (
          <option key={r} value={r}>
            {ROLE_LABELS[r].en} ({ROLE_LABELS[r].zh})
          </option>
        ))}
      </select>
    </div>
  );
}
