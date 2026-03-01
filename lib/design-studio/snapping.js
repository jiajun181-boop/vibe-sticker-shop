// lib/design-studio/snapping.js — Smart alignment guides for Fabric.js canvas
// Shows visual guide lines when objects align with canvas center, edges, or other objects.

import { Line } from "fabric";

const SNAP_THRESHOLD = 8; // pixels
const GUIDE_COLOR = "#ff00ff";
const GUIDE_DASH = [4, 4];

/**
 * Initialize snapping behavior on a Fabric.js canvas.
 * Call once after canvas creation. Returns cleanup function.
 */
export function initSnapping(canvas) {
  const guidelines = [];

  function clearGuidelines() {
    guidelines.forEach((line) => canvas.remove(line));
    guidelines.length = 0;
  }

  function addGuideline(x1, y1, x2, y2) {
    const line = new Line([x1, y1, x2, y2], {
      stroke: GUIDE_COLOR,
      strokeWidth: 1,
      strokeDashArray: GUIDE_DASH,
      selectable: false,
      evented: false,
      excludeFromExport: true,
      id: "__snap_guide",
    });
    canvas.add(line);
    canvas.bringObjectToFront(line);
    guidelines.push(line);
  }

  function onObjectMoving(e) {
    const obj = e.target;
    if (!obj) return;
    clearGuidelines();

    const objBounds = obj.getBoundingRect(true);
    const objCenter = {
      x: objBounds.left + objBounds.width / 2,
      y: objBounds.top + objBounds.height / 2,
    };
    const objEdges = {
      left: objBounds.left,
      right: objBounds.left + objBounds.width,
      top: objBounds.top,
      bottom: objBounds.top + objBounds.height,
    };

    const canvasW = canvas.width;
    const canvasH = canvas.height;
    const canvasCx = canvasW / 2;
    const canvasCy = canvasH / 2;

    let snapX = null;
    let snapY = null;

    // --- Snap to canvas center ---
    if (Math.abs(objCenter.x - canvasCx) < SNAP_THRESHOLD) {
      snapX = canvasCx - objBounds.width / 2;
      addGuideline(canvasCx, 0, canvasCx, canvasH);
    }
    if (Math.abs(objCenter.y - canvasCy) < SNAP_THRESHOLD) {
      snapY = canvasCy - objBounds.height / 2;
      addGuideline(0, canvasCy, canvasW, canvasCy);
    }

    // --- Snap to other objects ---
    const allObjects = canvas.getObjects().filter(
      (o) =>
        o !== obj &&
        !o.id?.startsWith("__guide_") &&
        !o.id?.startsWith("__snap_") &&
        o.visible !== false
    );

    for (const other of allObjects) {
      const otherBounds = other.getBoundingRect(true);
      const otherCenter = {
        x: otherBounds.left + otherBounds.width / 2,
        y: otherBounds.top + otherBounds.height / 2,
      };
      const otherEdges = {
        left: otherBounds.left,
        right: otherBounds.left + otherBounds.width,
        top: otherBounds.top,
        bottom: otherBounds.top + otherBounds.height,
      };

      // Horizontal alignment (center-to-center)
      if (snapX === null && Math.abs(objCenter.x - otherCenter.x) < SNAP_THRESHOLD) {
        snapX = otherCenter.x - objBounds.width / 2;
        addGuideline(otherCenter.x, Math.min(objEdges.top, otherEdges.top), otherCenter.x, Math.max(objEdges.bottom, otherEdges.bottom));
      }

      // Vertical alignment (center-to-center)
      if (snapY === null && Math.abs(objCenter.y - otherCenter.y) < SNAP_THRESHOLD) {
        snapY = otherCenter.y - objBounds.height / 2;
        addGuideline(Math.min(objEdges.left, otherEdges.left), otherCenter.y, Math.max(objEdges.right, otherEdges.right), otherCenter.y);
      }

      // Left edge alignment
      if (snapX === null && Math.abs(objEdges.left - otherEdges.left) < SNAP_THRESHOLD) {
        snapX = otherEdges.left;
        addGuideline(otherEdges.left, Math.min(objEdges.top, otherEdges.top), otherEdges.left, Math.max(objEdges.bottom, otherEdges.bottom));
      }

      // Right edge alignment
      if (snapX === null && Math.abs(objEdges.right - otherEdges.right) < SNAP_THRESHOLD) {
        snapX = otherEdges.right - objBounds.width;
        addGuideline(otherEdges.right, Math.min(objEdges.top, otherEdges.top), otherEdges.right, Math.max(objEdges.bottom, otherEdges.bottom));
      }

      // Left-to-right edge alignment
      if (snapX === null && Math.abs(objEdges.left - otherEdges.right) < SNAP_THRESHOLD) {
        snapX = otherEdges.right;
        addGuideline(otherEdges.right, Math.min(objEdges.top, otherEdges.top), otherEdges.right, Math.max(objEdges.bottom, otherEdges.bottom));
      }

      // Right-to-left edge alignment
      if (snapX === null && Math.abs(objEdges.right - otherEdges.left) < SNAP_THRESHOLD) {
        snapX = otherEdges.left - objBounds.width;
        addGuideline(otherEdges.left, Math.min(objEdges.top, otherEdges.top), otherEdges.left, Math.max(objEdges.bottom, otherEdges.bottom));
      }

      // Top edge alignment
      if (snapY === null && Math.abs(objEdges.top - otherEdges.top) < SNAP_THRESHOLD) {
        snapY = otherEdges.top;
        addGuideline(Math.min(objEdges.left, otherEdges.left), otherEdges.top, Math.max(objEdges.right, otherEdges.right), otherEdges.top);
      }

      // Bottom edge alignment
      if (snapY === null && Math.abs(objEdges.bottom - otherEdges.bottom) < SNAP_THRESHOLD) {
        snapY = otherEdges.bottom - objBounds.height;
        addGuideline(Math.min(objEdges.left, otherEdges.left), otherEdges.bottom, Math.max(objEdges.right, otherEdges.right), otherEdges.bottom);
      }
    }

    // Apply snap
    if (snapX !== null) obj.set("left", snapX);
    if (snapY !== null) obj.set("top", snapY);
  }

  function onObjectModified() {
    clearGuidelines();
  }

  canvas.on("object:moving", onObjectMoving);
  canvas.on("object:modified", onObjectModified);
  canvas.on("mouse:up", clearGuidelines);

  return () => {
    canvas.off("object:moving", onObjectMoving);
    canvas.off("object:modified", onObjectModified);
    canvas.off("mouse:up", clearGuidelines);
    clearGuidelines();
  };
}
