"use client";

/**
 * Custom width/height inputs with in/cm toggle + validation errors.
 *
 * Props:
 *  - customW, customH       — string state values
 *  - onChangeW, onChangeH   — setters
 *  - unit                    — "in" | "cm"
 *  - onChangeUnit            — setter
 *  - minLabel                — e.g. '0.5" × 0.5"'
 *  - maxLabel                — e.g. '53" × 53"'
 *  - dimErrors               — string[]
 *  - t                       — translation function
 */
export default function CustomDimensions({
  customW,
  customH,
  onChangeW,
  onChangeH,
  unit,
  onChangeUnit,
  minLabel,
  maxLabel,
  dimErrors = [],
  t,
}) {
  return (
    <div className="mt-4 rounded-sm border border-gray-200 bg-white p-4">
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <label className="mb-1.5 block text-xs font-medium text-gray-500">
            {t?.("configurator.width") || "Width"}
          </label>
          <input
            type="number"
            min="0.1"
            step="0.1"
            value={customW}
            onChange={(e) => onChangeW(e.target.value)}
            placeholder={unit === "in" ? '3.0"' : "7.6cm"}
            className="w-full rounded-sm border border-gray-300 px-3 py-2.5 text-sm font-medium focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
          />
        </div>
        <span className="pb-3 text-lg font-light text-gray-300">&times;</span>
        <div className="flex-1">
          <label className="mb-1.5 block text-xs font-medium text-gray-500">
            {t?.("configurator.height") || "Height"}
          </label>
          <input
            type="number"
            min="0.1"
            step="0.1"
            value={customH}
            onChange={(e) => onChangeH(e.target.value)}
            placeholder={unit === "in" ? '3.0"' : "7.6cm"}
            className="w-full rounded-sm border border-gray-300 px-3 py-2.5 text-sm font-medium focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
          />
        </div>
        {/* Unit toggle */}
        <div className="flex overflow-hidden rounded-sm border border-gray-300">
          {["in", "cm"].map((u) => (
            <button
              key={u}
              type="button"
              onClick={() => onChangeUnit(u)}
              className={`px-3.5 py-2.5 text-xs font-bold uppercase transition ${
                unit === u
                  ? "bg-gray-900 text-white"
                  : "bg-white text-gray-500 hover:bg-gray-50"
              }`}
            >
              {u}
            </button>
          ))}
        </div>
      </div>
      {/* Size range hint */}
      {(minLabel || maxLabel) && (
        <p className="mt-2 text-[11px] text-gray-400">
          {minLabel && <>Min: {minLabel}</>}
          {minLabel && maxLabel && " \u00A0|\u00A0 "}
          {maxLabel && <>Max: {maxLabel}</>}
        </p>
      )}
      {/* Dimension errors */}
      {dimErrors.length > 0 && (
        <div className="mt-2 rounded-sm border border-red-200 bg-red-50 px-3 py-2">
          {dimErrors.map((e, i) => (
            <p key={i} className="text-xs font-medium text-red-600">{e}</p>
          ))}
        </div>
      )}
    </div>
  );
}
