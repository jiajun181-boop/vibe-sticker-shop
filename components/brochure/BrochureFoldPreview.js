"use client";

/**
 * BrochureFoldPreview — SVG fold type visualizer for brochures.
 * Shows bi-fold, tri-fold (roll), and z-fold diagrams.
 */

function BiFoldDiagram() {
  return (
    <svg viewBox="0 0 240 120" className="w-full max-w-[300px]">
      <defs>
        <linearGradient id="bf-l" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f0f9ff" />
          <stop offset="100%" stopColor="#e0f2fe" />
        </linearGradient>
        <linearGradient id="bf-r" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#eff6ff" />
          <stop offset="100%" stopColor="#dbeafe" />
        </linearGradient>
      </defs>

      {/* Shadow */}
      <ellipse cx="120" cy="108" rx="80" ry="5" fill="rgba(0,0,0,0.04)" />

      {/* Left panel */}
      <rect x="20" y="14" width="96" height="80" rx="2" fill="url(#bf-l)" stroke="#93c5fd" strokeWidth="1" />
      {/* Right panel */}
      <rect x="120" y="14" width="96" height="80" rx="2" fill="url(#bf-r)" stroke="#93c5fd" strokeWidth="1" />

      {/* Fold line */}
      <line x1="118" y1="10" x2="118" y2="98" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="4 3" />

      {/* Panel labels */}
      <text x="68" y="52" textAnchor="middle" fill="#3b82f6" fontSize="10" fontWeight="600" fontFamily="system-ui">Front</text>
      <text x="68" y="64" textAnchor="middle" fill="#93c5fd" fontSize="7" fontFamily="system-ui">Panel 1</text>
      <text x="168" y="52" textAnchor="middle" fill="#3b82f6" fontSize="10" fontWeight="600" fontFamily="system-ui">Back</text>
      <text x="168" y="64" textAnchor="middle" fill="#93c5fd" fontSize="7" fontFamily="system-ui">Panel 2</text>

      {/* Fold arrow */}
      <path d="M130,4 C124,4 120,8 118,12" fill="none" stroke="#3b82f6" strokeWidth="1" markerEnd="url(#arrow)" />
      <defs>
        <marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6" fill="none" stroke="#3b82f6" strokeWidth="1" />
        </marker>
      </defs>

      {/* Label */}
      <text x="120" y="114" textAnchor="middle" fill="#9ca3af" fontSize="8" fontFamily="system-ui">Bi-Fold — 2 Panels</text>
    </svg>
  );
}

function TriFoldDiagram() {
  return (
    <svg viewBox="0 0 280 120" className="w-full max-w-[300px]">
      <defs>
        <linearGradient id="tf-1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f0fdf4" />
          <stop offset="100%" stopColor="#dcfce7" />
        </linearGradient>
        <linearGradient id="tf-2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ecfdf5" />
          <stop offset="100%" stopColor="#d1fae5" />
        </linearGradient>
        <linearGradient id="tf-3" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f0fdf4" />
          <stop offset="100%" stopColor="#bbf7d0" />
        </linearGradient>
      </defs>

      <ellipse cx="140" cy="108" rx="100" ry="5" fill="rgba(0,0,0,0.04)" />

      {/* Panel 1 (left) */}
      <rect x="14" y="14" width="80" height="80" rx="2" fill="url(#tf-1)" stroke="#86efac" strokeWidth="1" />
      {/* Panel 2 (middle) */}
      <rect x="98" y="14" width="80" height="80" rx="2" fill="url(#tf-2)" stroke="#86efac" strokeWidth="1" />
      {/* Panel 3 (right — folds in first) */}
      <rect x="182" y="14" width="78" height="80" rx="2" fill="url(#tf-3)" stroke="#86efac" strokeWidth="1" />

      {/* Fold lines */}
      <line x1="96" y1="10" x2="96" y2="98" stroke="#22c55e" strokeWidth="1.5" strokeDasharray="4 3" />
      <line x1="180" y1="10" x2="180" y2="98" stroke="#22c55e" strokeWidth="1.5" strokeDasharray="4 3" />

      {/* Panel labels */}
      <text x="54" y="50" textAnchor="middle" fill="#16a34a" fontSize="9" fontWeight="600" fontFamily="system-ui">Front</text>
      <text x="54" y="62" textAnchor="middle" fill="#86efac" fontSize="7" fontFamily="system-ui">Panel 1</text>
      <text x="138" y="50" textAnchor="middle" fill="#16a34a" fontSize="9" fontWeight="600" fontFamily="system-ui">Inside</text>
      <text x="138" y="62" textAnchor="middle" fill="#86efac" fontSize="7" fontFamily="system-ui">Panel 2</text>
      <text x="222" y="50" textAnchor="middle" fill="#16a34a" fontSize="9" fontWeight="600" fontFamily="system-ui">Flap</text>
      <text x="222" y="62" textAnchor="middle" fill="#86efac" fontSize="7" fontFamily="system-ui">Panel 3</text>

      {/* Fold arrows */}
      <path d="M210,6 Q195,2 182,10" fill="none" stroke="#22c55e" strokeWidth="1" />
      <text x="200" y="5" textAnchor="middle" fill="#22c55e" fontSize="6" fontFamily="system-ui">1st fold</text>
      <path d="M68,6 Q82,2 96,10" fill="none" stroke="#22c55e" strokeWidth="1" />
      <text x="78" y="5" textAnchor="middle" fill="#22c55e" fontSize="6" fontFamily="system-ui">2nd fold</text>

      <text x="140" y="114" textAnchor="middle" fill="#9ca3af" fontSize="8" fontFamily="system-ui">Roll Fold (Tri-Fold) — 3 Panels</text>
    </svg>
  );
}

