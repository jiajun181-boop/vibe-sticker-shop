"use client";

import { useParams } from "next/navigation";
import DesignEditor from "@/components/editor/DesignEditor";

export default function DesignPage() {
  const { product } = useParams();

  const productLabel = (product || "business-cards")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Design Your {productLabel}</h1>
        <p className="mt-1 text-sm text-gray-500">
          Choose a template, customize text and colors, then export a print-ready file.
        </p>
      </div>

      <DesignEditor product={product || "business-cards"} />
    </div>
  );
}
