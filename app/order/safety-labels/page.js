import { Suspense } from "react";
import { getOrderPageImages } from "@/lib/order-page-images";
import SafetyLabelOrderClient from "./SafetyLabelOrderClient";

export function generateMetadata() {
  return {
    title: "Safety & Compliance Labels — Order Online | La Lunar Printing",
    description: "Order custom safety labels — fire, hazard, PPE, electrical, and chemical warning labels.",
    openGraph: { title: "Safety & Compliance Labels — Order Online", description: "Configure and order custom safety labels. Choose category, material, size, and quantity.", url: "/order/safety-labels" },
  };
}

export default async function SafetyLabelOrderPage() {
  const productImages = await getOrderPageImages(["safety-labels","safety-label"]);

  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
        </div>
      }
    >
      <SafetyLabelOrderClient productImages={productImages} />
    </Suspense>
  );
}
