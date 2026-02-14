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
    <main className="min-h-screen bg-gray-50 px-6 py-14 text-gray-900">
      <div className="mx-auto max-w-lg">
        <header className="text-center mb-8">
          <p className="text-xs uppercase tracking-[0.25em] text-gray-500">Support</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">Track Your Order</h1>
          <p className="mt-3 text-sm text-gray-600">
            Enter your order reference number and the email you used at checkout.
          </p>
        </header>
        <TrackOrderClient />
      </div>
    </main>
  );
}
