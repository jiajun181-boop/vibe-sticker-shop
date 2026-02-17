import { getServerT } from "@/lib/i18n/server";
import TrackOrderClient from "./TrackOrderClient";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://lunarprint.ca";

export async function generateMetadata() {
  return {
    title: "Track Your Order | La Lunar Printing Inc.",
    description: "Check the status of your order. Enter your order reference number and email to get real-time updates.",
    alternates: { canonical: `${SITE_URL}/track-order` },
  };
}

export default async function TrackOrderPage() {
  const t = await getServerT();
  return (
    <main className="min-h-screen bg-[var(--color-gray-50)] px-6 py-14 text-[var(--color-gray-900)]">
      <div className="mx-auto max-w-lg">
        <header className="text-center mb-8">
          <p className="text-xs uppercase tracking-[0.25em] text-[var(--color-gray-500)]">{t("track.badge")}</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">{t("track.title")}</h1>
          <p className="mt-3 text-sm text-[var(--color-gray-600)]">
            {t("track.subtitle")}
          </p>
        </header>
        <TrackOrderClient />
      </div>
    </main>
  );
}
