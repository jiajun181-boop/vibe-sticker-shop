import { Suspense } from "react";
import { getOrderPageImages } from "@/lib/order-page-images";
import DecalOrderClient from "./DecalOrderClient";

export function generateMetadata() {
  return {
    title: "Custom Decals — Order Online | Vibe Sticker Shop",
    description:
      "Order custom adhesive decals for windows, walls, and floors. Indoor and outdoor options with clear, white, and perforated vinyl.",
    openGraph: {
      title: "Custom Decals — Order Online",
      description:
        "Configure and order custom decals. Choose application, vinyl type, size, and quantity.",
      url: "/order/decals",
    },
  };
}

export default async function DecalOrderPage() {
  const productImages = await getOrderPageImages(["decals","vehicle-decals"]);

  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
        </div>
      }
    >
      <DecalOrderClient productImages={productImages} />
    </Suspense>
  );
}
