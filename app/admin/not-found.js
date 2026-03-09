import Link from "next/link";

export default function AdminNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <p className="text-7xl font-black text-gray-200">404</p>
      <h1 className="mt-4 text-lg font-semibold text-gray-900">Page not found</h1>
      <p className="mt-2 text-sm text-gray-500">
        This admin page doesn&apos;t exist or you don&apos;t have permission to access it.
      </p>
      <div className="mt-6 flex gap-3">
        <Link
          href="/admin"
          className="rounded-[3px] bg-black px-5 py-2.5 text-xs font-semibold text-white hover:bg-gray-800 transition-colors"
        >
          Dashboard
        </Link>
        <Link
          href="/admin/orders"
          className="rounded-[3px] border border-gray-300 px-5 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Orders
        </Link>
      </div>
    </div>
  );
}
