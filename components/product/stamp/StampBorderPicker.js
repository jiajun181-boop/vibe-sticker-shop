"use client";

import { useEffect, useRef } from "react";
import { STAMP_BORDERS, drawBorderPreview } from "@/lib/stamp/borders";
import { useTranslation } from "@/lib/i18n/useTranslation";

const PREVIEW_SIZE = 40;

function BorderThumb({ borderId, color, isSelected, onClick }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = PREVIEW_SIZE * dpr;
    canvas.height = PREVIEW_SIZE * dpr;
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawBorderPreview(ctx, borderId, PREVIEW_SIZE, color);
  }, [borderId, color]);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-lg border-2 p-0.5 transition-all ${
        isSelected
          ? "border-[var(--color-gray-900)] ring-2 ring-gray-300 scale-110"
          : "border-[var(--color-gray-200)] hover:border-[var(--color-gray-400)]"
      }`}
    >
      <canvas
        ref={canvasRef}
        style={{ width: PREVIEW_SIZE, height: PREVIEW_SIZE }}
        className="rounded"
      />
    </button>
  );
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
        {STAMP_BORDERS.map((b) => (
          <div key={b.id} className="flex flex-col items-center gap-1 shrink-0">
            <BorderThumb
              borderId={b.id}
              color={color || "#111111"}
              isSelected={selected === b.id}
              onClick={() => onSelect(b.id)}
            />
            <span className="text-[9px] text-[var(--color-gray-500)]">{t(b.labelKey)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
