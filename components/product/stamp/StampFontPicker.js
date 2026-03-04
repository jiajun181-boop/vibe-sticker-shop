"use client";

import { useEffect, useRef, useState } from "react";
import { STAMP_FONTS, preloadStampFonts, loadFont } from "@/lib/stamp/fonts";
import { useTranslation } from "@/lib/i18n/useTranslation";

export default function StampFontPicker({ selected, onSelect }) {
  const { t } = useTranslation();
  const scrollRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    preloadStampFonts().then(() => setReady(true));
  }, []);

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-gray-500)] mb-2">
        {t("stamp.font")}
      </p>
      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto pb-2"
        style={{ scrollSnapType: "x mandatory", scrollbarWidth: "none" }}
      >
        {STAMP_FONTS.map((f) => (
          <button
            key={f.family}
            type="button"
            onClick={() => {
              loadFont(f.family);
              onSelect(f.family);
            }}
            className={`shrink-0 rounded-xl border-2 px-4 py-2.5 transition-all ${
              selected === f.family
                ? "border-[var(--color-gray-900)] bg-[var(--color-gray-900)] text-[#fff] shadow-sm"
                : "border-[var(--color-gray-200)] bg-white text-[var(--color-gray-700)] hover:border-[var(--color-gray-400)]"
            }`}
            style={{
              fontFamily: ready ? `"${f.family}", sans-serif` : "sans-serif",
              scrollSnapAlign: "start",
            }}
          >
            <span className="block text-sm font-bold leading-tight">{f.family}</span>
            <span className={`block text-[10px] ${selected === f.family ? "text-gray-300" : "text-[var(--color-gray-400)]"}`}>
              {f.category}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
