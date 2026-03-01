import { Suspense } from "react";
import { getOrderPageImages } from "@/lib/order-page-images";
import CanvasOrderClient from "./CanvasOrderClient";

export function generateMetadata() {
  return {
    title: "Custom Canvas Prints — Order Online",
    description:
      "Order custom canvas prints online. Gallery wraps, framed canvases, split panels, and panoramic prints on premium cotton-poly blend canvas.",
    openGraph: {
      title: "Custom Canvas Prints — Order Online",
      description:
        "Configure and order custom canvas prints. Choose style, size, edge treatment, and framing options.",
      url: "/order/canvas",
    },
    alternates: { canonical: "https://www.lunarprint.ca/order/canvas" },
  };
}

export default async function CanvasOrderPage() {
  const productImages = await getOrderPageImages(["canvas-prints", "canvas", "canvas-standard"]);

  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
        </div>
      }
    >
      <CanvasOrderClient productImages={productImages} />
    </Suspense>
  );
}
