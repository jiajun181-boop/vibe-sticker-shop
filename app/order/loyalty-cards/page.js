import { Suspense } from "react";
import { getOrderPageImages } from "@/lib/order-page-images";
import MarketingPrintOrderClient from "@/app/order/marketing-print/MarketingPrintOrderClient";

export function generateMetadata() {
  return {
    title: "Custom Loyalty Cards — Order Online | La Lunar Printing",
    description:
      "Order custom printed loyalty and rewards cards with punch options.",
    openGraph: {
      title: "Custom Loyalty Cards — Order Online",
      description:
        "Configure and order custom loyalty cards. Choose paper, coating, punch style, and quantity.",
      url: "/order/loyalty-cards",
    },
  };
}

export default async function LoyaltyCardOrderPage() {
  const productImages = await getOrderPageImages(["loyalty-cards","loyalty-cards-standard"]);

  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
        </div>
      }
    >
      <MarketingPrintOrderClient defaultType="loyalty-cards" hideTypeSelector productImages={productImages} />
    </Suspense>
  );
}
