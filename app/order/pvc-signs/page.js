import { Suspense } from "react";
import PvcSignOrderClient from "./PvcSignOrderClient";

export function generateMetadata() {
  return {
    title: "Custom PVC Signs — Order Online | Vibe Sticker Shop",
    description: "Order custom PVC (Sintra) signs for indoor and outdoor signage.",
    openGraph: { title: "Custom PVC Signs — Order Online", description: "Configure and order custom PVC signs. Choose thickness, size, and print options.", url: "/order/pvc-signs" },
  };
}

export default function PvcSignOrderPage() {
  return (<Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" /></div>}><PvcSignOrderClient /></Suspense>);
}
