"use client";

import { useEffect, useState } from "react";
import { STAMP_FONTS, preloadStampFonts } from "@/lib/stamp/fonts";
import { useTranslation } from "@/lib/i18n/useTranslation";

export default function StampFontPicker({ selected, onSelect }) {
  const { t } = useTranslation();
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
        className="flex gap-2 overflow-x-auto pb-2"
        style={{ scrollSnapType: "x mandatory", scrollbarWidth: "none" }}
      >
        {STAMP_FONTS.map((f) => (
          <button
            key={f.family}
            type="button"
            onClick={() => onSelect(f.family)}
            style={{
              fontFamily: `"${f.family}", ${f.category === "system" ? "sans-serif" : f.category}`,
              opacity: ready || f.category === "system" ? 1 : 0.6,
            }}
            className={`shrink-0 rounded-xl border-2 px-3 py-1.5 text-sm font-bold transition-all ${
              selected === f.family
                ? "border-[var(--color-gray-900)] bg-[var(--color-gray-900)] text-[#fff]"
                : "border-[var(--color-gray-200)] text-[var(--color-gray-700)] hover:border-[var(--color-gray-400)]"
            }`}
            style-snap="start"
          >
            {f.family}
          </button>
        ))}
      </div>
    </div>
  );
}
