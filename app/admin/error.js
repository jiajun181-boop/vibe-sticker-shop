"use client";

export default function AdminError({ error, reset }) {
  return (
    <div className="flex h-64 flex-col items-center justify-center gap-4">
      <p className="text-sm text-red-600">
        {error?.message || "Something went wrong loading the admin panel."}
      </p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-black"
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
