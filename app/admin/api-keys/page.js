"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";

export default function AdminApiKeysPage() {
  const { t } = useTranslation();
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyResult, setNewKeyResult] = useState(null);
  const [revoking, setRevoking] = useState(null);

  const fetchKeys = () => {
    fetch("/api/admin/api-keys")
      .then((r) => r.json())
      .then((data) => setKeys(data.keys || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/admin/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newKeyName.trim() }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || t("admin.apiKeys.createFailed"));
        return;
      }
      const data = await res.json();
      setNewKeyResult(data.plainKey);
      setKeys((prev) => [data.apiKey, ...prev]);
      setNewKeyName("");
    } catch {
      alert(t("admin.apiKeys.createFailed"));
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (id, name) => {
    if (!confirm(`Revoke API key "${name}"? This cannot be undone.`)) return;
    setRevoking(id);
    try {
      const res = await fetch("/api/admin/api-keys", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error();
      setKeys((prev) =>
        prev.map((k) => (k.id === id ? { ...k, isActive: false } : k))
      );
    } catch {
      alert("Failed to revoke key");
    } finally {
      setRevoking(null);
    }
  };

  const activeKeys = keys.filter((k) => k.isActive !== false);
  const revokedKeys = keys.filter((k) => k.isActive === false);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold">{t("admin.apiKeys.title")}</h1>
          <p className="text-[10px] text-gray-400">{t("admin.apiKeys.subtitle")}</p>
        </div>
        <span className="text-xs text-gray-500">
          {activeKeys.length} active key{activeKeys.length !== 1 && "s"}
        </span>
      </div>

      {/* Create */}
      <form onSubmit={handleCreate} className="flex gap-3">
        <input
          type="text"
          value={newKeyName}
          onChange={(e) => setNewKeyName(e.target.value)}
          placeholder={t("admin.apiKeys.namePlaceholder")}
          className="flex-1 rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-xs outline-none focus:border-black"
          required
        />
        <button
          type="submit"
          disabled={creating}
          className="rounded-[3px] bg-black px-5 py-2 text-xs font-semibold text-white hover:bg-gray-800 disabled:opacity-50 transition-colors"
        >
          {creating ? t("admin.apiKeys.creating") : t("admin.apiKeys.createKey")}
        </button>
      </form>

      {/* New key display */}
      {newKeyResult && (
        <div className="rounded-[3px] border border-emerald-200 bg-emerald-50 p-4">
          <p className="mb-2 text-xs font-semibold text-emerald-700">
            {t("admin.apiKeys.newKeyHint")}
          </p>
          <code className="block rounded-[3px] bg-white px-3 py-2 text-xs font-mono text-gray-900 select-all border border-emerald-200">
            {newKeyResult}
          </code>
          <button
            type="button"
            onClick={() => setNewKeyResult(null)}
            className="mt-2 text-[10px] text-emerald-600 hover:underline"
          >
            {t("admin.apiKeys.dismiss")}
          </button>
        </div>
      )}

      {/* Keys table */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-[3px] bg-gray-100" />
          ))}
        </div>
      ) : keys.length === 0 ? (
        <div className="rounded-[3px] border border-[#e0e0e0] bg-white p-8 text-center text-sm text-gray-500">
          {t("admin.apiKeys.noKeys")}
        </div>
      ) : (
        <div className="overflow-hidden rounded-[3px] border border-[#e0e0e0] bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                <th className="px-4 py-3">{t("admin.apiKeys.name")}</th>
                <th className="px-4 py-3">{t("admin.apiKeys.keyPrefix")}</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">{t("admin.apiKeys.created")}</th>
                <th className="px-4 py-3">{t("admin.apiKeys.lastUsed")}</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {activeKeys.map((k) => (
                <tr key={k.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{k.name}</td>
                  <td className="px-4 py-3 font-mono text-[11px] text-gray-500">
                    {k.keyPrefix || "lp_live_***"}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-emerald-700">
                      active
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[11px] text-gray-500">
                    {new Date(k.createdAt).toLocaleDateString("en-CA")}
                  </td>
                  <td className="px-4 py-3 text-[11px] text-gray-500">
                    {k.lastUsedAt
                      ? new Date(k.lastUsedAt).toLocaleDateString("en-CA")
                      : t("admin.apiKeys.never")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleRevoke(k.id, k.name)}
                      disabled={revoking === k.id}
                      className="text-[11px] font-medium text-red-600 hover:underline disabled:opacity-50"
                    >
                      {revoking === k.id ? "Revoking..." : "Revoke"}
                    </button>
                  </td>
                </tr>
              ))}
              {revokedKeys.map((k) => (
                <tr key={k.id} className="bg-gray-50 opacity-60">
                  <td className="px-4 py-3 font-medium text-gray-500 line-through">{k.name}</td>
                  <td className="px-4 py-3 font-mono text-[11px] text-gray-400">
                    {k.keyPrefix || "lp_live_***"}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-red-600">
                      revoked
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[11px] text-gray-400">
                    {new Date(k.createdAt).toLocaleDateString("en-CA")}
                  </td>
                  <td className="px-4 py-3 text-[11px] text-gray-400">
                    {k.lastUsedAt
                      ? new Date(k.lastUsedAt).toLocaleDateString("en-CA")
                      : "—"}
                  </td>
                  <td className="px-4 py-3" />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
