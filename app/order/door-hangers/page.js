import { Suspense } from "react";
import { getOrderPageImages } from "@/lib/order-page-images";
import MarketingPrintOrderClient from "@/app/order/marketing-print/MarketingPrintOrderClient";

export function generateMetadata() {
  return {
    title: "Custom Door Hangers — Order Online | Vibe Sticker Shop",
    description:
      "Order custom door hangers with optional tear-off perforation. Premium card stock, full color printing.",
    openGraph: {
      title: "Custom Door Hangers — Order Online",
      description:
        "Configure and order custom door hangers. Choose size, paper, coating, and perforation options.",
      url: "/order/door-hangers",
    },
  };
}

export default async function DoorHangerOrderPage() {
  const productImages = await getOrderPageImages(["door-hangers","door-hangers-standard"]);

  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
        </div>
      }
    >
      <MarketingPrintOrderClient defaultType="door-hangers" hideTypeSelector productImages={productImages} />
    </Suspense>
  );
}
