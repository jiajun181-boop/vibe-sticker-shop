// lib/editor/render.js — Client-side canvas rendering for the design editor

/**
 * Render editor elements to a canvas at the specified DPI.
 *
 * @param {HTMLCanvasElement} canvas
 * @param {object} template — { canvas: { width, height, background }, elements: [...] }
 * @param {number} scale — scale factor (1 for screen, 1x for 300 DPI export)
 */
export function renderToCanvas(canvas, template, scale = 1) {
  const ctx = canvas.getContext("2d");
  const { width, height, background } = template.canvas;

  canvas.width = width * scale;
  canvas.height = height * scale;
  ctx.scale(scale, scale);

  // Background
  if (background?.startsWith("linear-gradient")) {
    // Parse simple linear gradient
    const match = background.match(/(\d+)deg/);
    const angle = match ? parseInt(match[1]) : 0;
    const colors = [...background.matchAll(/(#[a-fA-F0-9]{6}|rgba?\([^)]+\))/g)].map((m) => m[0]);
    const rad = (angle * Math.PI) / 180;
    const gradient = ctx.createLinearGradient(
      width / 2 - Math.cos(rad) * width / 2,
      height / 2 - Math.sin(rad) * height / 2,
      width / 2 + Math.cos(rad) * width / 2,
      height / 2 + Math.sin(rad) * height / 2
    );
    colors.forEach((c, i) => gradient.addColorStop(i / Math.max(1, colors.length - 1), c));
    ctx.fillStyle = gradient;
  } else {
    ctx.fillStyle = background || "#ffffff";
  }
  ctx.fillRect(0, 0, width, height);

  // Elements
  for (const el of template.elements || []) {
    switch (el.type) {
      case "text":
        ctx.save();
        ctx.font = `${el.fontWeight || "normal"} ${el.fontSize || 16}px ${el.fontFamily || "sans-serif"}`;
        ctx.fillStyle = el.fill || "#000000";
        ctx.textAlign = el.textAlign || "left";
        ctx.textBaseline = "top";
        if (el.letterSpacing) {
          // Canvas doesn't natively support letterSpacing in older browsers
          ctx.letterSpacing = `${el.letterSpacing}px`;
        }
        ctx.fillText(el.text || "", el.x || 0, el.y || 0);
        ctx.restore();
        break;

      case "rect":
        ctx.save();
        ctx.fillStyle = el.fill || "#000000";
        ctx.fillRect(el.x || 0, el.y || 0, el.width || 100, el.height || 100);
        ctx.restore();
        break;

      case "line":
        ctx.save();
        ctx.strokeStyle = el.stroke || "#000000";
        ctx.lineWidth = el.strokeWidth || 1;
        ctx.beginPath();
        ctx.moveTo(el.x1 || 0, el.y1 || 0);
        ctx.lineTo(el.x2 || 100, el.y2 || 0);
        ctx.stroke();
        ctx.restore();
        break;

      case "image":
        // Images need to be pre-loaded
        if (el._img) {
          ctx.drawImage(el._img, el.x || 0, el.y || 0, el.width || 100, el.height || 100);
        }
        break;
    }
  }
}

/**
 * Export canvas as high-res PNG blob (300 DPI).
 */
export function exportHighRes(template) {
  const canvas = document.createElement("canvas");
  renderToCanvas(canvas, template, 1); // Already at 300 DPI if canvas size is set for 300 DPI
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/png", 1.0);
  });
}