function ZFoldDiagram() {
  return (
    <svg viewBox="0 0 280 120" className="w-full max-w-[300px]">
      <defs>
        <linearGradient id="zf-1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fef3c7" />
          <stop offset="100%" stopColor="#fde68a" />
        </linearGradient>
        <linearGradient id="zf-2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fef9c3" />
          <stop offset="100%" stopColor="#fde68a" />
        </linearGradient>
        <linearGradient id="zf-3" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fef3c7" />
          <stop offset="100%" stopColor="#fcd34d" />
        </linearGradient>
      </defs>

      <ellipse cx="140" cy="108" rx="100" ry="5" fill="rgba(0,0,0,0.04)" />

      {/* 3 panels */}
      <rect x="14" y="14" width="80" height="80" rx="2" fill="url(#zf-1)" stroke="#fbbf24" strokeWidth="1" />
      <rect x="98" y="14" width="80" height="80" rx="2" fill="url(#zf-2)" stroke="#fbbf24" strokeWidth="1" />
      <rect x="182" y="14" width="80" height="80" rx="2" fill="url(#zf-3)" stroke="#fbbf24" strokeWidth="1" />

      {/* Fold lines */}
      <line x1="96" y1="10" x2="96" y2="98" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="4 3" />
      <line x1="180" y1="10" x2="180" y2="98" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="4 3" />

      {/* Panel labels */}
      <text x="54" y="50" textAnchor="middle" fill="#b45309" fontSize="9" fontWeight="600" fontFamily="system-ui">Front</text>
      <text x="54" y="62" textAnchor="middle" fill="#fbbf24" fontSize="7" fontFamily="system-ui">Panel 1</text>
      <text x="138" y="50" textAnchor="middle" fill="#b45309" fontSize="9" fontWeight="600" fontFamily="system-ui">Inside</text>
      <text x="138" y="62" textAnchor="middle" fill="#fbbf24" fontSize="7" fontFamily="system-ui">Panel 2</text>
      <text x="222" y="50" textAnchor="middle" fill="#b45309" fontSize="9" fontWeight="600" fontFamily="system-ui">Back</text>
      <text x="222" y="62" textAnchor="middle" fill="#fbbf24" fontSize="7" fontFamily="system-ui">Panel 3</text>

      {/* Z-fold direction arrows */}
      <path d="M82,6 L96,6" fill="none" stroke="#f59e0b" strokeWidth="1" markerEnd="url(#z-arrow)" />
      <path d="M196,6 L180,6" fill="none" stroke="#f59e0b" strokeWidth="1" markerEnd="url(#z-arrow)" />
      <defs>
        <marker id="z-arrow" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto">
          <path d="M0,0 L5,2.5 L0,5" fill="none" stroke="#f59e0b" strokeWidth="0.8" />
        </marker>
      </defs>
      <text x="86" y="4" textAnchor="middle" fill="#f59e0b" fontSize="6" fontFamily="system-ui">fold →</text>
      <text x="190" y="4" textAnchor="middle" fill="#f59e0b" fontSize="6" fontFamily="system-ui">← fold</text>

      <text x="140" y="114" textAnchor="middle" fill="#9ca3af" fontSize="8" fontFamily="system-ui">Z-Fold — 3 Panels (accordion)</text>
    </svg>
  );
}

const FOLD_MAP = {
  "brochures-bi-fold": BiFoldDiagram,
  "brochures-tri-fold": TriFoldDiagram,
  "brochures-z-fold": ZFoldDiagram,
};

export default function BrochureFoldPreview({ typeId }) {
  const Diagram = FOLD_MAP[typeId];
  if (!Diagram) return null;

  return (
    <div className="flex flex-col items-center gap-1">
      <Diagram />
    </div>
  );
}
