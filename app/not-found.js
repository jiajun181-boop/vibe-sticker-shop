import Link from "next/link";
import { getServerT } from "@/lib/i18n/server";

export default async function NotFound() {
  const t = await getServerT();
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[var(--color-gray-50)] px-6 text-center text-[var(--color-gray-900)]">
      <div className="max-w-md">
        <p className="text-8xl font-black text-[var(--color-gray-200)]">404</p>
        <h1 className="mt-4 text-2xl font-semibold">{t("error.404.title")}</h1>
        <p className="mt-3 text-sm text-[var(--color-gray-600)]">{t("error.404.message")}</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/shop"
            className="rounded-xl bg-[var(--color-gray-900)] px-6 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-white transition-colors hover:bg-black"
          >
            {t("error.404.browseProducts")}
          </Link>
          <Link
            href="/"
            className="rounded-xl border border-[var(--color-gray-300)] px-6 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-gray-700)] transition-colors hover:bg-[var(--color-gray-50)]"
          >
            {t("error.404.goHome")}
          </Link>
        </div>
      </div>
    </main>
  );
}
