import { Suspense } from "react";
import { getOrderPageImages } from "@/lib/order-page-images";
import MarketingPrintOrderClient from "@/app/order/marketing-print/MarketingPrintOrderClient";

export function generateMetadata() {
  return {
    title: "Custom Flyers — Order Online | Vibe Sticker Shop",
    description:
      "Order custom flyers online. Small, standard, and tabloid sizes on premium paper stocks with optional coating and double-sided printing.",
    openGraph: {
      title: "Custom Flyers — Order Online",
      description:
        "Configure and order custom flyers. Choose size, paper stock, sides, coating, and quantity.",
      url: "/order/flyers",
    },
  };
}

export default async function FlyerOrderPage() {
  const productImages = await getOrderPageImages(["flyers","flyers-standard"]);

  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
        </div>
      }
    >
      <MarketingPrintOrderClient defaultType="flyers" hideTypeSelector productImages={productImages} />
    </Suspense>
  );
}
