"use client";

import { useState } from "react";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";

/**
 * Coming Soon page for sign products not yet available.
 *
 * Props:
 *  - name: product display name
 *  - description: short product description
 *  - slug: product slug
 *  - category: category slug
 */
export default function ComingSoonPage({ name, description, slug, category }) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email || loading) return;
    setLoading(true);
    try {
      await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "notify-signup",
          email,
          product: slug,
          message: `Notify me when ${name} is available`,
        }),
      });
      setSubmitted(true);
    } catch {
      // Fail silently — not critical
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[var(--color-gray-50)]">
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <Breadcrumbs
          items={[
            { label: "Shop", href: "/shop" },
            { label: "Signs & Display Boards", href: `/shop/${category}` },
            { label: name },
          ]}
        />

        <div className="mt-10 text-center">
          {/* Coming Soon Badge */}
          <span className="inline-flex items-center rounded-full bg-amber-100 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-amber-700">
            Coming Soon
          </span>

          <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            {name}
          </h1>

          {description && (
            <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-gray-500">
              {description}
            </p>
          )}

          {/* Email signup */}
          <div className="mx-auto mt-10 max-w-sm">
            {submitted ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
                <p className="text-sm font-semibold text-emerald-700">
                  We&apos;ll notify you when {name} is available!
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <p className="text-sm font-medium text-gray-600">
                  Get notified when this product launches:
                </p>
                <div className="flex gap-2">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900/10"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="shrink-0 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-gray-800 disabled:opacity-50"
                  >
                    {loading ? "..." : "Notify Me"}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Back link */}
          <div className="mt-10">
            <Link
              href={`/shop/${category}`}
              className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
              Back to Signs & Display Boards
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
