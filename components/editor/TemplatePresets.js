"use client";

import { TEMPLATES } from "@/lib/editor/templates";

export default function TemplatePresets({ category = "business-cards", onSelect, selectedId }) {
  const templates = TEMPLATES.filter((t) => t.category === category);

  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold uppercase text-gray-500">Templates</h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {templates.map((t) => (
          <button
            key={t.id}
            onClick={() => onSelect(t)}
            className={`overflow-hidden rounded-lg border-2 transition ${
              selectedId === t.id
                ? "border-gray-900 ring-2 ring-gray-900/20"
                : "border-gray-200 hover:border-gray-400"
            }`}
          >
            <div
              className="flex h-16 items-center justify-center text-xs"
              style={{
                background: t.canvas.background?.startsWith("linear")
                  ? t.canvas.background
                  : t.canvas.background || "#fff",
                color: t.canvas.background === "#111111" || t.canvas.background?.includes("gradient") ? "#fff" : "#111",
              }}
            >
              {t.name}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
