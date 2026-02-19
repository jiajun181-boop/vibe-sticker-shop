export default function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-md border border-[var(--color-gray-200)] bg-white">
      <div className="aspect-[4/3] animate-pulse bg-[var(--color-gray-200)]" />
      <div className="p-4 space-y-2">
        <div className="h-4 w-3/4 animate-pulse rounded-sm bg-[var(--color-gray-200)]" />
        <div className="h-3 w-1/2 animate-pulse rounded-sm bg-[var(--color-gray-100)]" />
      </div>
    </div>
  );
}
