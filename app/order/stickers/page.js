import { Suspense } from "react";
import StickerOrderClient from "./StickerOrderClient";

export function generateMetadata() {
  return {
    title: "Stickers & Labels - Build Your Order | La Lunar Printing",
    description:
      "Order die-cut, kiss-cut, sheet, and roll stickers and labels online. Choose size, material, and quantity with instant pricing.",
    openGraph: {
      title: "Stickers & Labels - Build Your Order",
      description:
        "Configure and order stickers and labels in one step: die-cut, kiss-cut, sheets, rolls, and vinyl lettering.",
      url: "/order/stickers",
    },
  };
}

export default function StickerOrderPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-gray-300)] border-t-[var(--color-gray-900)]" />
        </div>
      }
    >
      <StickerOrderClient />
    </Suspense>
  );
}
