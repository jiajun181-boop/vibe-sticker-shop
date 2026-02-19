// Shared numbered step section wrapper used by all configurators
export default function ConfigStep({ number, title, subtitle, optional, children }) {
  return (
    <section className="rounded border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-4 flex items-start gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-900 text-sm font-black text-white">
          {number}
        </span>
        <div className="flex-1">
          <div className="flex items-baseline gap-2">
            <h2 className="text-base font-bold text-gray-900">{title}</h2>
            {optional && (
              <span className="rounded-sm bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-400">
                Optional
              </span>
            )}
          </div>
          {subtitle && <p className="mt-0.5 text-xs text-gray-400">{subtitle}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}
