"use client";

/**
 * BookletPreview — SVG visual showing binding type, page count, and cover options.
 * Shows a 3/4 perspective booklet/brochure with the selected binding style.
 */

function SaddleStitchPreview({ pageCount, coverColor }) {
  const sheets = Math.min(Math.round(pageCount / 4), 6);
  return (
    <svg viewBox="0 0 200 140" className="w-full max-w-[280px]">
      <defs>
        <linearGradient id="ss-shadow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#000" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {/* Shadow */}
      <ellipse cx="100" cy="128" rx="65" ry="6" fill="rgba(0,0,0,0.06)" />

      {/* Inner pages (stacked slightly spread) */}
      {Array.from({ length: sheets }, (_, i) => {
        const spread = i * 1.5;
        const yOff = i * 0.8;
        return (
          <g key={i} opacity={0.6 + i * 0.06}>
            <path
              d={`M${62 - spread},${30 + yOff} Q100,${44 + yOff} ${138 + spread},${30 + yOff} L${138 + spread},${112 + yOff} Q100,${118 + yOff} ${62 - spread},${112 + yOff} Z`}
              fill="#f9fafb"
              stroke="#e5e7eb"
              strokeWidth="0.5"
            />
          </g>
        );
      })}

      {/* Cover - left half */}
      <path
        d={`M60,28 Q100,42 100,42 L100,115 Q60,115 60,115 Z`}
        fill={coverColor}
        stroke="#9ca3af"
        strokeWidth="0.8"
      />

      {/* Cover - right half */}
      <path
        d={`M100,42 Q100,42 140,28 L140,115 Q100,115 100,115 Z`}
        fill={coverColor}
        stroke="#9ca3af"
        strokeWidth="0.8"
      />

      {/* Spine crease */}
      <line x1="100" y1="42" x2="100" y2="115" stroke="#9ca3af" strokeWidth="0.6" strokeDasharray="3 2" />

      {/* Staples */}
      <rect x="98" y="60" width="4" height="6" rx="1" fill="#9ca3af" />
      <rect x="98" y="92" width="4" height="6" rx="1" fill="#9ca3af" />

      {/* Cover texture lines */}
      <g opacity="0.08">
        <line x1="70" y1="55" x2="95" y2="55" stroke="#000" />
        <line x1="70" y1="62" x2="92" y2="62" stroke="#000" />
        <line x1="70" y1="69" x2="88" y2="69" stroke="#000" />
        <line x1="105" y1="55" x2="130" y2="55" stroke="#000" />
        <line x1="105" y1="62" x2="128" y2="62" stroke="#000" />
      </g>

      {/* Label */}
      <text x="100" y="136" textAnchor="middle" fill="#9ca3af" fontSize="8" fontFamily="system-ui">
        Saddle Stitch · {pageCount}pp
      </text>
    </svg>
  );
}

function PerfectBoundPreview({ pageCount, coverColor }) {
  const spineW = Math.min(Math.max(pageCount * 0.12, 3), 16);
  return (
    <svg viewBox="0 0 200 140" className="w-full max-w-[280px]">
      {/* Shadow */}
      <ellipse cx="100" cy="130" rx="55" ry="5" fill="rgba(0,0,0,0.06)" />

      {/* Pages block */}
      <rect x={72 + spineW} y="26" width="60" height="92" rx="1" fill="#fafafa" stroke="#e5e7eb" strokeWidth="0.5" />

      {/* Page edges */}
      <g opacity="0.15">
        {Array.from({ length: 8 }, (_, i) => (
          <line key={i} x1={72 + spineW + 2} y1={32 + i * 10} x2={130} y2={32 + i * 10} stroke="#9ca3af" strokeWidth="0.3" />
        ))}
      </g>

      {/* Back cover */}
      <rect x={70 + spineW} y="24" width="64" height="96" rx="2" fill={coverColor} stroke="#9ca3af" strokeWidth="0.8" />

      {/* Spine */}
      <rect x="70" y="24" width={spineW} height="96" rx="1" fill={coverColor} stroke="#9ca3af" strokeWidth="0.8" />
      <rect x="70" y="24" width={spineW} height="96" rx="1" fill="rgba(0,0,0,0.08)" />

      {/* Front cover */}
      <rect x="66" y="22" width="64" height="96" rx="2" fill={coverColor} stroke="#9ca3af" strokeWidth="0.8" />

      {/* Cover content hints */}
      <g opacity="0.1">
        <rect x="76" y="40" width="40" height="4" rx="2" fill="#000" />
        <rect x="76" y="48" width="30" height="3" rx="1.5" fill="#000" />
        <rect x="76" y="55" width="35" height="3" rx="1.5" fill="#000" />
      </g>

      {/* Label */}
      <text x="100" y="136" textAnchor="middle" fill="#9ca3af" fontSize="8" fontFamily="system-ui">
        Perfect Bound · {pageCount}pp
      </text>
    </svg>
  );
}

function WireOPreview({ pageCount, coverColor }) {
  return (
    <svg viewBox="0 0 200 140" className="w-full max-w-[280px]">
      {/* Shadow */}
      <ellipse cx="100" cy="130" rx="55" ry="5" fill="rgba(0,0,0,0.06)" />

      {/* Back pages */}
      <rect x="70" y="24" width="64" height="96" rx="2" fill="#fafafa" stroke="#e5e7eb" strokeWidth="0.5" />

      {/* Front cover */}
      <rect x="66" y="22" width="64" height="96" rx="2" fill={coverColor} stroke="#9ca3af" strokeWidth="0.8" />

      {/* Wire-O binding loops on left edge */}
      {Array.from({ length: 8 }, (_, i) => {
        const y = 32 + i * 10;
        return (
          <g key={i}>
            <ellipse cx="66" cy={y} rx="4" ry="3.5" fill="none" stroke="#6b7280" strokeWidth="1.2" />
            <ellipse cx="66" cy={y} rx="4" ry="3.5" fill="none" stroke="#9ca3af" strokeWidth="0.5" />
          </g>
        );
      })}

      {/* Cover content hints */}
      <g opacity="0.1">
        <rect x="78" y="40" width="40" height="4" rx="2" fill="#000" />
        <rect x="78" y="48" width="30" height="3" rx="1.5" fill="#000" />
        <rect x="78" y="55" width="35" height="3" rx="1.5" fill="#000" />
      </g>

      {/* Label */}
      <text x="100" y="136" textAnchor="middle" fill="#9ca3af" fontSize="8" fontFamily="system-ui">
        Wire-O · {pageCount}pp
      </text>
    </svg>
  );
}

const COVER_COLORS = {
  "self-cover": "#f5f5f4",
  "14pt-c2s": "#ffffff",
};

export default function BookletPreview({
  binding = "saddle-stitch",
  pageCount = 16,
  coverPaper = "self-cover",
}) {
  const coverColor = COVER_COLORS[coverPaper] || "#ffffff";

  const PreviewComponent = {
    "saddle-stitch": SaddleStitchPreview,
    "perfect-bound": PerfectBoundPreview,
    "wire-o": WireOPreview,
  }[binding] || SaddleStitchPreview;

  return (
    <div className="flex flex-col items-center gap-1">
      <PreviewComponent
        pageCount={pageCount}
        coverColor={coverColor}
      />
    </div>
  );
}
