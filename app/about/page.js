import Link from "next/link";
import { getServerT } from "@/lib/i18n/server";

export default async function AboutPage() {
  const t = await getServerT();
  const advantages = [
    t("about.advantage1"),
    t("about.advantage2"),
    t("about.advantage3"),
    t("about.advantage4"),
  ];

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-14 text-gray-900">
      <div className="mx-auto max-w-5xl space-y-10">
        <header className="rounded-3xl border border-gray-200 bg-white p-8">
          <p className="text-xs uppercase tracking-[0.25em] text-gray-500">{t("about.badge")}</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">{t("about.title")}</h1>
          <p className="mt-4 text-sm text-gray-600">{t("about.body")}</p>
        </header>

        <section className="grid gap-4 sm:grid-cols-2">
          {advantages.map((item) => (
            <article key={item} className="rounded-2xl border border-gray-200 bg-white p-5">
              <h2 className="text-lg font-semibold">{item}</h2>
              <p className="mt-2 text-sm text-gray-600">{t("about.advantageBody")}</p>
            </article>
          ))}
        </section>

        <section className="rounded-3xl border border-gray-200 bg-white p-8">
          <h2 className="text-2xl font-semibold">{t("about.qualityTitle")}</h2>
          <p className="mt-3 text-sm text-gray-600">{t("about.qualityBody")}</p>
        </section>

        <section className="rounded-3xl border border-gray-200 bg-gray-900 p-8 text-white">
          <h2 className="text-2xl font-semibold">{t("about.ctaTitle")}</h2>
          <p className="mt-3 text-sm text-gray-200">{t("about.ctaBody")}</p>
          <Link
            href="/shop"
            className="mt-5 inline-block rounded-full bg-white px-5 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-gray-900"
          >
            {t("about.ctaButton")}
          </Link>
        </section>
      </div>
    </main>
  );
}

