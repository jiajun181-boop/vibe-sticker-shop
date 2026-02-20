import { Suspense } from "react";
import { getOrderPageImages } from "@/lib/order-page-images";
import MarketingPrintOrderClient from "@/app/order/marketing-print/MarketingPrintOrderClient";

export function generateMetadata() {
  return {
    title: "Custom Order Forms — Order Online | La Lunar Printing",
    description:
      "Order custom printed order forms with optional numbering and padding.",
    openGraph: {
      title: "Custom Order Forms — Order Online",
      description:
        "Configure and order custom order forms. Choose size, paper, numbering, and quantity.",
      url: "/order/order-forms",
    },
  };
}

export default async function OrderFormPage() {
  const productImages = await getOrderPageImages(["order-forms","order-forms-standard"]);

  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
        </div>
      }
    >
      <MarketingPrintOrderClient defaultType="order-forms" hideTypeSelector productImages={productImages} />
    </Suspense>
  );
}
