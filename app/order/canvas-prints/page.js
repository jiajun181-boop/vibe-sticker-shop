import { Suspense } from "react";
import { getOrderPageImages } from "@/lib/order-page-images";
import CanvasPrintOrderClient from "./CanvasPrintOrderClient";

export function generateMetadata() {
  return {
    title: "Custom Canvas Prints — Order Online | Vibe Sticker Shop",
    description: "Order custom canvas prints for wall art, photography, and business displays.",
    openGraph: { title: "Custom Canvas Prints — Order Online", url: "/order/canvas-prints" },
  };
}

export default async function CanvasPrintOrderPage() {
  const productImages = await getOrderPageImages(["canvas-prints","classic-canvas-prints"]);

  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
        </div>
      }
    >
      <CanvasPrintOrderClient productImages={productImages} />
    </Suspense>
  );
}
