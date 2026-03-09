"use client";

import Link from "next/link";

export default function AccountError({ error, reset }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <div className="max-w-md">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
          <svg className="h-7 w-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900">Something went wrong</h2>
        <p className="mt-2 text-sm text-gray-600">
          We couldn&apos;t load your account page. Please try again.
        </p>
        {process.env.NODE_ENV === "development" && error?.message && (
          <p className="mt-3 rounded-lg bg-gray-100 px-3 py-2 text-left text-xs text-gray-500 break-words">
            {error.message}
          </p>
        )}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={reset}
            className="rounded-xl bg-gray-900 px-6 py-3 text-xs font-semibold uppercase tracking-widest text-white hover:bg-black"
          >
            Try Again
          </button>
          <Link
            href="/account"
            className="rounded-xl border border-gray-300 px-6 py-3 text-xs font-semibold uppercase tracking-widest text-gray-700 hover:bg-gray-50"
          >
            Back to Account
          </Link>
        </div>
      </div>
    </div>
  );
}
