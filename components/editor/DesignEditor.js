"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getTemplate } from "@/lib/editor/templates";
import { renderToCanvas, exportHighRes } from "@/lib/editor/render";
import EditorToolbar from "./EditorToolbar";
import TemplatePresets from "./TemplatePresets";

export default function DesignEditor({ product = "business-cards", onDesignReady }) {
  const canvasRef = useRef(null);
  const [templateId, setTemplateId] = useState("modern-dark");
  const [elements, setElements] = useState(() => getTemplate("modern-dark").elements);
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const [exporting, setExporting] = useState(false);

  const template = getTemplate(templateId);

  // Push state to history
  const pushHistory = useCallback((newElements) => {
    setHistory((h) => [...h.slice(0, historyIdx + 1), JSON.stringify(newElements)]);
    setHistoryIdx((i) => i + 1);
  }, [historyIdx]);

  // Render canvas
  useEffect(() => {
    if (!canvasRef.current) return;
    const currentTemplate = { canvas: template.canvas, elements };
    renderToCanvas(canvasRef.current, currentTemplate, 1);
  }, [elements, template.canvas]);

  const handleSelectTemplate = useCallback((t) => {
    setTemplateId(t.id);
    setElements([...t.elements]);
    setSelectedIdx(null);
    pushHistory(t.elements);
  }, [pushHistory]);

  const handleAddText = useCallback(() => {
    const newEl = {
      type: "text",
      text: "New Text",
      x: 100,
      y: 300,
      fontSize: 24,
      fontFamily: "sans-serif",
      fill: "#333333",
    };
    const newElements = [...elements, newEl];
    setElements(newElements);
    setSelectedIdx(newElements.length - 1);
    pushHistory(newElements);
  }, [elements, pushHistory]);

  const handleUndo = useCallback(() => {
    if (historyIdx <= 0) return;
    const newIdx = historyIdx - 1;
    setHistoryIdx(newIdx);
    setElements(JSON.parse(history[newIdx]));
    setSelectedIdx(null);
  }, [historyIdx, history]);

  const handleRedo = useCallback(() => {
    if (historyIdx >= history.length - 1) return;
    const newIdx = historyIdx + 1;
    setHistoryIdx(newIdx);
    setElements(JSON.parse(history[newIdx]));
    setSelectedIdx(null);
  }, [historyIdx, history]);

  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      const currentTemplate = { canvas: template.canvas, elements };
      const blob = await exportHighRes(currentTemplate);
      if (!blob) throw new Error("Export failed");

      if (onDesignReady) {
        onDesignReady(blob);
      } else {
        // Download as file
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${product}-design.png`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error("[Editor] Export failed:", err);
    } finally {
      setExporting(false);
    }
  }, [template.canvas, elements, product, onDesignReady]);

  // Handle element editing
  const handleElementChange = useCallback((idx, field, value) => {
    const newElements = elements.map((el, i) =>
      i === idx ? { ...el, [field]: value } : el
    );
    setElements(newElements);
    pushHistory(newElements);
  }, [elements, pushHistory]);

  const handleCanvasClick = useCallback((e) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Simple hit testing for text elements
    let found = null;
    for (let i = elements.length - 1; i >= 0; i--) {
      const el = elements[i];
      if (el.type === "text") {
        const elW = (el.text?.length || 5) * (el.fontSize || 16) * 0.6;
        const elH = (el.fontSize || 16) * 1.5;
        if (x >= el.x && x <= el.x + elW && y >= el.y && y <= el.y + elH) {
          found = i;
          break;
        }
      } else if (el.type === "rect") {
        if (x >= el.x && x <= el.x + el.width && y >= el.y && y <= el.y + el.height) {
          found = i;
          break;
        }
      }
    }
    setSelectedIdx(found);
  }, [elements]);

  const selectedEl = selectedIdx !== null ? elements[selectedIdx] : null;

  return (
    <div className="space-y-4">
      <TemplatePresets
        category={product}
        onSelect={handleSelectTemplate}
        selectedId={templateId}
      />

      <EditorToolbar
        onAddText={handleAddText}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onExport={handleExport}
        canUndo={historyIdx > 0}
        canRedo={historyIdx < history.length - 1}
        exporting={exporting}
      />

      <div className="flex gap-4">
        {/* Canvas */}
        <div className="flex-1 overflow-auto rounded-lg border border-gray-200 bg-gray-100 p-4">
          <canvas
            ref={canvasRef}
            onClick={handleCanvasClick}
            className="mx-auto cursor-crosshair shadow-lg"
            style={{
              maxWidth: "100%",
              height: "auto",
            }}
          />
        </div>

        {/* Properties panel */}
        {selectedEl && (
          <div className="w-64 space-y-3 rounded-lg border border-gray-200 bg-white p-4">
            <h3 className="text-sm font-semibold uppercase text-gray-500">Properties</h3>

            {selectedEl.type === "text" && (
              <>
                <div>
                  <label className="mb-1 block text-xs text-gray-500">Text</label>
                  <input
                    type="text"
                    value={selectedEl.text || ""}
                    onChange={(e) => handleElementChange(selectedIdx, "text", e.target.value)}
                    className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-gray-500">Font Size</label>
                  <input
                    type="number"
                    value={selectedEl.fontSize || 16}
                    onChange={(e) => handleElementChange(selectedIdx, "fontSize", parseInt(e.target.value) || 16)}
                    className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-gray-500">Color</label>
                  <input
                    type="color"
                    value={selectedEl.fill || "#000000"}
                    onChange={(e) => handleElementChange(selectedIdx, "fill", e.target.value)}
                    className="h-8 w-full rounded border border-gray-300"
                  />
                </div>
              </>
            )}

            {selectedEl.type === "rect" && (
              <>
                <div>
                  <label className="mb-1 block text-xs text-gray-500">Color</label>
                  <input
                    type="color"
                    value={selectedEl.fill || "#000000"}
                    onChange={(e) => handleElementChange(selectedIdx, "fill", e.target.value)}
                    className="h-8 w-full rounded border border-gray-300"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="mb-1 block text-xs text-gray-500">Width</label>
                    <input
                      type="number"
                      value={selectedEl.width || 100}
                      onChange={(e) => handleElementChange(selectedIdx, "width", parseInt(e.target.value) || 100)}
                      className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-gray-500">Height</label>
                    <input
                      type="number"
                      value={selectedEl.height || 100}
                      onChange={(e) => handleElementChange(selectedIdx, "height", parseInt(e.target.value) || 100)}
                      className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
                    />
                  </div>
                </div>
              </>
            )}

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-xs text-gray-500">X</label>
                <input
                  type="number"
                  value={selectedEl.x || 0}
                  onChange={(e) => handleElementChange(selectedIdx, "x", parseInt(e.target.value) || 0)}
                  className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-500">Y</label>
                <input
                  type="number"
                  value={selectedEl.y || 0}
                  onChange={(e) => handleElementChange(selectedIdx, "y", parseInt(e.target.value) || 0)}
                  className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
                />
              </div>
            </div>

            <button
              onClick={() => {
                const newElements = elements.filter((_, i) => i !== selectedIdx);
                setElements(newElements);
                setSelectedIdx(null);
                pushHistory(newElements);
              }}
              className="w-full rounded border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
            >
              Delete Element
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
