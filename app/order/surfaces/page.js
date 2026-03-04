import { Suspense } from "react";
import { getOrderPageImages } from "@/lib/order-page-images";
import SurfaceOrderClient from "./SurfaceOrderClient";

export function generateMetadata() {
  return {
    title: "Custom Surface Graphics — Order Online",
    description:
      "Order custom surface graphics online. Window films, wall graphics, floor graphics, and more for any commercial or retail space.",
    openGraph: {
      title: "Custom Surface Graphics — Order Online",
      description:
        "Configure and order custom surface graphics. Choose application type, material, and size.",
      url: "/order/surfaces",
    },
    alternates: { canonical: "https://www.lunarprint.ca/order/surfaces" },
  };
}

export default async function SurfaceOrderPage() {
  const productImages = await getOrderPageImages(["surfaces", "window-film", "wall-graphics"]);

  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
        </div>
      }
    >
      <SurfaceOrderClient productImages={productImages} />
    </Suspense>
  );
}
