import { Suspense } from "react";
import { getOrderPageImages } from "@/lib/order-page-images";
import FlagOrderClient from "./FlagOrderClient";

export function generateMetadata() {
  return {
    title: "Custom Flags & Feather Banners — Order Online | Vibe Sticker Shop",
    description: "Order custom feather flags, teardrop flags, and rectangular flags.",
    openGraph: { title: "Custom Flags — Order Online", url: "/order/flags" },
  };
}

export default async function FlagOrderPage() {
  const productImages = await getOrderPageImages(["flags","feather-flags","teardrop-flags"]);

  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
        </div>
      }
    >
      <FlagOrderClient productImages={productImages} />
    </Suspense>
  );
}
