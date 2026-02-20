import { Suspense } from "react";
import { getOrderPageImages } from "@/lib/order-page-images";
import MarketingPrintOrderClient from "@/app/order/marketing-print/MarketingPrintOrderClient";

export function generateMetadata() {
  return {
    title: "Custom Shelf Displays — Order Online | La Lunar Printing",
    description:
      "Order custom printed shelf talkers, wobblers, and shelf strips.",
    openGraph: {
      title: "Custom Shelf Displays — Order Online",
      description:
        "Configure and order custom shelf displays. Choose style, size, coating, and quantity.",
      url: "/order/shelf-displays",
    },
  };
}

export default async function ShelfDisplayOrderPage() {
  const productImages = await getOrderPageImages(["shelf-displays","shelf-talkers"]);

  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
        </div>
      }
    >
      <MarketingPrintOrderClient defaultType="shelf-displays" hideTypeSelector productImages={productImages} />
    </Suspense>
  );
}
