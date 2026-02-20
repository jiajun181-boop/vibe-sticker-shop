import { Suspense } from "react";
import { getOrderPageImages } from "@/lib/order-page-images";
import AFrameSignOrderClient from "./AFrameSignOrderClient";

export function generateMetadata() {
  return {
    title: "Custom A-Frame Signs — Order Online | La Lunar Printing",
    description: "Order custom A-frame sandwich board signs for sidewalks and storefronts.",
    openGraph: { title: "Custom A-Frame Signs — Order Online", description: "Configure and order custom A-frame signs. Choose size, material, and print options.", url: "/order/a-frame-signs" },
  };
}

export default async function AFrameSignOrderPage() {
  const productImages = await getOrderPageImages(["a-frame-signs","a-frame-sign","a-frames-signs"]);

  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
        </div>
      }
    >
      <AFrameSignOrderClient productImages={productImages} />
    </Suspense>
  );
}
