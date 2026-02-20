import { Suspense } from "react";
import { getOrderPageImages } from "@/lib/order-page-images";
import PvcSignOrderClient from "./PvcSignOrderClient";

export function generateMetadata() {
  return {
    title: "Custom PVC Signs — Order Online | La Lunar Printing",
    description: "Order custom PVC (Sintra) signs for indoor and outdoor signage.",
    openGraph: { title: "Custom PVC Signs — Order Online", description: "Configure and order custom PVC signs. Choose thickness, size, and print options.", url: "/order/pvc-signs" },
  };
}

export default async function PvcSignOrderPage() {
  const productImages = await getOrderPageImages(["pvc-signs","pvc-sign"]);

  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
        </div>
      }
    >
      <PvcSignOrderClient productImages={productImages} />
    </Suspense>
  );
}
