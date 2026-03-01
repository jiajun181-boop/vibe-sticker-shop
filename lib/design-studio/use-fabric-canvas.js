// lib/design-studio/use-fabric-canvas.js — Fabric.js ↔ React integration hook
"use client";

import { useEffect, useRef, useCallback } from "react";
import { Canvas } from "fabric";
import { getCanvasDimensions } from "./product-configs";
import { useEditorStore } from "./editor-store";
import { createPrintGuides, removePrintGuides } from "./print-guides";
import { initSnapping } from "./snapping";

/**
 * Hook to create and manage a Fabric.js canvas linked to a React ref.
 *
 * @param {React.RefObject} canvasElRef - ref to the <canvas> element
 * @param {object} productSpec - product spec from getProductSpec()
 * @returns {{ fabricCanvas: fabric.Canvas | null }}
 */
export function useFabricCanvas(canvasElRef, productSpec) {
  const fabricRef = useRef(null);
  const isLoadingRef = useRef(false);

  const {
    canvasJSON,
    setCanvasJSON,
    pushUndo,
    setSelectedObjectId,
    showGuides,
  } = useEditorStore();

  // Sync canvas JSON to store (debounced)
  const syncToStore = useCallback(
    (canvas) => {
      if (isLoadingRef.current) return;
      const json = canvas.toJSON(["id", "selectable", "evented", "excludeFromExport"]);
      setCanvasJSON(json);
    },
    [setCanvasJSON]
  );

  // Initialize Fabric.js canvas
  useEffect(() => {
    if (!canvasElRef.current || !productSpec) return;

    const dims = getCanvasDimensions(productSpec);
    const canvas = new Canvas(canvasElRef.current, {
      width: dims.width,
      height: dims.height,
      backgroundColor: "#ffffff",
      preserveObjectStacking: true,
      selection: true,
    });

    fabricRef.current = canvas;

    // --- Event listeners ---
    canvas.on("selection:created", (e) => {
      const selected = e.selected?.[0];
      if (selected && !selected.id?.startsWith("__guide_")) {
        setSelectedObjectId(selected.id || selected.__uid || null);
      }
    });

    canvas.on("selection:updated", (e) => {
      const selected = e.selected?.[0];
      if (selected && !selected.id?.startsWith("__guide_")) {
        setSelectedObjectId(selected.id || selected.__uid || null);
      }
    });

    canvas.on("selection:cleared", () => {
      setSelectedObjectId(null);
    });

    canvas.on("object:modified", () => {
      const json = canvas.toJSON(["id", "selectable", "evented", "excludeFromExport"]);
      pushUndo(useEditorStore.getState().canvasJSON);
      setCanvasJSON(json);
    });

    // Initialize smart snapping guides
    const cleanupSnapping = initSnapping(canvas);

    // Restore canvas from persisted state
    const savedJSON = useEditorStore.getState().canvasJSON;
    if (savedJSON) {
      isLoadingRef.current = true;
      canvas
        .loadFromJSON(savedJSON)
        .then(() => {
          // Re-add guides if they were excluded
          addGuidesToCanvas(canvas, productSpec, showGuides);
          canvas.requestRenderAll();
          isLoadingRef.current = false;
        })
        .catch(() => {
          isLoadingRef.current = false;
        });
    } else {
      addGuidesToCanvas(canvas, productSpec, showGuides);
      canvas.requestRenderAll();
    }

    return () => {
      cleanupSnapping();
      canvas.dispose();
      fabricRef.current = null;
    };
    // Only run on mount/product change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productSpec?.slug]);

  // Sync guide visibility when showGuides changes
  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const objects = canvas.getObjects();
    for (const obj of objects) {
      if (obj.id && obj.id.startsWith("__guide_")) {
        obj.visible = showGuides;
      }
    }
    canvas.requestRenderAll();
  }, [showGuides]);

  return { fabricCanvas: fabricRef.current, fabricRef };
}

function addGuidesToCanvas(canvas, spec, visible) {
  // Remove existing guides first
  removePrintGuides(canvas);
  const guides = createPrintGuides(spec);
  for (const g of guides) {
    g.visible = visible;
    canvas.add(g);
  }
  // Move guides to top so they overlay content
  for (const g of guides) {
    canvas.bringObjectToFront(g);
  }
}
