"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth-store";
import { useTranslation } from "@/lib/i18n/useTranslation";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-[70vh] items-center justify-center px-4 py-16">
          <div className="text-sm text-[var(--color-gray-500)]">Loading...</div>
        </main>
      }
    >
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/account";
  const login = useAuthStore((s) => s.login);
  const { t } = useTranslation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      router.push(redirect);
    } catch (err) {
      setError(err.message || t("auth.login.error"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-[70vh] items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <h1 className="text-center text-lg font-semibold tracking-[0.25em] text-[var(--color-gray-900)]">
          {t("auth.login.title")}
        </h1>
        <p className="mt-2 text-center text-sm text-[var(--color-gray-500)]">
          {t("auth.login.subtitle")}
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label htmlFor="email" className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-gray-500)]">
              {t("auth.login.email")}
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[var(--color-gray-300)] px-4 py-3 text-sm outline-none focus:border-[var(--color-gray-500)]"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-gray-500)]">
                {t("auth.login.password")}
              </label>
              <Link href="/forgot-password" className="text-xs text-[var(--color-gray-500)] hover:text-[var(--color-gray-900)]">
                {t("auth.login.forgotPassword")}
              </Link>
            </div>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[var(--color-gray-300)] px-4 py-3 text-sm outline-none focus:border-[var(--color-gray-500)]"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[var(--color-gray-900)] px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:bg-[var(--color-gray-400)]"
          >
            {loading ? t("auth.login.signingIn") : t("auth.login.submit")}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[var(--color-gray-500)]">
          {t("auth.login.noAccount")}{" "}
          <Link href="/signup" className="font-semibold text-[var(--color-gray-900)] hover:underline">
            {t("auth.login.signUp")}
          </Link>
        </p>
      </div>
    </main>
  );
}
