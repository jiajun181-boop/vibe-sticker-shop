import { Suspense } from "react";
import { getOrderPageImages } from "@/lib/order-page-images";
import MarketingPrintOrderClient from "@/app/order/marketing-print/MarketingPrintOrderClient";

export function generateMetadata() {
  return {
    title: "Custom Calendars — Order Online | Vibe Sticker Shop",
    description:
      "Order custom desk calendars and wall calendars online. Wire-O binding, premium paper, full color printing.",
    openGraph: {
      title: "Custom Calendars — Order Online",
      description:
        "Configure and order custom calendars. Choose type, size, paper stock, and quantity.",
      url: "/order/calendars",
    },
  };
}

export default async function CalendarOrderPage() {
  const productImages = await getOrderPageImages(["calendars","calendars-wall","calendars-desk"]);

  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
        </div>
      }
    >
      <MarketingPrintOrderClient defaultType="calendars" hideTypeSelector productImages={productImages} />
    </Suspense>
  );
}
