"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useAuthStore } from "@/lib/auth-store";

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-[70vh] items-center justify-center px-4 py-16">
          <div className="text-sm text-[var(--color-gray-500)]">Verifying...</div>
        </main>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const { t } = useTranslation();
  const fetchUser = useAuthStore((s) => s.fetchUser);

  const [status, setStatus] = useState("verifying"); // verifying | success | error

  useEffect(() => {
    if (!token) {
      setStatus("error");
      return;
    }

    fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then((res) => {
        if (res.ok) {
          setStatus("success");
          fetchUser(); // refresh user state
        } else {
          setStatus("error");
        }
      })
      .catch(() => setStatus("error"));
  }, [token, fetchUser]);

  return (
    <main className="flex min-h-[70vh] items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm text-center">
        <h1 className="text-lg font-semibold tracking-[0.25em] text-[var(--color-gray-900)]">
          {t("auth.verifyEmail.title")}
        </h1>

        {status === "verifying" && (
          <p className="mt-6 text-sm text-[var(--color-gray-500)]">{t("auth.verifyEmail.verifying")}</p>
        )}

        {status === "success" && (
          <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-6">
            <p className="text-sm text-emerald-700">{t("auth.verifyEmail.success")}</p>
            <Link href="/account" className="mt-4 inline-block text-sm font-semibold text-[var(--color-gray-900)] hover:underline">
              {t("account.nav.dashboard")}
            </Link>
          </div>
        )}

        {status === "error" && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-6">
            <p className="text-sm text-red-600">{t("auth.verifyEmail.error")}</p>
            <Link href="/account" className="mt-4 inline-block text-sm font-semibold text-[var(--color-gray-900)] hover:underline">
              {t("account.nav.dashboard")}
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
