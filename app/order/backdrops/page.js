import { Suspense } from "react";
import { getOrderPageImages } from "@/lib/order-page-images";
import BackdropOrderClient from "./BackdropOrderClient";

export function generateMetadata() {
  return {
    title: "Custom Backdrops & Pop-Ups — Order Online | Vibe Sticker Shop",
    description: "Order custom backdrops and pop-up displays for events, photos, and trade shows.",
    openGraph: { title: "Custom Backdrops — Order Online", url: "/order/backdrops" },
  };
}

export default async function BackdropOrderPage() {
  const productImages = await getOrderPageImages(["backdrops","backdrop"]);

  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
        </div>
      }
    >
      <BackdropOrderClient productImages={productImages} />
    </Suspense>
  );
}
