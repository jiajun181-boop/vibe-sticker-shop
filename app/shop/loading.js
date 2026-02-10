import ProductGridSkeleton from "@/components/skeletons/ProductGridSkeleton";

export default function ShopLoading() {
  return (
    <main className="min-h-screen bg-gray-50 px-6 py-14">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="space-y-3">
          <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
          <div className="h-8 w-64 animate-pulse rounded bg-gray-200" />
        </div>
        <ProductGridSkeleton />
      </div>
    </main>
  );
}
