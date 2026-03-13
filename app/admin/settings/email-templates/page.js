"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";

export default function EmailTemplatesPage() {
  const { t } = useTranslation();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingKey, setEditingKey] = useState(null);
  const [editSubject, setEditSubject] = useState("");
  const [editBody, setEditBody] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/email-templates")
      .then((r) => (r.ok ? r.json() : { templates: [] }))
      .then((data) => setTemplates(data.templates || []))
      .finally(() => setLoading(false));
  }, []);

  function startEdit(tpl) {
    setEditingKey(tpl.key);
    setEditSubject(tpl.subject);
    setEditBody(tpl.body);
  }

  function cancelEdit() {
    setEditingKey(null);
    setEditSubject("");
    setEditBody("");
  }

  async function saveTemplate() {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/email-templates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: editingKey,
          subject: editSubject,
          body: editBody,
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      const updated = await res.json();
      setTemplates((prev) =>
        prev.map((t) => (t.key === editingKey ? updated : t))
      );
      cancelEdit();
    } catch {
      alert(t("admin.emailTemplates.saveFailed"));
    } finally {
      setSaving(false);
    }
  }

  async function resetTemplate(key) {
    if (!confirm(t("admin.emailTemplates.resetConfirm"))) return;
    try {
      const res = await fetch("/api/admin/email-templates", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
      });
      if (!res.ok) throw new Error("Failed to reset");
      const updated = await res.json();
      setTemplates((prev) =>
        prev.map((t) => (t.key === key ? updated : t))
      );
    } catch {
      alert(t("admin.emailTemplates.resetFailed"));
    }
  }

  if (loading)
    return (
      <div className="flex h-48 items-center justify-center text-sm text-[#999]">
        Loading templates...
      </div>
    );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-black">Email Templates</h1>
        <p className="text-xs text-[#999]">
          Customize the email templates sent to customers. Use {"{"}variableName{"}"} placeholders.
        </p>
      </div>

      <div className="space-y-4">
        {templates.map((tpl) => (
          <div
            key={tpl.key}
            className="rounded-lg border border-[#e5e5e5] bg-white p-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-semibold text-black">
                  {tpl.key.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                </h3>
                <p className="mt-0.5 text-xs text-[#999]">{tpl.description}</p>
                {tpl.isCustomized && (
                  <span className="mt-1 inline-block rounded-full bg-blue-50 px-2 py-0.5 text-[9px] font-semibold text-blue-600">
                    Customized
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                {editingKey !== tpl.key && (
                  <button
                    type="button"
                    onClick={() => startEdit(tpl)}
                    className="rounded-md bg-[#f5f5f5] px-3 py-1.5 text-xs font-medium text-[#666] hover:bg-[#e5e5e5]"
                  >
                    Edit
                  </button>
                )}
                {tpl.isCustomized && editingKey !== tpl.key && (
                  <button
                    type="button"
                    onClick={() => resetTemplate(tpl.key)}
                    className="rounded-md bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>

            {editingKey === tpl.key ? (
              <div className="mt-3 space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#666]">
                    Subject
                  </label>
                  <input
                    value={editSubject}
                    onChange={(e) => setEditSubject(e.target.value)}
                    className="w-full rounded-md border border-[#e5e5e5] bg-white px-3 py-2 text-sm outline-none focus:border-black"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#666]">
                    Body
                  </label>
                  <textarea
                    rows={8}
                    value={editBody}
                    onChange={(e) => setEditBody(e.target.value)}
                    className="w-full rounded-md border border-[#e5e5e5] bg-white px-3 py-2 text-sm font-mono outline-none focus:border-black"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={saveTemplate}
                    disabled={saving}
                    className="rounded-md bg-black px-4 py-2 text-xs font-medium text-white hover:bg-gray-800 disabled:opacity-50"
                  >
                    {saving ? "Saving..." : "Save"}
                  </button>
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="rounded-md bg-[#f5f5f5] px-4 py-2 text-xs font-medium text-[#666] hover:bg-[#e5e5e5]"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-3">
                <p className="text-xs text-[#666]">
                  <strong>Subject:</strong> {tpl.subject}
                </p>
                <pre className="mt-2 max-h-24 overflow-auto rounded-md bg-[#f8f8f8] p-2 text-[11px] text-[#666] whitespace-pre-wrap">
                  {tpl.body}
                </pre>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
