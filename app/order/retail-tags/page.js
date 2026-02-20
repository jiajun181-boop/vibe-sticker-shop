import { Suspense } from "react";
import { getOrderPageImages } from "@/lib/order-page-images";
import MarketingPrintOrderClient from "@/app/order/marketing-print/MarketingPrintOrderClient";

export function generateMetadata() {
  return {
    title: "Custom Retail Tags — Order Online | La Lunar Printing",
    description:
      "Order custom printed retail hang tags for pricing, branding, and product labelling.",
    openGraph: {
      title: "Custom Retail Tags — Order Online",
      description:
        "Configure and order custom retail tags. Choose size, paper, hole, and quantity.",
      url: "/order/retail-tags",
    },
  };
}

export default async function RetailTagOrderPage() {
  const productImages = await getOrderPageImages(["retail-tags","retail-tags-standard"]);

  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
        </div>
      }
    >
      <MarketingPrintOrderClient defaultType="retail-tags" hideTypeSelector productImages={productImages} />
    </Suspense>
  );
}
