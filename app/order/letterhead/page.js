import { Suspense } from "react";
import { getOrderPageImages } from "@/lib/order-page-images";
import MarketingPrintOrderClient from "@/app/order/marketing-print/MarketingPrintOrderClient";

export function generateMetadata() {
  return {
    title: "Custom Letterhead — Order Online | Vibe Sticker Shop",
    description:
      "Order custom letterhead on premium bond and offset papers. Professional business stationery with full color printing.",
    openGraph: {
      title: "Custom Letterhead — Order Online",
      description:
        "Configure and order custom letterhead. Choose paper stock, color mode, and quantity.",
      url: "/order/letterhead",
    },
  };
}

export default async function LetterheadOrderPage() {
  const productImages = await getOrderPageImages(["letterhead", "letterhead-standard", "letterheads"]);

  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
        </div>
      }
    >
      <MarketingPrintOrderClient
        defaultType="letterheads"
        hideTypeSelector
        productImages={productImages}
      />
    </Suspense>
  );
}
