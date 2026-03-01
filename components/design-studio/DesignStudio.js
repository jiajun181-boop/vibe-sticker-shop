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
 *  - productSpec: object — from getProductSpec() (memoized by parent)
 *  - cartItemContext: { id, slug, name, price, qty, options } — for cart integration
 */
export default function DesignStudio({
  productSlug,
  productSpec,
  cartItemContext,
}) {
  const [showApproval, setShowApproval] = useState(false);
  const [mobilePanel, setMobilePanel] = useState(null); // null | 'text' | 'images' | 'shapes' | 'properties'
  const canvasElRef = useRef(null);
  const fontsPreloaded = useRef(false);

  const { fabricRef } = useFabricCanvas(canvasElRef, productSpec);

  // Set product context on mount — use slug as stable dependency
  useEffect(() => {
    if (!productSlug || !productSpec) return;

    const store = useEditorStore.getState();
    // Reset if switching products
    if (store.productSlug && store.productSlug !== productSlug) {
      store.resetEditor();
    }
    store.setProductContext(productSlug, productSpec);

    // Preload fonts once
    if (!fontsPreloaded.current) {
      fontsPreloaded.current = true;
      preloadAllFonts();
    }
    // Only re-run when slug changes (productSpec is memoized by parent)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productSlug]);

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
    <div className="flex h-[100dvh] flex-col bg-gray-100">
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
      <div className="flex lg:hidden border-t border-gray-200 bg-white pb-safe">
        {/* Text */}
        <button
          onClick={() => toggleMobilePanel("text")}
          className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium ${
            mobilePanel === "text" ? "text-blue-600" : "text-gray-500"
          }`}
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
          </svg>
          Text
        </button>
        {/* Images */}
        <button
          onClick={() => toggleMobilePanel("images")}
          className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium ${
            mobilePanel === "images" ? "text-blue-600" : "text-gray-500"
          }`}
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
          </svg>
          Images
        </button>
        {/* Shapes */}
        <button
          onClick={() => toggleMobilePanel("shapes")}
          className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium ${
            mobilePanel === "shapes" ? "text-blue-600" : "text-gray-500"
          }`}
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" />
          </svg>
          Shapes
        </button>
        {/* Edit (Properties) */}
        <button
          onClick={() => toggleMobilePanel("properties")}
          className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium ${
            mobilePanel === "properties" ? "text-blue-600" : "text-gray-500"
          }`}
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
          </svg>
          Edit
        </button>
        {/* Approve */}
        <button
          onClick={handleApprove}
          className="flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-semibold text-emerald-600"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Done
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
          <div className="fixed inset-x-0 bottom-0 z-50 max-h-[60vh] overflow-y-auto rounded-t-2xl bg-white shadow-2xl lg:hidden">
            {/* Drag handle + close */}
            <div className="sticky top-0 z-10 flex items-center justify-between bg-white px-4 py-2">
              <div className="h-1 w-10 rounded-full bg-gray-300" />
              <button
                onClick={() => setMobilePanel(null)}
                className="rounded-full p-1 text-gray-400 hover:bg-gray-100"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {(mobilePanel === "tools" || mobilePanel === "text" || mobilePanel === "images" || mobilePanel === "shapes") && (
              <div className="px-4 pb-6">
                <ToolPanel
                  fabricRef={fabricRef}
                  productSpec={productSpec}
                  mobile
                  initialTab={mobilePanel === "text" ? 1 : mobilePanel === "images" ? 2 : mobilePanel === "shapes" ? 3 : 0}
                />
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
