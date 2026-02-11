"use client";

function clamp(n, min, max) {
  const num = Number(n);
  if (!Number.isFinite(num)) return min;
  return Math.max(min, Math.min(max, num));
}

function Star({ size = 16, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      className={className}
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );
}

export default function StarRating({
  value = 0,
  outOf = 5,
  size = 16,
  className = "",
  ariaLabel,
}) {
  const max = Number(outOf) || 5;
  const v = clamp(value, 0, max);
  const pct = (v / max) * 100;
  const label = ariaLabel || `Rating ${v.toFixed(1)} out of ${max}`;

  return (
    <div className={`relative inline-flex ${className}`} role="img" aria-label={label}>
      <div className="flex gap-0.5 text-gray-200">
        {Array.from({ length: max }, (_, i) => (
          <Star key={i} size={size} />
        ))}
      </div>
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ width: `${pct}%` }}
        aria-hidden="true"
      >
        <div className="flex gap-0.5 text-amber-400">
          {Array.from({ length: max }, (_, i) => (
            <Star key={i} size={size} />
          ))}
        </div>
      </div>
    </div>
  );
}

