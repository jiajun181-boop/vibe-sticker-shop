"use client";

/**
 * Template download button that generates a professional PDF design template.
 *
 * Props:
 *  - slug        — product slug (used in URL and filename)
 *  - width       — width in inches
 *  - height      — height in inches
 *  - bleed       — bleed in inches (default 0.125)
 *  - dpi         — DPI (default 300)
 *  - folds       — number of fold lines (default 0)
 *  - foldType    — "bifold" | "tri-fold" | "z-fold" (default "bifold")
 *  - product     — product display name (for the PDF label)
 *  - t           — translation function (optional)
 */
export default function TemplateDownloadButton({
  slug,
  width,
  height,
  bleed = 0.125,
  dpi = 300,
  folds = 0,
  foldType = "bifold",
  product,
  t,
}) {
  if (!width || !height || !slug) return null;

  const params = new URLSearchParams({
    width: String(width),
    height: String(height),
    bleed: String(bleed),
    unit: "in",
    product: product || slug,
    dpi: String(dpi),
    folds: String(folds),
    foldType,
  });

  const downloadUrl = `/api/templates/${encodeURIComponent(slug)}/download?${params}`;
  const sizeLabel = `${width}" × ${height}"`;
  const isLargeFormat = Math.max(width, height) > 24;

  return (
    <a
      href={downloadUrl}
      download
      className="group inline-flex w-full items-center gap-3 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 px-4 py-3 transition-all hover:border-gray-500 hover:bg-white"
    >
      {/* Download icon with bounce on hover */}
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-900 text-white transition-transform group-hover:scale-110 group-hover:animate-[templateBounce_0.4s_ease]">
        <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
        </svg>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-gray-800">
          {t?.("template.download") || "Download Design Template"}
        </p>
        <p className="text-[11px] text-gray-500">
          {sizeLabel} + {bleed}" bleed | {dpi} DPI{folds > 0 ? ` | ${folds} fold line${folds > 1 ? "s" : ""}` : ""}{isLargeFormat ? " | Scaled" : ""}
        </p>
      </div>
      <span className="shrink-0 rounded-md bg-gray-200 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-600">
        PDF
      </span>

      <style jsx>{`
        @keyframes templateBounce {
          0%, 100% { transform: scale(1.1) translateY(0); }
          50% { transform: scale(1.1) translateY(3px); }
        }
      `}</style>
    </a>
  );
}
