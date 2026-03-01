"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useEditorStore } from "@/lib/design-studio/editor-store";
import { useFabricCanvas } from "@/lib/design-studio/use-fabric-canvas";
import { removePrintGuides, createPrintGuides } from "@/lib/design-studio/print-guides";
import { preloadAllFonts } from "@/lib/design-studio/fonts";
import EditorCanvas from "./EditorCanvas";
import EditorToolbar from "./EditorToolbar";
import ToolPanel from "./ToolPanel";
import PropertiesPanel from "./PropertiesPanel";
import ApprovalModal from "./ApprovalModal";
import ContextMenu from "./ContextMenu";

/**
 * Main Design Studio component — full-screen editor.
 * Responsive: on mobile/tablet, panels become slide-out drawers.
 *
 * Props:
 *  - productSlug: string — product identifier
 *  - productSpec: object — from getProductSpec()
 *  - cartItemContext: { id, slug, name, price, qty, options } — for cart integration
 */
export default function DesignStudio({
  productSlug,
  productSpec,
  cartItemContext,
}) {
  const [showApproval, setShowApproval] = useState(false);
  const [mobilePanel, setMobilePanel] = useState(null); // null | 'tools' | 'properties'
  const canvasElRef = useRef(null);

  const { setProductContext, resetEditor } = useEditorStore();
  const { fabricRef } = useFabricCanvas(canvasElRef, productSpec);

  // Set product context on mount + preload fonts
  useEffect(() => {
    if (productSlug && productSpec) {
      const currentSlug = useEditorStore.getState().productSlug;
      // Reset if switching products
      if (currentSlug && currentSlug !== productSlug) {
        resetEditor();
      }
      setProductContext(productSlug, productSpec);
    }
    // Preload all Google Fonts for instant preview
    preloadAllFonts();
  }, [productSlug, productSpec, setProductContext, resetEditor]);

  // Listen for undo/redo restore events from toolbar
  useEffect(() => {
    const handler = (e) => {
      const canvas = fabricRef?.current;
      if (!canvas || !e.detail) return;

      canvas
        .loadFromJSON(e.detail)
        .then(() => {
          // Re-add guides
          removePrintGuides(canvas);
          if (productSpec) {
            const guides = createPrintGuides(productSpec);
            const showGuides = useEditorStore.getState().showGuides;
            for (const g of guides) {
              g.visible = showGuides;
              canvas.add(g);
              canvas.bringObjectToFront(g);
            }
          }
          canvas.requestRenderAll();
        })
        .catch(console.error);
    };

    window.addEventListener("design-studio:restore", handler);
    return () => window.removeEventListener("design-studio:restore", handler);
  }, [fabricRef, productSpec]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+Z / Cmd+Z — Undo
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        const prev = useEditorStore.getState().undo();
        if (prev) {
          window.dispatchEvent(
            new CustomEvent("design-studio:restore", { detail: prev })
          );
        }
      }
      // Ctrl+Y / Cmd+Shift+Z — Redo
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === "y" || (e.key === "z" && e.shiftKey))
      ) {
        e.preventDefault();
        const next = useEditorStore.getState().redo();
        if (next) {
          window.dispatchEvent(
            new CustomEvent("design-studio:restore", { detail: next })
          );
        }
      }
      // Delete / Backspace — Delete selected object
      if (e.key === "Delete" || e.key === "Backspace") {
        const canvas = fabricRef?.current;
        if (!canvas) return;
        const active = canvas.getActiveObject();
        if (active && !active.isEditing && !active.id?.startsWith("__guide_")) {
          e.preventDefault();
          const store = useEditorStore.getState();
          store.pushUndo(store.canvasJSON);
          canvas.remove(active);
          canvas.discardActiveObject();
          canvas.requestRenderAll();
          const json = canvas.toJSON(["id", "selectable", "evented", "excludeFromExport"]);
          store.setCanvasJSON(json);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [fabricRef]);

  const handleApprove = useCallback(() => {
    setShowApproval(true);
  }, []);

  const toggleMobilePanel = useCallback((panel) => {
    setMobilePanel((prev) => (prev === panel ? null : panel));
  }, []);

  return (
    <div className="flex h-screen flex-col bg-gray-100">
      {/* Top toolbar */}
      <EditorToolbar productSpec={productSpec} onApprove={handleApprove} />

      {/* Main editor area — desktop: 3 columns, mobile: full canvas + bottom bar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left tool panel — hidden on mobile */}
        <div className="hidden lg:block">
          <ToolPanel fabricRef={fabricRef} productSpec={productSpec} />
        </div>

        {/* Center canvas — always visible */}
        <EditorCanvas
          productSpec={productSpec}
          canvasElRef={canvasElRef}
        />

        {/* Right properties panel — hidden on mobile */}
        <div className="hidden lg:block">
          <PropertiesPanel fabricRef={fabricRef} productSpec={productSpec} />
        </div>
      </div>

      {/* Mobile bottom toolbar — visible only on small screens */}
      <div className="flex lg:hidden border-t border-gray-200 bg-white">
        <button
          onClick={() => toggleMobilePanel("tools")}
          className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium ${
            mobilePanel === "tools" ? "text-blue-600" : "text-gray-500"
          }`}
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
          </svg>
          Tools
        </button>
        <button
          onClick={() => toggleMobilePanel("properties")}
          className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium ${
            mobilePanel === "properties" ? "text-blue-600" : "text-gray-500"
          }`}
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
          </svg>
          Properties
        </button>
        <button
          onClick={handleApprove}
          className="flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium text-green-600"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Approve
        </button>
      </div>

      {/* Mobile slide-up panels */}
      {mobilePanel && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/30 lg:hidden"
            onClick={() => setMobilePanel(null)}
          />
          {/* Panel drawer */}
          <div className="fixed inset-x-0 bottom-0 z-50 max-h-[70vh] overflow-y-auto rounded-t-2xl bg-white shadow-2xl lg:hidden">
            {/* Drag handle */}
            <div className="sticky top-0 flex justify-center bg-white py-2">
              <div className="h-1 w-10 rounded-full bg-gray-300" />
            </div>
            {mobilePanel === "tools" && (
              <div className="px-4 pb-6">
                <ToolPanel fabricRef={fabricRef} productSpec={productSpec} mobile />
              </div>
            )}
            {mobilePanel === "properties" && (
              <div className="pb-6">
                <PropertiesPanel fabricRef={fabricRef} productSpec={productSpec} mobile />
              </div>
            )}
          </div>
        </>
      )}

      {/* Right-click context menu */}
      <ContextMenu fabricRef={fabricRef} />

      {/* Approval modal */}
      <ApprovalModal
        open={showApproval}
        onClose={() => setShowApproval(false)}
        fabricRef={fabricRef}
        productSpec={productSpec}
        cartItemContext={cartItemContext}
      />
    </div>
  );
}
