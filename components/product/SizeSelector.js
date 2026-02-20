"use client";

import { useMemo, useState } from "react";

function normalize(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function stripMarker(value) {
  return typeof value === "string" ? value.replace(/\s*[★*]+\s*$/, "").trim() : value;
}

export default function SizeSelector({
  label,
  options,
  value,
  onChange,
  placeholder = "Select a size",
}) {
  const list = Array.isArray(options) ? options : [];
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const nq = normalize(q);
    if (!nq) return list;
    return list.filter((o) => normalize(o.label).includes(nq));
  }, [list, q]);

  const showSearch = list.length >= 10;

  return (
    <div>
      {label && (
        <label className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-gray-500)]">
          {label}
        </label>
      )}

      {showSearch && (
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={placeholder}
          className="mt-2 w-full rounded-xl border border-[var(--color-gray-300)] bg-white px-3 py-2 text-sm"
        />
      )}

      <div className={`mt-2 grid gap-2 ${showSearch ? "max-h-64 overflow-auto pr-1" : ""} grid-cols-2`}>
        {filtered.map((o) => {
          const selected = o.label === value || o.id === value;
          return (
            <button
              key={o.id || o.label}
              type="button"
              onClick={() => onChange(o.label)}
              className={`rounded-xl border px-3 py-2 text-left text-sm transition-colors ${
                selected
                  ? "border-[var(--color-ink-black)] bg-[var(--color-ink-black)] text-white"
                  : "border-[var(--color-gray-200)] bg-white text-[var(--color-gray-900)] hover:bg-[var(--color-gray-50)]"
              }`}
            >
              <div className="font-semibold leading-snug">
                {stripMarker(o.displayLabel || o.label)}
              </div>
              {(o.widthIn && o.heightIn) && (
                <div className={`mt-0.5 text-xs ${selected ? "text-gray-200" : "text-[var(--color-gray-500)]"}`}>
                  {o.widthIn}" × {o.heightIn}"
                </div>
              )}
              {o.notes && (
                <div className={`mt-0.5 text-xs ${selected ? "text-gray-200" : "text-[var(--color-gray-500)]"}`}>
                  {o.notes}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

