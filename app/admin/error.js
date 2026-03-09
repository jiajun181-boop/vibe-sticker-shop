"use client";

export default function AdminError({ error, reset }) {
  return (
    <div className="flex h-64 flex-col items-center justify-center gap-4">
      <p className="text-sm text-red-600">Something went wrong loading the admin panel.</p>
      {process.env.NODE_ENV === "development" && error?.message && (
        <p className="max-w-md rounded-lg bg-gray-100 px-3 py-2 text-xs text-gray-500 break-words">
          {error.message}
        </p>
      )}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-[#fff] hover:bg-black"
        >
          Try Again
        </button>
        <a
          href="/admin/login"
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Re-login
        </a>
      </div>
    </div>
  );
}
