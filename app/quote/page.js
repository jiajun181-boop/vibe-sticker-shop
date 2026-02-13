import { getServerT } from "@/lib/i18n/server";
import QuoteFormClient from "./QuoteFormClient";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://vibestickers.com";

export async function generateMetadata() {
  return {
    title: "Request a Quote | La Lunar Printing Inc.",
    description: "Get a custom quote for your printing project. Vehicle graphics, fleet compliance, signage, stickers, and more.",
    alternates: { canonical: `${SITE_URL}/quote` },
  };
}

export default async function QuotePage({ searchParams }) {
  const t = await getServerT();
  const sku = (await searchParams)?.sku || "";

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-14 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8 text-center">
          <p className="text-xs uppercase tracking-[0.25em] text-gray-500">{t("contact.badge")}</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            {t("quote.pageTitle")}
          </h1>
          <p className="mt-3 text-sm text-gray-500">{t("quote.pageSubtitle")}</p>
        </header>

        <QuoteFormClient preselectedProduct={sku} />
      </div>
    </main>
  );
}
