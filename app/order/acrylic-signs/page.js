import { Suspense } from "react";
import { getOrderPageImages } from "@/lib/order-page-images";
import AcrylicSignOrderClient from "./AcrylicSignOrderClient";

export function generateMetadata() {
  return {
    title: "Custom Acrylic Signs — Order Online | Vibe Sticker Shop",
    description: "Order custom acrylic signs for professional business, office, and retail displays.",
    openGraph: { title: "Custom Acrylic Signs — Order Online", description: "Configure and order custom acrylic signs. Choose thickness, size, mounting, and print options.", url: "/order/acrylic-signs" },
  };
}

export default async function AcrylicSignOrderPage() {
  const productImages = await getOrderPageImages(["acrylic-signs","acrylic-sign"]);

  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
        </div>
      }
    >
      <AcrylicSignOrderClient productImages={productImages} />
    </Suspense>
  );
}
