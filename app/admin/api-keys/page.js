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

  useEffect(() => {
    fetch("/api/admin/api-keys")
      .then((r) => r.json())
      .then((data) => setKeys(data.keys || []))
      .catch(() => {})
      .finally(() => setLoading(false));
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
      if (!res.ok) throw new Error();
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">{t("admin.apiKeys.title")}</h1>
        <span className="text-sm text-gray-500">{t("admin.apiKeys.subtitle")}</span>
      </div>

      {/* Create */}
      <form onSubmit={handleCreate} className="flex gap-3">
        <input
          type="text"
          value={newKeyName}
          onChange={(e) => setNewKeyName(e.target.value)}
          placeholder={t("admin.apiKeys.namePlaceholder")}
          className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
          required
        />
        <button
          type="submit"
          disabled={creating}
          className="rounded-lg bg-gray-900 px-5 py-2 text-sm font-semibold text-[#fff] hover:bg-black disabled:opacity-50"
        >
          {creating ? t("admin.apiKeys.creating") : t("admin.apiKeys.createKey")}
        </button>
      </form>

      {/* New key display */}
      {newKeyResult && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <p className="mb-2 text-xs font-semibold text-emerald-700">{t("admin.apiKeys.newKeyHint")}</p>
          <code className="block rounded bg-white px-3 py-2 text-sm font-mono text-gray-900 select-all">
            {newKeyResult}
          </code>
          <button
            type="button"
            onClick={() => setNewKeyResult(null)}
            className="mt-2 text-xs text-emerald-600 hover:underline"
          >
            {t("admin.apiKeys.dismiss")}
          </button>
        </div>
      )}

      {/* Keys table */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-lg bg-gray-100" />
          ))}
        </div>
      ) : keys.length === 0 ? (
        <div className="rounded-lg border bg-white p-8 text-center text-sm text-gray-500">
          {t("admin.apiKeys.noKeys")}
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                <th className="px-4 py-3">{t("admin.apiKeys.name")}</th>
                <th className="px-4 py-3">{t("admin.apiKeys.keyPrefix")}</th>
                <th className="px-4 py-3">{t("admin.apiKeys.created")}</th>
                <th className="px-4 py-3">{t("admin.apiKeys.lastUsed")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {keys.map((k) => (
                <tr key={k.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{k.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">
                    {k.keyPrefix || "lp_live_***"}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {new Date(k.createdAt).toLocaleDateString("en-CA")}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleDateString("en-CA") : t("admin.apiKeys.never")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
