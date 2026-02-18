"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function TemplatesPage() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/account/templates")
      .then((r) => r.json())
      .then((data) => setTemplates(data.templates || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id) => {
    if (!confirm("Delete this template?")) return;
    await fetch(`/api/account/templates/${id}`, { method: "DELETE" });
    setTemplates((prev) => prev.filter((t) => t.id !== id));
  };

  const handleReorder = async (id) => {
    const res = await fetch(`/api/account/templates/${id}/reorder`, { method: "POST" });
    if (res.ok) {
      const { cartItems } = await res.json();
      // Store in sessionStorage for cart page to pick up
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

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Order Templates</h1>

      {templates.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
          <p className="mb-2 text-gray-600">No templates yet.</p>
          <p className="text-sm text-gray-500">
            Save frequently ordered items as templates for quick reordering.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {templates.map((template) => (
            <div
              key={template.id}
              className="rounded-xl border border-gray-200 bg-white p-5"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{template.name}</h3>
                  {template.description && (
                    <p className="mt-1 text-sm text-gray-500">{template.description}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-400">
                    {template.items?.length || 0} items
                    {template.useCount > 0 && ` · Used ${template.useCount}×`}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleReorder(template.id)}
                    className="rounded-lg bg-gray-900 px-4 py-2 text-xs font-semibold text-white hover:bg-gray-800"
                  >
                    Reorder
                  </button>
                  <Link
                    href={`/account/templates/${template.id}`}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    View
                  </Link>
                  <button
                    onClick={() => handleDelete(template.id)}
                    className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
