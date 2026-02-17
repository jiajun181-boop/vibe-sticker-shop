export default function ProductDetailLoading() {
  return (
    <main className="bg-[var(--color-gray-50)] pb-20 pt-10">
      <div className="mx-auto max-w-6xl space-y-10 px-6">
        <div className="h-3 w-48 animate-pulse rounded bg-[var(--color-gray-200)]" />
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-7">
            <div className="aspect-square animate-pulse rounded-3xl bg-[var(--color-gray-200)]" />
            <div className="grid grid-cols-5 gap-2">
              {Array.from({ length: 5 }, (_, i) => (
                <div key={i} className="aspect-square animate-pulse rounded-xl bg-[var(--color-gray-200)]" />
              ))}
            </div>
          </div>
          <div className="space-y-6 lg:col-span-5">
            <div className="space-y-3">
              <div className="h-8 w-3/4 animate-pulse rounded bg-[var(--color-gray-200)]" />
              <div className="h-4 w-full animate-pulse rounded bg-[var(--color-gray-100)]" />
              <div className="h-4 w-2/3 animate-pulse rounded bg-[var(--color-gray-100)]" />
            </div>
            <div className="h-80 animate-pulse rounded-3xl bg-[var(--color-gray-200)]" />
          </div>
        </div>
      </div>
    </main>
  );
}
