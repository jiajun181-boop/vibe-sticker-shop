import { Suspense } from "react";
import { getOrderPageImages } from "@/lib/order-page-images";
import MarketingPrintOrderClient from "@/app/order/marketing-print/MarketingPrintOrderClient";

export function generateMetadata() {
  return {
    title: "Custom Tags & Labels — Order Online | La Lunar Printing",
    description:
      "Order custom hang tags, product labels, and packaging tags. Multiple shapes, materials, and finishing options.",
    openGraph: {
      title: "Custom Tags & Labels — Order Online",
      description:
        "Configure and order custom tags and labels. Choose type, shape, material, size, and quantity.",
      url: "/order/tags",
    },
  };
}

export default async function TagOrderPage() {
  const productImages = await getOrderPageImages(["tags","tags-hang","tags-product"]);

  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
        </div>
      }
    >
      <MarketingPrintOrderClient defaultType="tags" hideTypeSelector productImages={productImages} />
    </Suspense>
  );
}
