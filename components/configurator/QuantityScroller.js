"use client";

import { useRef, useEffect } from "react";

/**
 * Horizontal scrollable quantity selector.
 * Compact single-line layout — perfect for mobile e-commerce.
 *
 * Props:
 *  - quantities       — array of qty numbers, e.g. [50, 100, 250, 500, 1000]
 *  - selected         — currently selected quantity
 *  - onSelect(qty)    — callback when a preset is clicked
 *  - customQty        — custom quantity input value (string)
 *  - onCustomChange   — callback for custom input
 *  - t                — translation function
 */
export default function QuantityScroller({
  quantities = [],
  selected,
  onSelect,
  customQty = "",
  onCustomChange,
  t,
  min = 1,
  placeholder = "e.g. 300",
}) {
  const scrollRef = useRef(null);
  const activeRef = useRef(null);

  // Auto-scroll to selected item on mount
  useEffect(() => {
    if (activeRef.current && scrollRef.current) {
      const container = scrollRef.current;
      const el = activeRef.current;
      const left = el.offsetLeft - container.offsetWidth / 2 + el.offsetWidth / 2;
      container.scrollTo({ left: Math.max(0, left), behavior: "smooth" });
    }
  }, [selected]);

  const isCustom = customQty !== "" && !quantities.includes(parseInt(customQty, 10));

  return (
    <div className="space-y-2.5">
      {/* Horizontal scrollable pills */}
      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {quantities.map((q) => {
          const isActive = !isCustom && selected === q;
          return (
            <button
              key={q}
              ref={isActive ? activeRef : undefined}
              type="button"
              onClick={() => {
                onSelect?.(q);
                onCustomChange?.("");
              }}
              className={`flex-shrink-0 rounded-full border-2 px-4 py-2 text-sm font-bold transition-all duration-150 ${
                isActive
                  ? "border-gray-900 bg-gray-900 text-[#fff] shadow-md"
                  : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
              }`}
            >
              {q.toLocaleString()}
            </button>
          );
        })}
      </div>

      {/* Custom quantity inline */}
      {onCustomChange && (
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-gray-500 whitespace-nowrap">
            {t?.("bc.customQty") || t?.("configurator.customQty") || "Custom qty"}:
          </label>
          <input
            type="number"
            min={min}
            max="999999"
            value={customQty}
            onChange={(e) => {
              onCustomChange(e.target.value);
              const n = parseInt(e.target.value, 10);
              if (n > 0) onSelect?.(n);
            }}
            placeholder={placeholder}
            className="w-28 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
          />
        </div>
      )}
    </div>
  );
}
