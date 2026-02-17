"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth-store";
import { useTranslation } from "@/lib/i18n/useTranslation";

export default function SignupPage() {
  const router = useRouter();
  const signup = useAuthStore((s) => s.signup);
  const { t } = useTranslation();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [accountType, setAccountType] = useState("B2C");
  const [companyName, setCompanyName] = useState("");
  const [companyRole, setCompanyRole] = useState("");
  const [error, setError] = useState("");
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
      await signup({
        name,
        email,
        password,
        accountType,
        companyName: accountType === "B2B" ? companyName : undefined,
        companyRole: accountType === "B2B" ? companyRole : undefined,
      });
      router.push("/account");
    } catch (err) {
      setError(err.message || t("auth.signup.error"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-[70vh] items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <h1 className="text-center text-lg font-semibold tracking-[0.25em] text-[var(--color-gray-900)]">
          {t("auth.signup.title")}
        </h1>

        {/* Account Type Toggle */}
        <div className="mt-6 flex rounded-full border border-[var(--color-gray-300)] p-1">
          <button
            type="button"
            onClick={() => setAccountType("B2C")}
            className={`flex-1 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.15em] transition-colors ${
              accountType === "B2C" ? "bg-[var(--color-gray-900)] text-white" : "text-[var(--color-gray-500)] hover:text-[var(--color-gray-900)]"
            }`}
          >
            {t("auth.signup.personal")}
          </button>
          <button
            type="button"
            onClick={() => setAccountType("B2B")}
            className={`flex-1 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.15em] transition-colors ${
              accountType === "B2B" ? "bg-[var(--color-gray-900)] text-white" : "text-[var(--color-gray-500)] hover:text-[var(--color-gray-900)]"
            }`}
          >
            {t("auth.signup.business")}
          </button>
        </div>

        {accountType === "B2B" && (
          <p className="mt-3 rounded-xl bg-amber-50 px-4 py-3 text-xs text-amber-700">
            {t("auth.signup.b2bNote")}
          </p>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="name" className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--color-gray-500)]">
              {t("auth.signup.name")}
            </label>
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[var(--color-gray-300)] px-4 py-3 text-sm outline-none focus:border-[var(--color-gray-500)]"
            />
          </div>

          <div>
            <label htmlFor="signup-email" className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--color-gray-500)]">
              {t("auth.signup.email")}
            </label>
            <input
              id="signup-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[var(--color-gray-300)] px-4 py-3 text-sm outline-none focus:border-[var(--color-gray-500)]"
              placeholder="you@example.com"
            />
          </div>

          {accountType === "B2B" && (
            <>
              <div>
                <label htmlFor="companyName" className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--color-gray-500)]">
                  {t("auth.signup.companyName")}
                </label>
                <input
                  id="companyName"
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[var(--color-gray-300)] px-4 py-3 text-sm outline-none focus:border-[var(--color-gray-500)]"
                />
              </div>
              <div>
                <label htmlFor="companyRole" className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--color-gray-500)]">
                  {t("auth.signup.companyRole")}
                </label>
                <input
                  id="companyRole"
                  type="text"
                  value={companyRole}
                  onChange={(e) => setCompanyRole(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[var(--color-gray-300)] px-4 py-3 text-sm outline-none focus:border-[var(--color-gray-500)]"
                  placeholder={t("auth.signup.companyRolePlaceholder")}
                />
              </div>
            </>
          )}

          <div>
            <label htmlFor="signup-password" className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--color-gray-500)]">
              {t("auth.signup.password")}
            </label>
            <input
              id="signup-password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[var(--color-gray-300)] px-4 py-3 text-sm outline-none focus:border-[var(--color-gray-500)]"
            />
          </div>

          <div>
            <label htmlFor="confirm-password" className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--color-gray-500)]">
              {t("auth.signup.confirmPassword")}
            </label>
            <input
              id="confirm-password"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[var(--color-gray-300)] px-4 py-3 text-sm outline-none focus:border-[var(--color-gray-500)]"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-[var(--color-gray-900)] px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:bg-[var(--color-gray-400)]"
          >
            {loading ? t("auth.signup.creating") : t("auth.signup.submit")}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[var(--color-gray-500)]">
          {t("auth.signup.hasAccount")}{" "}
          <Link href="/login" className="font-semibold text-[var(--color-gray-900)] hover:underline">
            {t("auth.signup.signIn")}
          </Link>
        </p>
      </div>
    </main>
  );
}
