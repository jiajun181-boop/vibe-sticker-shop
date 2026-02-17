import { Suspense } from "react";
import StickerOrderClient from "./StickerOrderClient";

export function generateMetadata() {
  return {
    title: "Custom Stickers — Order Online | Vibe Sticker Shop",
    description:
      "Order custom die-cut, kiss-cut, sheet, roll, vinyl lettering and decal stickers online. Choose your size, material, and quantity — get instant pricing.",
    openGraph: {
      title: "Custom Stickers — Order Online",
      description:
        "Configure and order custom stickers in one step. Die-cut, kiss-cut, sheets, rolls, vinyl lettering, and decals.",
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
