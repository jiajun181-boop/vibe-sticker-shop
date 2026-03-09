"use client";

export default async function saveProofData({ productSlug, uploadedFile, contourData }) {
  if (!productSlug || !contourData) return null;

  try {
    const res = await fetch("/api/proof", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productSlug,
        originalFileUrl: uploadedFile?.url || null,
        originalFileKey: uploadedFile?.key || null,
        processedImageUrl: contourData.processedImageUrl || null,
        contourSvg: contourData.contourSvg || null,
        bleedSvg: contourData.bleedSvg || null,
        bleedMm: contourData.bleedMm || null,
        bgRemoved: contourData.bgRemoved || false,
        customerConfirmed: true,
      }),
    });

    const data = await res.json().catch(() => null);
    return data?.id || null;
  } catch {
    return null;
  }
}
