import { Suspense } from "react";
import { getOrderPageImages } from "@/lib/order-page-images";
import MarketingPrintOrderClient from "@/app/order/marketing-print/MarketingPrintOrderClient";

export function generateMetadata() {
  return {
    title: "Tabletop Displays — Order Online | Vibe Sticker Shop",
    description:
      "Order custom tabletop displays for trade shows, retail counters, and events.",
    openGraph: {
      title: "Tabletop Displays — Order Online",
      url: "/order/tabletop-displays",
    },
  };
}

export default async function TabletopDisplayOrderPage() {
  const productImages = await getOrderPageImages(["tabletop-displays","tabletop-displays-standard"]);

  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
        </div>
      }
    >
      <MarketingPrintOrderClient defaultType="tabletop-displays" hideTypeSelector productImages={productImages} />
    </Suspense>
  );
}
