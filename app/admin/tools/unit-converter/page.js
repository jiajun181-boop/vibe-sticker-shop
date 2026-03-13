"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/useTranslation";

// ── Conversion groups ──
const CONVERSIONS = [
  {
    id: "length",
    labelKey: "admin.unitConverter.length",
    units: [
      { id: "in", label: "inches", factor: 1 },
      { id: "cm", label: "cm", factor: 2.54 },
      { id: "mm", label: "mm", factor: 25.4 },
      { id: "ft", label: "feet", factor: 1 / 12 },
      { id: "m", label: "meters", factor: 0.0254 },
    ],
  },
  {
    id: "area",
    labelKey: "admin.unitConverter.area",
    units: [
      { id: "sqin", label: "sq in", factor: 1 },
      { id: "sqft", label: "sq ft", factor: 1 / 144 },
      { id: "sqcm", label: "sq cm", factor: 6.4516 },
      { id: "sqm", label: "sq m", factor: 0.00064516 },
    ],
  },
  {
    id: "price_length",
    labelKey: "admin.unitConverter.pricePerLength",
    units: [
      { id: "per_in", label: "$/inch", factor: 1 },
      { id: "per_ft", label: "$/foot", factor: 12 },
      { id: "per_cm", label: "$/cm", factor: 1 / 2.54 },
      { id: "per_m", label: "$/meter", factor: 1 / 0.0254 },
    ],
  },
  {
    id: "price_area",
    labelKey: "admin.unitConverter.pricePerArea",
    units: [
      { id: "per_sqin", label: "$/sq in", factor: 1 },
      { id: "per_sqft", label: "$/sq ft", factor: 144 },
      { id: "per_sqcm", label: "$/sq cm", factor: 1 / 6.4516 },
      { id: "per_sqm", label: "$/sq m", factor: 1 / 0.00064516 },
    ],
  },
];

// ── Quick size reference (common print sizes) ──
const QUICK_SIZES = [
  { label: 'Business Card (3.5"×2")', w: 3.5, h: 2 },
  { label: 'Letter (8.5"×11")', w: 8.5, h: 11 },
  { label: 'Tabloid (11"×17")', w: 11, h: 17 },
  { label: 'Poster 18"×24"', w: 18, h: 24 },
  { label: 'Poster 24"×36"', w: 24, h: 36 },
  { label: 'Banner 2\'×4\'', w: 24, h: 48 },
  { label: 'Banner 3\'×6\'', w: 36, h: 72 },
  { label: 'Banner 4\'×8\'', w: 48, h: 96 },
];

