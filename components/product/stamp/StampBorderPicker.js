"use client";

import { useEffect, useRef } from "react";
import { BORDER_LIST, drawBorder } from "@/lib/stamp/borders";
import { useTranslation } from "@/lib/i18n/useTranslation";

function MiniPreview({ borderId, color }) {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    const s = 40;
    c.width = s * 2;
    c.height = s * 2;
    ctx.setTransform(2, 0, 0, 2, 0, 0);
    ctx.clearRect(0, 0, s, s);
    // Draw border in a mini circle
    drawBorder(ctx, borderId, "round", s / 2, s / 2, s - 4, s - 4, s / 2 - 2, color);
  }, [borderId, color]);
  return <canvas ref={ref} className="h-10 w-10" />;
}

export default function StampBorderPicker({ selected, color, onSelect }) {
  const { t } = useTranslation();

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-gray-500)] mb-2">
        {t("stamp.border")}
      </p>
      <div
        className="flex gap-2 overflow-x-auto pb-2"
        style={{ scrollSnapType: "x mandatory", scrollbarWidth: "none" }}
      >
        {BORDER_LIST.map((b) => (
          <button
            key={b.id}
            type="button"
            onClick={() => onSelect(b.id)}
            className={`flex shrink-0 flex-col items-center gap-1 rounded-xl border-2 px-3 py-2 transition-all ${
              selected === b.id
                ? "border-[var(--color-gray-900)] bg-[var(--color-gray-50)] shadow-sm"
                : "border-[var(--color-gray-200)] bg-white hover:border-[var(--color-gray-400)]"
            }`}
            style={{ scrollSnapAlign: "start" }}
          >
            <MiniPreview borderId={b.id} color={color} />
            <span className="text-[10px] font-medium text-[var(--color-gray-600)]">
              {t(b.labelKey)}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
