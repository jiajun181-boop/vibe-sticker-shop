import { Suspense } from "react";
import StickerRollOrderClient from "./StickerRollOrderClient";

export function generateMetadata() {
  return {
    title: "Custom Sticker Rolls — BOPP, Kraft, Foil | Order Online",
    description:
      "Order custom sticker rolls online. Circle, square, rectangle, and oval shapes. BOPP, kraft, and silver foil materials with gloss or matte finish.",
    openGraph: {
      title: "Custom Sticker Rolls — Order Online",
      description:
        "Configure and order custom sticker rolls. Multiple shapes, sizes, materials, and wind direction options.",
      url: "/order/sticker-rolls",
    },
    alternates: { canonical: "https://www.lunarprint.ca/order/sticker-rolls" },
  };
}

export default function StickerRollOrderPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
        </div>
      }
    >
      <StickerRollOrderClient />
    </Suspense>
  );
}