function ConverterGroup({ group }) {
  const [values, setValues] = useState(() => {
    const init = {};
    group.units.forEach((u) => { init[u.id] = ""; });
    return init;
  });

  const handleChange = useCallback((changedId, rawValue) => {
    const numVal = parseFloat(rawValue);
    if (rawValue === "" || isNaN(numVal)) {
      const cleared = {};
      group.units.forEach((u) => { cleared[u.id] = u.id === changedId ? rawValue : ""; });
      setValues(cleared);
      return;
    }
    // Convert: changedUnit's base value → other units
    const changedUnit = group.units.find((u) => u.id === changedId);
    const baseValue = numVal / changedUnit.factor; // normalize to base (inches or sqin or $/inch)
    const newValues = {};
    group.units.forEach((u) => {
      if (u.id === changedId) {
        newValues[u.id] = rawValue;
      } else {
        const converted = baseValue * u.factor;
        newValues[u.id] = converted < 0.01 && converted > 0
          ? converted.toExponential(3)
          : parseFloat(converted.toFixed(6)).toString();
      }
    });
    setValues(newValues);
  }, [group.units]);

  return (
    <div className="space-y-2">
      {group.units.map((unit) => (
        <div key={unit.id} className="flex items-center gap-2">
          <input
            type="number"
            inputMode="decimal"
            step="any"
            value={values[unit.id]}
            onChange={(e) => handleChange(unit.id, e.target.value)}
            className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2.5 text-base font-semibold text-[#111] outline-none transition-colors focus:border-black sm:text-sm"
            placeholder="0"
          />
          <span className="w-20 shrink-0 text-right text-sm font-medium text-[#666]">
            {unit.label}
          </span>
        </div>
      ))}
    </div>
  );
}

function AreaCalculator() {
  const { t } = useTranslation();
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [pricePerSqft, setPricePerSqft] = useState("");

  const w = parseFloat(width) || 0;
  const h = parseFloat(height) || 0;
  const sqIn = w * h;
  const sqFt = sqIn / 144;
  const sqM = sqIn * 0.00064516;
  const price = parseFloat(pricePerSqft) || 0;
  const totalPrice = sqFt * price;

  return (
    <div className="rounded-[3px] border border-[#e0e0e0] bg-white p-5">
      <h2 className="text-sm font-bold text-black">{t("admin.unitConverter.areaCalc")}</h2>
      <p className="mt-0.5 text-xs text-[#888]">{t("admin.unitConverter.areaCalcHint")}</p>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-medium text-[#666] mb-1">{t("admin.unitConverter.width")} (in)</label>
          <input
            type="number"
            inputMode="decimal"
            step="any"
            value={width}
            onChange={(e) => setWidth(e.target.value)}
            className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2.5 text-base font-semibold text-[#111] outline-none focus:border-black sm:text-sm"
            placeholder='e.g. 24'
          />
        </div>
        <div>
          <label className="block text-[11px] font-medium text-[#666] mb-1">{t("admin.unitConverter.height")} (in)</label>
          <input
            type="number"
            inputMode="decimal"
            step="any"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2.5 text-base font-semibold text-[#111] outline-none focus:border-black sm:text-sm"
            placeholder='e.g. 36'
          />
        </div>
      </div>

      {/* Quick sizes */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {QUICK_SIZES.map((s) => (
          <button
            key={s.label}
            type="button"
            onClick={() => { setWidth(s.w.toString()); setHeight(s.h.toString()); }}
            className="rounded-full border border-[#e0e0e0] px-2.5 py-1 text-[11px] text-[#666] transition-colors hover:border-black hover:text-black"
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Price per sqft input */}
      <div className="mt-4">
        <label className="block text-[11px] font-medium text-[#666] mb-1">{t("admin.unitConverter.pricePerSqft")} ($)</label>
        <input
          type="number"
          inputMode="decimal"
          step="any"
          value={pricePerSqft}
          onChange={(e) => setPricePerSqft(e.target.value)}
          className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2.5 text-base font-semibold text-[#111] outline-none focus:border-black sm:text-sm"
          placeholder="e.g. 2.50"
        />
      </div>

      {/* Results */}
      {(w > 0 && h > 0) && (
        <div className="mt-4 rounded-[3px] bg-[#f6f6f7] p-4 space-y-2">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="text-lg font-bold text-[#111]">{sqIn.toFixed(1)}</div>
              <div className="text-[10px] text-[#888]">sq in</div>
            </div>
            <div>
              <div className="text-lg font-bold text-[#111]">{sqFt.toFixed(2)}</div>
              <div className="text-[10px] text-[#888]">sq ft</div>
            </div>
            <div>
              <div className="text-lg font-bold text-[#111]">{sqM.toFixed(4)}</div>
              <div className="text-[10px] text-[#888]">sq m</div>
            </div>
          </div>
          {price > 0 && (
            <div className="border-t border-[#e0e0e0] pt-3 text-center">
              <div className="text-2xl font-bold text-black">${totalPrice.toFixed(2)}</div>
              <div className="text-xs text-[#888]">{t("admin.unitConverter.totalAtRate")} ${price}/sqft</div>
              <div className="mt-1 text-xs text-[#aaa]">
                ${(totalPrice * 1.13).toFixed(2)} {t("admin.unitConverter.withHST")}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function UnitConverterPage() {
  const { t } = useTranslation();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-[#999]">
        <Link href="/admin/tools" className="hover:text-[#111]">{t("admin.tools.hubTitle")}</Link>
        <span>/</span>
        <span className="text-[#111] font-medium">{t("admin.unitConverter.title")}</span>
      </div>

      <div className="rounded-[3px] border border-[#e0e0e0] bg-white p-5">
        <h1 className="text-xl font-bold text-black">{t("admin.unitConverter.title")}</h1>
        <p className="mt-1 text-sm text-[#666]">{t("admin.unitConverter.subtitle")}</p>
      </div>

      {/* Area calculator (most used by mom for phone quoting) */}
      <AreaCalculator />

      {/* Conversion groups */}
      <div className="grid gap-4 sm:grid-cols-2">
        {CONVERSIONS.map((group) => (
          <div key={group.id} className="rounded-[3px] border border-[#e0e0e0] bg-white p-5">
            <h2 className="mb-3 text-sm font-bold text-black">{t(group.labelKey)}</h2>
            <ConverterGroup group={group} />
          </div>
        ))}
      </div>
    </div>
  );
}
