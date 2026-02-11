"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/useTranslation";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const { t } = useTranslation();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError(t("auth.signup.passwordMinLength"));
      return;
    }
    if (password !== confirmPassword) {
      setError(t("auth.signup.passwordMismatch"));
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Reset failed");
        return;
      }
      setSuccess(true);
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center px-4 py-16">
        <div className="text-center">
          <p className="text-sm text-red-600">{t("auth.resetPassword.invalidToken")}</p>
          <Link href="/forgot-password" className="mt-4 inline-block text-sm font-semibold text-gray-900 hover:underline">
            {t("auth.forgotPassword.title")}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-[70vh] items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <h1 className="text-center text-lg font-semibold tracking-[0.25em] text-gray-900">
          {t("auth.resetPassword.title")}
        </h1>

        {success ? (
          <div className="mt-8 rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
            <p className="text-sm text-emerald-700">{t("auth.resetPassword.success")}</p>
            <Link href="/login" className="mt-4 inline-block text-sm font-semibold text-gray-900 hover:underline">
              {t("auth.login.title")}
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label htmlFor="new-pw" className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-500">
                {t("auth.resetPassword.newPassword")}
              </label>
              <input
                id="new-pw"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-gray-500"
              />
            </div>
            <div>
              <label htmlFor="confirm-pw" className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-500">
                {t("auth.resetPassword.confirmPassword")}
              </label>
              <input
                id="confirm-pw"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-gray-500"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-gray-900 px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              {loading ? "..." : t("auth.resetPassword.submit")}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
