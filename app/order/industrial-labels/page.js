import { Suspense } from "react";
import { getOrderPageImages } from "@/lib/order-page-images";
import IndustrialLabelOrderClient from "./IndustrialLabelOrderClient";

export function generateMetadata() {
  return {
    title: "Industrial & Asset Labels — Order Online | La Lunar Printing",
    description: "Order custom industrial labels — asset tags, pipe markers, warehouse labels, and cable labels.",
    openGraph: { title: "Industrial & Asset Labels — Order Online", description: "Configure and order custom industrial labels. Choose type, material, size, and quantity.", url: "/order/industrial-labels" },
  };
}

export default async function IndustrialLabelOrderPage() {
  const productImages = await getOrderPageImages(["industrial-labels","safety-labels-industrial"]);

  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
        </div>
      }
    >
      <IndustrialLabelOrderClient productImages={productImages} />
    </Suspense>
  );
}
