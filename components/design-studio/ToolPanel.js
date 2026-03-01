"use client";

import { useState, useCallback } from "react";
import { Textbox, Rect, Circle, Triangle, Line, FabricImage } from "fabric";
import { useEditorStore } from "@/lib/design-studio/editor-store";
import { getDesignTemplatesByCategory } from "@/lib/design-studio/templates";
import { getCanvasDimensions } from "@/lib/design-studio/product-configs";
import {
  createPrintGuides,
  removePrintGuides,
} from "@/lib/design-studio/print-guides";

const TABS = [
  { id: "templates", label: "Templates", icon: "M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" },
  { id: "text", label: "Text", icon: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" },
  { id: "images", label: "Images", icon: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" },
  { id: "shapes", label: "Shapes", icon: "M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm0 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10-10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5z" },
  { id: "layers", label: "Layers", icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" },
];

const PRESET_COLORS = [
  "#000000", "#ffffff", "#ef4444", "#f97316", "#eab308",
  "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899", "#6b7280",
];

export default function ToolPanel({ fabricRef, productSpec, mobile = false }) {
  const { activePanel, setActivePanel, showGuides, pushUndo, setCanvasJSON, setTemplateId } =
    useEditorStore();

  const getCanvas = () => fabricRef?.current;

  const saveState = useCallback(() => {
    const canvas = getCanvas();
    if (!canvas) return;
    const json = canvas.toJSON(["id", "selectable", "evented", "excludeFromExport"]);
    pushUndo(useEditorStore.getState().canvasJSON);
    setCanvasJSON(json);
  }, [pushUndo, setCanvasJSON]);

  return (
    <div className={`flex flex-col bg-white ${mobile ? "w-full" : "h-full w-[280px] border-r border-gray-200"}`}>
      {/* Tab buttons */}
      <div className="flex border-b border-gray-100">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActivePanel(tab.id)}
            className={`flex flex-1 flex-col items-center gap-0.5 px-1 py-2.5 text-[10px] font-medium transition-colors ${
              activePanel === tab.id
                ? "border-b-2 border-gray-900 text-gray-900"
                : "text-gray-400 hover:text-gray-600"
            }`}
            title={tab.label}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d={tab.icon} />
            </svg>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Panel content */}
      <div className="flex-1 overflow-y-auto p-3">
        {activePanel === "templates" && (
          <TemplateGrid
            productSpec={productSpec}
            fabricRef={fabricRef}
            saveState={saveState}
            setTemplateId={setTemplateId}
          />
        )}
        {activePanel === "text" && (
          <TextTools getCanvas={getCanvas} saveState={saveState} />
        )}
        {activePanel === "images" && (
          <ImageTools getCanvas={getCanvas} saveState={saveState} />
        )}
        {activePanel === "shapes" && (
          <ShapeTools getCanvas={getCanvas} saveState={saveState} />
        )}
        {activePanel === "layers" && (
          <LayerList fabricRef={fabricRef} saveState={saveState} />
        )}
      </div>
    </div>
  );
}

// --- Template Thumbnail (lightweight CSS preview) ---
function TemplateThumbnail({ template }) {
  const bg = template.canvasJSON?.backgroundColor || "#ffffff";
  const objects = template.canvasJSON?.objects || [];

  // Extract key visual elements for preview
  const texts = objects.filter((o) => o.type === "Textbox" || o.type === "IText" || o.type === "Text");
  const rects = objects.filter((o) => o.type === "Rect");

  // Get canvas size for aspect ratio
  const cWidth = template.canvasJSON?.width || 400;
  const cHeight = template.canvasJSON?.height || 300;
  const aspect = cWidth / cHeight;

  return (
    <div
      className="relative w-full overflow-hidden rounded"
      style={{
        backgroundColor: bg,
        aspectRatio: `${aspect}`,
      }}
    >
      {/* Render rectangles as colored blocks */}
      {rects.slice(0, 3).map((r, i) => {
        const left = ((r.left || 0) / cWidth) * 100;
        const top = ((r.top || 0) / cHeight) * 100;
        const width = (((r.width || 0) * (r.scaleX || 1)) / cWidth) * 100;
        const height = (((r.height || 0) * (r.scaleY || 1)) / cHeight) * 100;
        return (
          <div
            key={i}
            className="absolute"
            style={{
              left: `${left}%`,
              top: `${top}%`,
              width: `${width}%`,
              height: `${height}%`,
              backgroundColor: r.fill || "#e5e7eb",
              opacity: r.opacity ?? 1,
            }}
          />
        );
      })}

      {/* Render text as tiny labels */}
      {texts.slice(0, 4).map((t, i) => {
        const left = ((t.left || 0) / cWidth) * 100;
        const top = ((t.top || 0) / cHeight) * 100;
        const fontSize = Math.max(4, Math.min(10, ((t.fontSize || 20) / cHeight) * 40));
        return (
          <div
            key={`t${i}`}
            className="absolute truncate whitespace-nowrap"
            style={{
              left: `${left}%`,
              top: `${top}%`,
              fontSize: `${fontSize}px`,
              fontWeight: t.fontWeight === "bold" ? "bold" : "normal",
              color: t.fill || "#000",
              maxWidth: "90%",
              lineHeight: 1.2,
            }}
          >
            {t.text?.substring(0, 30)}
          </div>
        );
      })}

      {/* Empty state overlay */}
      {objects.length === 0 && (
        <div className="flex h-full items-center justify-center text-[8px] text-gray-400">
          Blank
        </div>
      )}
    </div>
  );
}

// --- Template Grid ---
function TemplateGrid({ productSpec, fabricRef, saveState, setTemplateId }) {
  const category = productSpec?.slug || "business-cards";
  const templates = getDesignTemplatesByCategory(category);
  const { showGuides } = useEditorStore();

  const loadTemplate = useCallback(
    (template) => {
      const canvas = fabricRef?.current;
      if (!canvas) return;

      saveState();

      canvas
        .loadFromJSON(template.canvasJSON)
        .then(() => {
          // Re-add print guides
          removePrintGuides(canvas);
          if (productSpec) {
            const guides = createPrintGuides(productSpec);
            for (const g of guides) {
              g.visible = showGuides;
              canvas.add(g);
              canvas.bringObjectToFront(g);
            }
          }
          canvas.requestRenderAll();
          setTemplateId(template.id);
          // Save to store
          const json = canvas.toJSON(["id", "selectable", "evented", "excludeFromExport"]);
          useEditorStore.getState().setCanvasJSON(json);
        })
        .catch(console.error);
    },
    [fabricRef, productSpec, saveState, showGuides, setTemplateId]
  );

  if (templates.length === 0) {
    return (
      <p className="py-4 text-center text-xs text-gray-400">
        No templates for this product yet. Start from scratch!
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-gray-500">Choose a template</p>

      {/* Blank canvas option */}
      <button
        onClick={() => {
          const canvas = fabricRef?.current;
          if (!canvas) return;
          saveState();
          // Clear all non-guide objects
          const toRemove = canvas.getObjects().filter(
            (o) => !o.id?.startsWith("__guide_") && !o.id?.startsWith("__snap_")
          );
          toRemove.forEach((o) => canvas.remove(o));
          canvas.requestRenderAll();
          setTemplateId(null);
          const json = canvas.toJSON(["id", "selectable", "evented", "excludeFromExport"]);
          useEditorStore.getState().setCanvasJSON(json);
        }}
        className="flex w-full items-center gap-2 rounded-lg border-2 border-dashed border-gray-300 px-3 py-2.5 text-xs font-medium text-gray-500 transition-all hover:border-gray-400 hover:bg-gray-50"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        Start from scratch
      </button>

      <div className="grid grid-cols-2 gap-2">
        {templates.map((t) => (
          <button
            key={t.id}
            onClick={() => loadTemplate(t)}
            className="group flex flex-col items-center gap-1 rounded-lg border border-gray-200 p-1.5 transition-all hover:border-blue-400 hover:shadow-md"
          >
            <TemplateThumbnail template={t} />
            <span className="text-[10px] font-medium text-gray-600 group-hover:text-gray-900">
              {t.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

// --- Text Tools ---
function TextTools({ getCanvas, saveState }) {
  const addText = useCallback(
    (preset) => {
      const canvas = getCanvas();
      if (!canvas) return;

      saveState();
      const text = new Textbox(preset.text, {
        left: 100,
        top: 100,
        width: preset.width || 400,
        fontSize: preset.fontSize,
        fontFamily: preset.fontFamily || "Helvetica",
        fontWeight: preset.fontWeight || "normal",
        fill: preset.fill || "#000000",
        id: `text_${Date.now()}`,
      });
      canvas.add(text);
      canvas.setActiveObject(text);
      canvas.requestRenderAll();

      const json = canvas.toJSON(["id", "selectable", "evented", "excludeFromExport"]);
      useEditorStore.getState().setCanvasJSON(json);
    },
    [getCanvas, saveState]
  );

  return (
    <div className="space-y-3">
      <p className="text-xs font-medium text-gray-500">Add text</p>
      <button
        onClick={() =>
          addText({ text: "Heading", fontSize: 48, fontWeight: "bold", width: 500 })
        }
        className="w-full rounded-lg border border-gray-200 px-4 py-3 text-left text-lg font-bold transition-colors hover:border-gray-400 hover:bg-gray-50"
      >
        Add a heading
      </button>
      <button
        onClick={() =>
          addText({ text: "Subheading", fontSize: 32, fontWeight: "600", width: 400 })
        }
        className="w-full rounded-lg border border-gray-200 px-4 py-3 text-left text-base font-semibold transition-colors hover:border-gray-400 hover:bg-gray-50"
      >
        Add a subheading
      </button>
      <button
        onClick={() =>
          addText({
            text: "Body text. Click to edit.",
            fontSize: 20,
            width: 400,
          })
        }
        className="w-full rounded-lg border border-gray-200 px-4 py-3 text-left text-sm transition-colors hover:border-gray-400 hover:bg-gray-50"
      >
        Add body text
      </button>
    </div>
  );
}

// --- Image Tools ---
function ImageTools({ getCanvas, saveState }) {
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = useCallback(
    (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const canvas = getCanvas();
      if (!canvas) return;

      setUploading(true);
      const reader = new FileReader();
      reader.onload = (ev) => {
        const imgEl = new Image();
        imgEl.onload = () => {
          saveState();
          const fabricImg = new FabricImage(imgEl, {
            left: 100,
            top: 100,
            id: `img_${Date.now()}`,
          });
          // Scale down if too large
          const maxDim = Math.min(canvas.width, canvas.height) * 0.6;
          if (fabricImg.width > maxDim || fabricImg.height > maxDim) {
            const scale = maxDim / Math.max(fabricImg.width, fabricImg.height);
            fabricImg.scale(scale);
          }
          canvas.add(fabricImg);
          canvas.setActiveObject(fabricImg);
          canvas.requestRenderAll();

          const json = canvas.toJSON(["id", "selectable", "evented", "excludeFromExport"]);
          useEditorStore.getState().setCanvasJSON(json);
          setUploading(false);
        };
        imgEl.src = ev.target.result;
      };
      reader.readAsDataURL(file);
    },
    [getCanvas, saveState]
  );

  return (
    <div className="space-y-3">
      <p className="text-xs font-medium text-gray-500">Add image</p>
      <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-gray-300 px-4 py-6 text-center transition-colors hover:border-gray-400 hover:bg-gray-50">
        <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
        </svg>
        <span className="text-sm font-medium text-gray-600">
          {uploading ? "Uploading..." : "Upload Image"}
        </span>
        <span className="text-xs text-gray-400">JPG, PNG, SVG</span>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
          disabled={uploading}
        />
      </label>
      <p className="text-[10px] text-gray-400">
        For best quality, use 300 DPI images. Low resolution images will be flagged during preflight.
      </p>
    </div>
  );
}

// --- Shape Tools ---
function ShapeTools({ getCanvas, saveState }) {
  const addShape = useCallback(
    (type, color = "#3b82f6") => {
      const canvas = getCanvas();
      if (!canvas) return;

      saveState();
      let shape;
      const baseProps = { left: 150, top: 150, fill: color, id: `shape_${Date.now()}` };

      switch (type) {
        case "rect":
          shape = new Rect({ ...baseProps, width: 200, height: 150 });
          break;
        case "circle":
          shape = new Circle({ ...baseProps, radius: 80 });
          break;
        case "triangle":
          shape = new Triangle({ ...baseProps, width: 180, height: 160 });
          break;
        case "line":
          shape = new Line([0, 0, 300, 0], {
            left: 150,
            top: 150,
            stroke: color,
            strokeWidth: 3,
            fill: "",
            id: `shape_${Date.now()}`,
          });
          break;
        default:
          return;
      }

      canvas.add(shape);
      canvas.setActiveObject(shape);
      canvas.requestRenderAll();

      const json = canvas.toJSON(["id", "selectable", "evented", "excludeFromExport"]);
      useEditorStore.getState().setCanvasJSON(json);
    },
    [getCanvas, saveState]
  );

  return (
    <div className="space-y-3">
      <p className="text-xs font-medium text-gray-500">Add shape</p>
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => addShape("rect")}
          className="flex flex-col items-center gap-1 rounded-lg border border-gray-200 p-3 transition-colors hover:border-gray-400 hover:bg-gray-50"
        >
          <div className="h-8 w-10 rounded-sm bg-blue-500" />
          <span className="text-[10px] text-gray-600">Rectangle</span>
        </button>
        <button
          onClick={() => addShape("circle")}
          className="flex flex-col items-center gap-1 rounded-lg border border-gray-200 p-3 transition-colors hover:border-gray-400 hover:bg-gray-50"
        >
          <div className="h-8 w-8 rounded-full bg-blue-500" />
          <span className="text-[10px] text-gray-600">Circle</span>
        </button>
        <button
          onClick={() => addShape("triangle")}
          className="flex flex-col items-center gap-1 rounded-lg border border-gray-200 p-3 transition-colors hover:border-gray-400 hover:bg-gray-50"
        >
          <div
            className="h-0 w-0"
            style={{
              borderLeft: "16px solid transparent",
              borderRight: "16px solid transparent",
              borderBottom: "28px solid #3b82f6",
            }}
          />
          <span className="text-[10px] text-gray-600">Triangle</span>
        </button>
        <button
          onClick={() => addShape("line")}
          className="flex flex-col items-center gap-1 rounded-lg border border-gray-200 p-3 transition-colors hover:border-gray-400 hover:bg-gray-50"
        >
          <div className="my-3 h-0.5 w-10 bg-blue-500" />
          <span className="text-[10px] text-gray-600">Line</span>
        </button>
      </div>

      <p className="text-xs font-medium text-gray-500">Quick colors</p>
      <div className="flex flex-wrap gap-1.5">
        {PRESET_COLORS.map((c) => (
          <button
            key={c}
            onClick={() => addShape("rect", c)}
            className="h-6 w-6 rounded border border-gray-300 transition-transform hover:scale-110"
            style={{ backgroundColor: c }}
            title={c}
          />
        ))}
      </div>
    </div>
  );
}

// --- Layer List with drag reorder ---
function LayerList({ fabricRef, saveState }) {
  const { selectedObjectId, setSelectedObjectId } = useEditorStore();
  const [dragIndex, setDragIndex] = useState(null);
  const [dropIndex, setDropIndex] = useState(null);
  const canvas = fabricRef?.current;

  const objects = canvas
    ? canvas
        .getObjects()
        .filter((obj) => !obj.id?.startsWith("__guide_") && !obj.id?.startsWith("__snap_"))
        .reverse()
    : [];

  const handleSelect = (obj) => {
    if (!canvas) return;
    canvas.setActiveObject(obj);
    canvas.requestRenderAll();
    setSelectedObjectId(obj.id || null);
  };

  const handleToggleVisibility = (obj) => {
    obj.visible = !obj.visible;
    canvas.requestRenderAll();
    saveState();
  };

  const handleToggleLock = (obj) => {
    const locked = !obj.selectable;
    obj.set({
      selectable: !locked,
      evented: !locked,
    });
    canvas.requestRenderAll();
  };

  const handleDelete = (obj) => {
    saveState();
    canvas.remove(obj);
    canvas.requestRenderAll();
    const json = canvas.toJSON(["id", "selectable", "evented", "excludeFromExport"]);
    useEditorStore.getState().setCanvasJSON(json);
  };

  // Drag-to-reorder handlers
  const handleDragStart = (e, index) => {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDropIndex(index);
  };

  const handleDragLeave = () => {
    setDropIndex(null);
  };

  const handleDrop = (e, toIndex) => {
    e.preventDefault();
    const fromIndex = dragIndex;
    setDragIndex(null);
    setDropIndex(null);

    if (fromIndex === null || fromIndex === toIndex || !canvas) return;

    saveState();

    // objects[] is reversed (top layer first), so we need to convert
    // back to canvas z-index: canvas index = allObjects.length - 1 - displayIndex
    const allNonGuides = canvas.getObjects().filter(
      (o) => !o.id?.startsWith("__guide_") && !o.id?.startsWith("__snap_")
    );
    const total = allNonGuides.length;
    const fromCanvasIdx = total - 1 - fromIndex;
    const toCanvasIdx = total - 1 - toIndex;

    const obj = allNonGuides[fromCanvasIdx];
    if (!obj) return;

    // Move object to new z-index position
    const allObjects = canvas.getObjects();
    const currentIdx = allObjects.indexOf(obj);
    const targetObj = allNonGuides[toCanvasIdx];
    const targetIdx = allObjects.indexOf(targetObj);

    if (currentIdx < targetIdx) {
      // Moving up in z-order (down in list display)
      for (let i = currentIdx; i < targetIdx; i++) {
        canvas.bringObjectForward(obj);
      }
    } else {
      // Moving down in z-order (up in list display)
      for (let i = currentIdx; i > targetIdx; i--) {
        canvas.sendObjectBackwards(obj);
      }
    }

    canvas.requestRenderAll();
    const json = canvas.toJSON(["id", "selectable", "evented", "excludeFromExport"]);
    useEditorStore.getState().setCanvasJSON(json);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    setDropIndex(null);
  };

  const handleMoveUp = (obj, index) => {
    if (index === 0 || !canvas) return;
    saveState();
    canvas.bringObjectForward(obj);
    canvas.requestRenderAll();
    const json = canvas.toJSON(["id", "selectable", "evented", "excludeFromExport"]);
    useEditorStore.getState().setCanvasJSON(json);
  };

  const handleMoveDown = (obj, index) => {
    if (index === objects.length - 1 || !canvas) return;
    saveState();
    canvas.sendObjectBackwards(obj);
    canvas.requestRenderAll();
    const json = canvas.toJSON(["id", "selectable", "evented", "excludeFromExport"]);
    useEditorStore.getState().setCanvasJSON(json);
  };

  const getLayerLabel = (obj) => {
    if (obj.type === "Textbox" || obj.type === "IText") {
      return obj.text?.substring(0, 20) || "Text";
    }
    if (obj.type === "Rect") return "Rectangle";
    if (obj.type === "Circle") return "Circle";
    if (obj.type === "Triangle") return "Triangle";
    if (obj.type === "Line") return "Line";
    if (obj.type === "Image") return "Image";
    return obj.type || "Object";
  };

  const getLayerIcon = (obj) => {
    if (obj.type === "Textbox" || obj.type === "IText" || obj.type === "Text") return "T";
    if (obj.type === "Image") return "I";
    if (obj.type === "Rect") return "R";
    if (obj.type === "Circle") return "C";
    if (obj.type === "Triangle") return "T";
    if (obj.type === "Line") return "L";
    return "O";
  };

  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-gray-500">
        Layers ({objects.length})
      </p>
      {objects.length === 0 && (
        <p className="py-4 text-center text-xs text-gray-400">
          No objects on canvas
        </p>
      )}
      {objects.map((obj, i) => (
        <div
          key={obj.id || i}
          draggable
          onDragStart={(e) => handleDragStart(e, i)}
          onDragOver={(e) => handleDragOver(e, i)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, i)}
          onDragEnd={handleDragEnd}
          onClick={() => handleSelect(obj)}
          className={`flex cursor-grab items-center gap-1.5 rounded-lg px-1.5 py-1.5 text-xs transition-colors ${
            selectedObjectId === obj.id
              ? "bg-blue-50 text-blue-700"
              : "text-gray-600 hover:bg-gray-50"
          } ${dragIndex === i ? "opacity-40" : ""} ${
            dropIndex === i && dropIndex !== dragIndex
              ? "border-t-2 border-blue-400"
              : ""
          }`}
        >
          {/* Drag handle */}
          <span className="cursor-grab text-gray-300 hover:text-gray-500" title="Drag to reorder">
            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M7 2a2 2 0 10.001 4.001A2 2 0 007 2zm0 6a2 2 0 10.001 4.001A2 2 0 007 8zm0 6a2 2 0 10.001 4.001A2 2 0 007 14zm6-8a2 2 0 10-.001-4.001A2 2 0 0013 6zm0 2a2 2 0 10.001 4.001A2 2 0 0013 8zm0 6a2 2 0 10.001 4.001A2 2 0 0013 14z" />
            </svg>
          </span>

          {/* Layer type badge */}
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-gray-100 text-[9px] font-bold text-gray-500">
            {getLayerIcon(obj)}
          </span>

          <span className="flex-1 truncate">{getLayerLabel(obj)}</span>

          {/* Move up/down buttons */}
          <button
            onClick={(e) => { e.stopPropagation(); handleMoveUp(obj, i); }}
            className="p-0.5 text-gray-300 hover:text-gray-600"
            title="Move up"
            disabled={i === 0}
          >
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
            </svg>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleMoveDown(obj, i); }}
            className="p-0.5 text-gray-300 hover:text-gray-600"
            title="Move down"
            disabled={i === objects.length - 1}
          >
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleToggleVisibility(obj);
            }}
            className="p-0.5 hover:text-gray-900"
            title={obj.visible === false ? "Show" : "Hide"}
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              {obj.visible === false ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178zM15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              )}
            </svg>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleToggleLock(obj);
            }}
            className="p-0.5 hover:text-gray-900"
            title={obj.selectable ? "Lock" : "Unlock"}
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              {!obj.selectable ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75M3.75 21.75h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              )}
            </svg>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(obj);
            }}
            className="p-0.5 text-gray-400 hover:text-red-500"
            title="Delete"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}
