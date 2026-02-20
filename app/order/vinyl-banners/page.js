import { Suspense } from "react";
import { getOrderPageImages } from "@/lib/order-page-images";
import VinylBannerOrderClient from "./VinylBannerOrderClient";

export function generateMetadata() {
  return {
    title: "Custom Vinyl Banners — Order Online | Vibe Sticker Shop",
    description: "Order custom vinyl banners for events, business, and outdoor advertising.",
    openGraph: { title: "Custom Vinyl Banners — Order Online", url: "/order/vinyl-banners" },
  };
}

export default async function VinylBannerOrderPage() {
  const productImages = await getOrderPageImages(["vinyl-banners","vinyl-banner"]);

  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
        </div>
      }
    >
      <VinylBannerOrderClient productImages={productImages} />
    </Suspense>
  );
}
