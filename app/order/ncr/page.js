import { Suspense } from "react";
import { getOrderPageImages } from "@/lib/order-page-images";
import NcrOrderClient from "./NcrOrderClient";

export function generateMetadata() {
  return {
    title: "NCR Forms — Order Online | La Lunar Printing",
    description:
      "Order custom NCR carbonless forms online. Duplicate, triplicate, invoices, and receipt books with optional sequential numbering.",
    openGraph: {
      title: "NCR Forms — Order Online",
      description:
        "Configure and order custom NCR carbonless forms. Duplicate & triplicate with sequential numbering.",
      url: "/order/ncr",
    },
  };
}

export default async function NcrOrderPage() {
  const productImages = await getOrderPageImages(["ncr","ncr-invoices","ncr-invoice-books"]);

  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
        </div>
      }
    >
      <NcrOrderClient productImages={productImages} />
    </Suspense>
  );
}
