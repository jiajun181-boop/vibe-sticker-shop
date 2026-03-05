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
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      className={`relative flex items-center gap-2.5 rounded-lg border-2 px-3 py-2.5 text-left transition-all focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 ${
        selected
          ? "border-teal-500 bg-teal-50 text-gray-900"
          : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:shadow-sm"
      } ${fullWidth ? "w-full" : ""} ${className}`}
    >
      {/* Teal checkmark — top-right */}
      {selected && (
        <span className="absolute right-1.5 top-1.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-teal-500 text-white">
          <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none">
            <path d="M2.5 6l2.5 2.5 4.5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      )}
      {icon && <span className="shrink-0">{icon}</span>}
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-bold">{label}</span>
        {description && (
          <span className={`block text-[10px] ${selected ? "text-teal-700" : "text-gray-400"}`}>
            {description}
          </span>
        )}
        {children}
      </span>
      {badge && (
        <span className="shrink-0">{badge}</span>
      )}
    </button>
  );
}
