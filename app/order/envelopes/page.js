import { Suspense } from "react";
import { getOrderPageImages } from "@/lib/order-page-images";
import MarketingPrintOrderClient from "@/app/order/marketing-print/MarketingPrintOrderClient";

export function generateMetadata() {
  return {
    title: "Custom Envelopes — Order Online | Vibe Sticker Shop",
    description:
      "Order custom printed envelopes online. Business, invitation, and catalog sizes with window and full-color printing options.",
    openGraph: {
      title: "Custom Envelopes — Order Online",
      description:
        "Configure and order custom envelopes. Choose size, paper, window style, printing, and quantity.",
      url: "/order/envelopes",
    },
  };
}

export default async function EnvelopeOrderPage() {
  const productImages = await getOrderPageImages(["envelopes","envelopes-standard"]);

  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
        </div>
      }
    >
      <MarketingPrintOrderClient defaultType="envelopes" hideTypeSelector productImages={productImages} />
    </Suspense>
  );
}
