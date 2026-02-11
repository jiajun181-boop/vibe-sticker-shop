"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/useTranslation";

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setSent(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-[70vh] items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <h1 className="text-center text-lg font-semibold tracking-[0.25em] text-gray-900">
          {t("auth.forgotPassword.title")}
        </h1>
        <p className="mt-2 text-center text-sm text-gray-500">
          {t("auth.forgotPassword.subtitle")}
        </p>

        {sent ? (
          <div className="mt-8 rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
            <p className="text-sm text-emerald-700">{t("auth.forgotPassword.success")}</p>
            <Link href="/login" className="mt-4 inline-block text-sm font-semibold text-gray-900 hover:underline">
              {t("auth.forgotPassword.backToLogin")}
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label htmlFor="fp-email" className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-500">
                {t("auth.login.email")}
              </label>
              <input
                id="fp-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-gray-500"
                placeholder="you@example.com"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-gray-900 px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              {loading ? "..." : t("auth.forgotPassword.submit")}
            </button>
            <p className="text-center">
              <Link href="/login" className="text-sm text-gray-500 hover:text-gray-900">
                {t("auth.forgotPassword.backToLogin")}
              </Link>
            </p>
          </form>
        )}
      </div>
    </main>
  );
}
