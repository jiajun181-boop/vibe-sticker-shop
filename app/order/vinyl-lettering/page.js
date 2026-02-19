import { Suspense } from "react";
import VinylLetteringOrderClient from "./VinylLetteringOrderClient";

export function generateMetadata() {
  return {
    title: "Vinyl Lettering — Order Online | Vibe Sticker Shop",
    description: "Order custom vinyl lettering for storefronts, vehicles, and walls.",
    openGraph: { title: "Vinyl Lettering — Order Online", description: "Configure and order custom vinyl lettering. Choose font style, size, color, and quantity.", url: "/order/vinyl-lettering" },
  };
}

export default function VinylLetteringOrderPage() {
  return (<Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" /></div>}><VinylLetteringOrderClient /></Suspense>);
}
