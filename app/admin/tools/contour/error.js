"use client";

/**
 * Route-level error boundary for /admin/tools/contour.
 *
 * Catches unhandled errors (including canvas/WASM OOM) that would
 * otherwise show the browser's default error page.
 */
export default function ContourError({ error, reset }) {
  const isDev = process.env.NODE_ENV === "development";

  return (
    <div className="mx-auto max-w-lg py-20 text-center">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
        <svg className="h-8 w-8 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
      </div>
      <h2 className="text-lg font-bold text-[#111]">
        Contour Tool Error
      </h2>
      <p className="mt-2 text-sm text-[#666]">
        The contour tool ran into a problem. This usually happens when
        the image is too large or the browser ran out of memory.
      </p>
      <p className="mt-1 text-sm text-[#666]">
        Try using a smaller image, or switch to a desktop browser for
        large artwork files.
      </p>
      {isDev && error?.message && (
        <p className="mx-auto mt-4 max-w-md rounded-[3px] bg-[#f5f5f5] px-3 py-2 text-left text-xs text-[#999] break-words">
          {error.message}
        </p>
      )}
      <div className="mt-6 flex justify-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-[3px] bg-black px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#222]"
        >
          Try Again
        </button>
        <a
          href="/admin/tools"
          className="rounded-[3px] border border-[#d0d0d0] px-5 py-2.5 text-sm font-medium text-[#666] hover:border-black hover:text-black"
        >
          Back to Tools
        </a>
      </div>
    </div>
  );
}
