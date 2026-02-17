import Breadcrumbs from "@/components/Breadcrumbs";

/**
 * Dark gradient hero section with breadcrumbs + trust row.
 *
 * Props:
 *  - breadcrumbs: [{ label, href? }]
 *  - title: string
 *  - subtitle: string
 *  - badges: [{ icon?, label }]   — trust badge items
 *  - t                             — translation function (optional)
 */
export default function ConfigHero({ breadcrumbs, title, subtitle, badges = [] }) {
  return (
    <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <Breadcrumbs items={breadcrumbs} dark />
        <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-2 max-w-2xl text-sm text-gray-300 sm:text-base">{subtitle}</p>
        )}
        {badges.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-gray-400 sm:gap-6 sm:text-sm">
            {badges.map((b, i) => (
              <span key={i} className="flex items-center gap-1.5">
                <svg className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {b}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
