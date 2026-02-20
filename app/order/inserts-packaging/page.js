import { Suspense } from "react";
import { getOrderPageImages } from "@/lib/order-page-images";
import MarketingPrintOrderClient from "@/app/order/marketing-print/MarketingPrintOrderClient";

export function generateMetadata() {
  return {
    title: "Packaging Inserts & Seals — Order Online | Vibe Sticker Shop",
    description:
      "Order custom packaging inserts, thank-you cards, and branded seals.",
    openGraph: {
      title: "Packaging Inserts & Seals — Order Online",
      description:
        "Configure and order custom packaging inserts and seals. Choose type, size, paper, and quantity.",
      url: "/order/inserts-packaging",
    },
  };
}

export default async function PackagingInsertOrderPage() {
  const productImages = await getOrderPageImages(["inserts-packaging","inserts-standard"]);

  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
        </div>
      }
    >
      <MarketingPrintOrderClient defaultType="inserts-packaging" hideTypeSelector productImages={productImages} />
    </Suspense>
  );
}
