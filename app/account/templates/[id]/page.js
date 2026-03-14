"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslation } from "@/lib/i18n/useTranslation";

export default function TemplateDetailPage() {
  const { t, locale } = useTranslation();
  const { id } = useParams();
  const router = useRouter();
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    fetch(`/api/account/templates/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setTemplate(data.template);
        setName(data.template?.name || "");
        setDescription(data.template?.description || "");
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const handleSave = async () => {
    const res = await fetch(`/api/account/templates/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description }),
    });
    if (res.ok) {
      const data = await res.json();
      setTemplate(data.template);
      setEditing(false);
    }
  };

  const handleReorder = async () => {
    const res = await fetch(`/api/account/templates/${id}/reorder`, { method: "POST" });
    if (res.ok) {
      const { cartItems } = await res.json();
      sessionStorage.setItem("reorder-items", JSON.stringify(cartItems));
      window.location.href = "/shop";
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
      </div>
    );
  }

  if (!template) {
    return (
      <div className="py-12 text-center">
        <p className="text-gray-600">{t("account.templates.notFound")}</p>
      </div>
    );
  }

  return (
    <div>
      <button onClick={() => router.push("/account/templates")} className="mb-4 text-sm text-gray-500 hover:text-gray-900">
        &larr; {t("account.templates.backToList")}
      </button>

      {editing ? (
        <div className="mb-6 space-y-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-lg font-semibold"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t("account.templates.descPlaceholder")}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            rows={2}
          />
          <div className="flex gap-2">
            <button onClick={handleSave} className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-[#fff]">
              {t("account.templates.save")}
            </button>
            <button onClick={() => setEditing(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600">
              {t("account.templates.cancel")}
            </button>
          </div>
        </div>
      ) : (
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">{template.name}</h1>
            {template.description && <p className="mt-1 text-gray-500">{template.description}</p>}
          </div>
          <div className="flex gap-2">
            <button onClick={handleReorder} className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-[#fff] hover:bg-gray-800">
              {t("account.templates.reorder")}
            </button>
            <button onClick={() => setEditing(true)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
              {t("account.templates.edit")}
            </button>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-5 py-3">
          <h2 className="text-sm font-semibold uppercase text-gray-500">{t("account.templates.items")} ({template.items?.length || 0})</h2>
        </div>
        {(template.items || []).map((item, idx) => (
          <div key={item.id} className={`flex items-center justify-between px-5 py-3 ${idx > 0 ? "border-t border-gray-100" : ""}`}>
            <div>
              <p className="font-medium">{item.productName}</p>
              <p className="text-sm text-gray-500">{t("account.templates.qty")}: {item.quantity}</p>
            </div>
          </div>
        ))}
      </div>

      <p className="mt-4 text-xs text-gray-400">
        {t("account.templates.usedTimes").replace("{count}", template.useCount || 0)}
        {template.lastUsedAt && ` · ${t("account.templates.lastUsed")} ${new Date(template.lastUsedAt).toLocaleDateString(locale === "zh" ? "zh-CN" : "en-CA")}`}
      </p>
    </div>
  );
}
