// lib/design-studio/export-pipeline.js — PNG + PDF export pipeline
import { PDFDocument } from "pdf-lib";
import { getCanvasDimensions } from "./product-configs";

/**
 * Export Fabric.js canvas to PNG blob (full resolution).
 * Hides guides during export, then restores them.
 */
export async function exportCanvasToPng(fabricCanvas, spec) {
  // Hide guides temporarily
  const guides = fabricCanvas
    .getObjects()
    .filter((obj) => obj.id && obj.id.startsWith("__guide_"));

  const guideVisibility = guides.map((g) => g.visible);
  guides.forEach((g) => {
    g.visible = false;
  });
  fabricCanvas.requestRenderAll();

  // Export at full resolution
  const dataUrl = fabricCanvas.toDataURL({
    format: "png",
    quality: 1,
    multiplier: 1, // Canvas is already at full DPI
  });

  // Restore guides
  guides.forEach((g, i) => {
    g.visible = guideVisibility[i];
  });
  fabricCanvas.requestRenderAll();

  // Convert data URL to blob
  const response = await fetch(dataUrl);
  return response.blob();
}

/**
 * Export PNG blob to a PDF with proper dimensions and crop marks.
 */
export async function exportCanvasToPdf(pngBlob, spec) {
  const dims = getCanvasDimensions(spec);
  const pdfDoc = await PDFDocument.create();

  // PDF dimensions in points (72 points per inch)
  // Include bleed in the page size
  const totalWidthPt = (spec.widthIn + spec.bleedIn * 2) * 72;
  const totalHeightPt = (spec.heightIn + spec.bleedIn * 2) * 72;

  const page = pdfDoc.addPage([totalWidthPt, totalHeightPt]);

  // Embed the PNG
  const pngBytes = await pngBlob.arrayBuffer();
  const pngImage = await pdfDoc.embedPng(pngBytes);

  // Draw the image to fill the entire page
  page.drawImage(pngImage, {
    x: 0,
    y: 0,
    width: totalWidthPt,
    height: totalHeightPt,
  });

  // Draw crop marks
  const bleedPt = spec.bleedIn * 72;
  const markLen = 18; // 0.25 inch crop marks
  const markOffset = 4; // gap from trim edge

  const trimLeft = bleedPt;
  const trimRight = totalWidthPt - bleedPt;
  const trimTop = totalHeightPt - bleedPt; // PDF Y is bottom-up
  const trimBottom = bleedPt;

  const markColor = { type: "RGB", red: 0, green: 0, blue: 0 };
  const markThickness = 0.5;

  // Top-left corner
  page.drawLine({
    start: { x: trimLeft, y: trimTop + markOffset },
    end: { x: trimLeft, y: trimTop + markOffset + markLen },
    thickness: markThickness,
    color: markColor,
  });
  page.drawLine({
    start: { x: trimLeft - markOffset, y: trimTop },
    end: { x: trimLeft - markOffset - markLen, y: trimTop },
    thickness: markThickness,
    color: markColor,
  });

  // Top-right corner
  page.drawLine({
    start: { x: trimRight, y: trimTop + markOffset },
    end: { x: trimRight, y: trimTop + markOffset + markLen },
    thickness: markThickness,
    color: markColor,
  });
  page.drawLine({
    start: { x: trimRight + markOffset, y: trimTop },
    end: { x: trimRight + markOffset + markLen, y: trimTop },
    thickness: markThickness,
    color: markColor,
  });

  // Bottom-left corner
  page.drawLine({
    start: { x: trimLeft, y: trimBottom - markOffset },
    end: { x: trimLeft, y: trimBottom - markOffset - markLen },
    thickness: markThickness,
    color: markColor,
  });
  page.drawLine({
    start: { x: trimLeft - markOffset, y: trimBottom },
    end: { x: trimLeft - markOffset - markLen, y: trimBottom },
    thickness: markThickness,
    color: markColor,
  });

  // Bottom-right corner
  page.drawLine({
    start: { x: trimRight, y: trimBottom - markOffset },
    end: { x: trimRight, y: trimBottom - markOffset - markLen },
    thickness: markThickness,
    color: markColor,
  });
  page.drawLine({
    start: { x: trimRight + markOffset, y: trimBottom },
    end: { x: trimRight + markOffset + markLen, y: trimBottom },
    thickness: markThickness,
    color: markColor,
  });

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes], { type: "application/pdf" });
}

/**
 * Full export pipeline for approval: generates both PNG and PDF.
 */
export async function exportForApproval(fabricCanvas, spec) {
  const pngBlob = await exportCanvasToPng(fabricCanvas, spec);
  const pdfBlob = await exportCanvasToPdf(pngBlob, spec);
  return { pngBlob, pdfBlob };
}
