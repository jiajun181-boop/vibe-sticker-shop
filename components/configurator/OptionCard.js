"use client";

/**
 * Unified selectable option card — teal-border selected state.
 * Replaces scattered <button> styles across configurators.
 */
export default function OptionCard({
  label,
  description,
  selected,
  onSelect,
  icon,
  badge,
  fullWidth = false,
  className = "",
  children,
  recommended = false,
  recommendedLabel,
  priceHint,
  disabled = false,
  disabledReason,
  detailRows,
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-disabled={disabled || undefined}
      tabIndex={disabled ? -1 : 0}
      onClick={disabled ? undefined : onSelect}
      onKeyDown={(e) => {
        if (disabled) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      className={`relative flex items-center gap-1.5 rounded-lg border-2 px-2 py-1.5 sm:gap-2.5 sm:px-3 sm:py-2.5 text-left transition-all focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 ${
        disabled
          ? "cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400 opacity-50"
          : selected
            ? "border-teal-500 bg-teal-50 text-gray-900"
            : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:shadow-sm"
      } ${fullWidth ? "w-full" : ""} ${className}`}
    >
      {/* Recommended pill — top-left */}
      {recommended && !disabled && (
        <span className="absolute left-1.5 top-1.5 rounded-full bg-green-100 px-1.5 py-px text-[9px] font-bold text-green-700">
          {"\u2605"} {recommendedLabel || "Rec"}
        </span>
      )}
      {/* Teal checkmark — top-right */}
      {selected && !disabled && (
        <span className="absolute right-1.5 top-1.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-teal-500 text-white">
          <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none">
            <path d="M2.5 6l2.5 2.5 4.5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      )}
      {icon && <span className="shrink-0">{icon}</span>}
      <span className="min-w-0 flex-1">
        <span className={`flex items-center gap-1.5 text-xs font-bold ${recommended && !disabled ? "mt-3" : ""}`}>
          {label}
          {priceHint && (
            <span className="text-[10px] font-semibold text-amber-600">{priceHint}</span>
          )}
        </span>
        {description && (
          <span className={`block text-[10px] ${disabled ? "text-gray-300" : selected ? "text-teal-700" : "text-gray-400"}`}>
            {description}
          </span>
        )}
        {detailRows && detailRows.length > 0 && (
          <span className="mt-1 block space-y-0.5">
            {detailRows.map((row, i) => (
              <span key={i} className={`flex gap-1.5 text-[10px] ${disabled ? "text-gray-300" : "text-gray-400"}`}>
                <span className="font-semibold shrink-0">{row.label}:</span>
                <span>{row.text}</span>
              </span>
            ))}
          </span>
        )}
        {disabledReason && disabled && (
          <span className="mt-0.5 block text-[10px] font-medium text-red-400">{disabledReason}</span>
        )}
        {children}
      </span>
      {badge && (
        <span className="shrink-0">{badge}</span>
      )}
    </button>
  );
}
