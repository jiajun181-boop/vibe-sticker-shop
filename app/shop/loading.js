import ProductGridSkeleton from "@/components/skeletons/ProductGridSkeleton";

export default function ShopLoading() {
  return (
    <main className="min-h-screen bg-[var(--color-gray-50)] px-6 py-14">
      <div className="mx-auto max-w-[1600px] space-y-8">
        <div className="space-y-3">
          <div className="h-4 w-32 animate-pulse rounded bg-[var(--color-gray-200)]" />
          <div className="h-8 w-64 animate-pulse rounded bg-[var(--color-gray-200)]" />
        </div>
        <ProductGridSkeleton />
      </div>
    </main>
  );
}
