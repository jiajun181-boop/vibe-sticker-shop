import { Suspense } from "react";
import { getOrderPageImages } from "@/lib/order-page-images";
import MarketingPrintOrderClient from "@/app/order/marketing-print/MarketingPrintOrderClient";

export function generateMetadata() {
  return {
    title: "Custom Self-Inking Stamps — Order Online | Vibe Sticker Shop",
    description:
      "Order custom self-inking stamps online. Rectangular and round models with built-in ink pad and custom artwork.",
    openGraph: {
      title: "Custom Self-Inking Stamps — Order Online",
      description:
        "Configure and order custom stamps. Choose model, ink color, and upload your design.",
      url: "/order/stamps",
    },
  };
}

export default async function StampOrderPage() {
  const productImages = await getOrderPageImages(["stamps","stamps-self-inking"]);

  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
        </div>
      }
    >
      <MarketingPrintOrderClient defaultType="stamps" hideTypeSelector productImages={productImages} />
    </Suspense>
  );
}
