"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useEditorStore } from "@/lib/design-studio/editor-store";
import { getCanvasDimensions } from "@/lib/design-studio/product-configs";
import { FONT_LIST, loadFont } from "@/lib/design-studio/fonts";

const FONT_CATEGORIES = [
  { id: "all", label: "All" },
  { id: "sans-serif", label: "Sans Serif" },
  { id: "serif", label: "Serif" },
  { id: "display", label: "Display" },
  { id: "handwriting", label: "Script" },
  { id: "monospace", label: "Mono" },
  { id: "system", label: "System" },
];

export default function PropertiesPanel({ fabricRef, productSpec, mobile = false }) {
  const { selectedObjectId, pushUndo, setCanvasJSON } = useEditorStore();
  const [, forceUpdate] = useState(0);

  const canvas = fabricRef?.current;
  const activeObj = canvas?.getActiveObject?.();
  const hasSelection = !!activeObj && !activeObj.id?.startsWith("__guide_");

  // Re-render when selection changes
  useEffect(() => {
    if (!canvas) return;
    const update = () => forceUpdate((n) => n + 1);
    canvas.on("selection:created", update);
    canvas.on("selection:updated", update);
    canvas.on("selection:cleared", update);
    canvas.on("object:modified", update);
    return () => {
      canvas.off("selection:created", update);
      canvas.off("selection:updated", update);
      canvas.off("selection:cleared", update);
      canvas.off("object:modified", update);
    };
  }, [canvas]);

  const saveAndSync = useCallback(() => {
    if (!canvas) return;
    canvas.requestRenderAll();
    const json = canvas.toJSON(["id", "selectable", "evented", "excludeFromExport"]);
    setCanvasJSON(json);
  }, [canvas, setCanvasJSON]);

  const updateProp = useCallback(
    (prop, value) => {
      if (!activeObj || !canvas) return;
      pushUndo(useEditorStore.getState().canvasJSON);
      activeObj.set(prop, value);
      saveAndSync();
    },
    [activeObj, canvas, pushUndo, saveAndSync]
  );

  const handleDelete = useCallback(() => {
    if (!activeObj || !canvas) return;
    pushUndo(useEditorStore.getState().canvasJSON);
    canvas.remove(activeObj);
    canvas.discardActiveObject();
    saveAndSync();
  }, [activeObj, canvas, pushUndo, saveAndSync]);

  // Product info when no selection
  if (!hasSelection) {
    const dims = productSpec ? getCanvasDimensions(productSpec) : null;
    return (
      <div className={`flex flex-col bg-white ${mobile ? "w-full" : "h-full w-[280px] border-l border-gray-200"}`}>
        <div className="border-b border-gray-100 px-4 py-3">
          <h3 className="text-xs font-semibold text-gray-500 uppercase">
            Product Info
          </h3>
        </div>
        <div className="p-4 space-y-3">
          {productSpec && (
            <>
              <div>
                <span className="text-xs text-gray-400">Product</span>
                <p className="text-sm font-medium">{productSpec.label}</p>
              </div>
              <div>
                <span className="text-xs text-gray-400">Trim Size</span>
                <p className="text-sm font-medium">
                  {productSpec.widthIn}" x {productSpec.heightIn}"
                </p>
              </div>
              <div>
                <span className="text-xs text-gray-400">Bleed</span>
                <p className="text-sm font-medium">{productSpec.bleedIn}" each side</p>
              </div>
              <div>
                <span className="text-xs text-gray-400">Resolution</span>
                <p className="text-sm font-medium">{productSpec.dpi} DPI</p>
              </div>
              {dims && (
                <div>
                  <span className="text-xs text-gray-400">Canvas (px)</span>
                  <p className="text-sm font-medium">
                    {dims.width} x {dims.height}
                  </p>
                </div>
              )}
            </>
          )}
          <div className="rounded-lg bg-gray-50 p-3 text-xs text-gray-500">
            Select an object on canvas to edit its properties.
          </div>
        </div>
      </div>
    );
  }

  const objType = activeObj.type;
  const isText = objType === "Textbox" || objType === "IText" || objType === "Text";
  const isImage = objType === "Image";

  return (
    <div className={`flex flex-col bg-white ${mobile ? "w-full" : "h-full w-[280px] border-l border-gray-200"}`}>
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <h3 className="text-xs font-semibold text-gray-500 uppercase">
          Properties
        </h3>
        <button
          onClick={handleDelete}
          className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
          title="Delete"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Text Properties */}
        {isText && (
          <>
            <PropSection title="Font">
              <FontPicker
                value={activeObj.fontFamily || "Helvetica"}
                onChange={(family) => {
                  loadFont(family).then(() => {
                    updateProp("fontFamily", family);
                  });
                }}
              />
            </PropSection>

            <PropSection title="Size">
              <input
                type="number"
                value={Math.round(activeObj.fontSize || 20)}
                onChange={(e) => updateProp("fontSize", Number(e.target.value))}
                className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm"
                min={6}
                max={500}
              />
            </PropSection>

            <PropSection title="Color">
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={activeObj.fill || "#000000"}
                  onChange={(e) => updateProp("fill", e.target.value)}
                  className="h-8 w-8 cursor-pointer rounded border border-gray-200"
                />
                <input
                  type="text"
                  value={activeObj.fill || "#000000"}
                  onChange={(e) => updateProp("fill", e.target.value)}
                  className="flex-1 rounded border border-gray-200 px-2 py-1.5 text-xs font-mono"
                />
              </div>
            </PropSection>

            <PropSection title="Style">
              <div className="flex gap-1">
                <ToggleButton
                  active={activeObj.fontWeight === "bold"}
                  onClick={() =>
                    updateProp(
                      "fontWeight",
                      activeObj.fontWeight === "bold" ? "normal" : "bold"
                    )
                  }
                  title="Bold"
                >
                  B
                </ToggleButton>
                <ToggleButton
                  active={activeObj.fontStyle === "italic"}
                  onClick={() =>
                    updateProp(
                      "fontStyle",
                      activeObj.fontStyle === "italic" ? "normal" : "italic"
                    )
                  }
                  title="Italic"
                  className="italic"
                >
                  I
                </ToggleButton>
                <ToggleButton
                  active={activeObj.underline}
                  onClick={() => updateProp("underline", !activeObj.underline)}
                  title="Underline"
                  className="underline"
                >
                  U
                </ToggleButton>
              </div>
            </PropSection>

            <PropSection title="Alignment">
              <div className="flex gap-1">
                {["left", "center", "right"].map((align) => (
                  <ToggleButton
                    key={align}
                    active={activeObj.textAlign === align}
                    onClick={() => updateProp("textAlign", align)}
                    title={align}
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      {align === "left" && <path d="M3 6h18M3 12h10M3 18h14" />}
                      {align === "center" && <path d="M3 6h18M7 12h10M5 18h14" />}
                      {align === "right" && <path d="M3 6h18M11 12h10M7 18h14" />}
                    </svg>
                  </ToggleButton>
                ))}
              </div>
            </PropSection>

            <PropSection title="Line Height">
              <input
                type="number"
                step="0.1"
                value={activeObj.lineHeight || 1.16}
                onChange={(e) =>
                  updateProp("lineHeight", parseFloat(e.target.value))
                }
                className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm"
                min={0.5}
                max={4}
              />
            </PropSection>
          </>
        )}

        {/* Shape Properties */}
        {!isText && !isImage && (
          <>
            <PropSection title="Fill Color">
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={activeObj.fill || "#3b82f6"}
                  onChange={(e) => updateProp("fill", e.target.value)}
                  className="h-8 w-8 cursor-pointer rounded border border-gray-200"
                />
                <input
                  type="text"
                  value={activeObj.fill || ""}
                  onChange={(e) => updateProp("fill", e.target.value)}
                  className="flex-1 rounded border border-gray-200 px-2 py-1.5 text-xs font-mono"
                />
              </div>
            </PropSection>

            <PropSection title="Stroke">
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={activeObj.stroke || "#000000"}
                  onChange={(e) => updateProp("stroke", e.target.value)}
                  className="h-8 w-8 cursor-pointer rounded border border-gray-200"
                />
                <input
                  type="number"
                  value={activeObj.strokeWidth || 0}
                  onChange={(e) =>
                    updateProp("strokeWidth", Number(e.target.value))
                  }
                  className="w-16 rounded border border-gray-200 px-2 py-1.5 text-sm"
                  min={0}
                  max={50}
                  placeholder="Width"
                />
              </div>
            </PropSection>
          </>
        )}

        {/* Image Properties */}
        {isImage && (
          <>
            <PropSection title="Image DPI">
              <DpiDisplay obj={activeObj} productSpec={productSpec} />
            </PropSection>

            <PropSection title="Filters">
              <ImageFilters obj={activeObj} canvas={canvas} saveAndSync={saveAndSync} pushUndo={pushUndo} />
            </PropSection>

            <PropSection title="Flip">
              <div className="flex gap-1">
                <ToggleButton
                  active={activeObj.flipX}
                  onClick={() => updateProp("flipX", !activeObj.flipX)}
                  title="Flip Horizontal"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                  </svg>
                </ToggleButton>
                <ToggleButton
                  active={activeObj.flipY}
                  onClick={() => updateProp("flipY", !activeObj.flipY)}
                  title="Flip Vertical"
                >
                  <svg className="h-3.5 w-3.5 rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                  </svg>
                </ToggleButton>
              </div>
            </PropSection>
          </>
        )}

        {/* Common Properties */}
        <PropSection title="Opacity">
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={activeObj.opacity ?? 1}
            onChange={(e) =>
              updateProp("opacity", parseFloat(e.target.value))
            }
            className="w-full"
          />
          <span className="text-xs text-gray-400">
            {Math.round((activeObj.opacity ?? 1) * 100)}%
          </span>
        </PropSection>

        <PropSection title="Position">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-gray-400">X</label>
              <input
                type="number"
                value={Math.round(activeObj.left || 0)}
                onChange={(e) => updateProp("left", Number(e.target.value))}
                className="w-full rounded border border-gray-200 px-2 py-1 text-sm"
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-400">Y</label>
              <input
                type="number"
                value={Math.round(activeObj.top || 0)}
                onChange={(e) => updateProp("top", Number(e.target.value))}
                className="w-full rounded border border-gray-200 px-2 py-1 text-sm"
              />
            </div>
          </div>
        </PropSection>

        <PropSection title="Size">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-gray-400">W</label>
              <input
                type="number"
                value={Math.round(
                  (activeObj.width || 0) * (activeObj.scaleX || 1)
                )}
                onChange={(e) => {
                  const w = Number(e.target.value);
                  updateProp("scaleX", w / (activeObj.width || 1));
                }}
                className="w-full rounded border border-gray-200 px-2 py-1 text-sm"
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-400">H</label>
              <input
                type="number"
                value={Math.round(
                  (activeObj.height || 0) * (activeObj.scaleY || 1)
                )}
                onChange={(e) => {
                  const h = Number(e.target.value);
                  updateProp("scaleY", h / (activeObj.height || 1));
                }}
                className="w-full rounded border border-gray-200 px-2 py-1 text-sm"
              />
            </div>
          </div>
        </PropSection>

        <PropSection title="Rotation">
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={Math.round(activeObj.angle || 0)}
              onChange={(e) => updateProp("angle", Number(e.target.value))}
              className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm"
              min={-360}
              max={360}
            />
            <span className="text-xs text-gray-400">deg</span>
          </div>
        </PropSection>
      </div>
    </div>
  );
}

function PropSection({ title, children }) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-medium text-gray-500">
        {title}
      </label>
      {children}
    </div>
  );
}

function ToggleButton({ active, onClick, title, className = "", children }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`flex h-8 w-8 items-center justify-center rounded border text-sm font-bold transition-colors ${
        active
          ? "border-gray-900 bg-gray-900 text-white"
          : "border-gray-200 bg-white text-gray-600 hover:border-gray-400"
      } ${className}`}
    >
      {children}
    </button>
  );
}

function FontPicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");

  const filtered = useMemo(() => {
    return FONT_LIST.filter((f) => {
      if (category !== "all" && f.category !== category) return false;
      if (search && !f.family.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [search, category]);

  // Load font for preview on hover
  const handleHover = useCallback((family) => {
    loadFont(family);
  }, []);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between rounded border border-gray-200 px-2 py-1.5 text-sm hover:border-gray-400"
      >
        <span style={{ fontFamily: value }}>{value}</span>
        <svg className="h-3 w-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-lg border border-gray-200 bg-white shadow-lg">
          {/* Search */}
          <div className="border-b border-gray-100 p-2">
            <input
              type="text"
              placeholder="Search fonts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded border border-gray-200 px-2 py-1 text-xs"
              autoFocus
            />
          </div>

          {/* Category tabs */}
          <div className="flex flex-wrap gap-1 border-b border-gray-100 px-2 py-1.5">
            {FONT_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors ${
                  category === cat.id
                    ? "bg-gray-900 text-white"
                    : "text-gray-500 hover:bg-gray-100"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Font list */}
          <div className="max-h-48 overflow-y-auto">
            {filtered.map((f) => (
              <button
                key={f.family}
                onClick={() => {
                  onChange(f.family);
                  setOpen(false);
                  setSearch("");
                }}
                onMouseEnter={() => handleHover(f.family)}
                className={`flex w-full items-center px-3 py-1.5 text-sm transition-colors hover:bg-gray-50 ${
                  value === f.family ? "bg-blue-50 text-blue-700" : "text-gray-700"
                }`}
                style={{ fontFamily: f.family }}
              >
                {f.family}
                <span className="ml-auto text-[9px] text-gray-400">{f.category}</span>
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="px-3 py-4 text-center text-xs text-gray-400">No fonts found</p>
            )}
          </div>
        </div>
      )}

      {/* Click outside to close */}
      {open && (
        <div className="fixed inset-0 z-40" onClick={() => { setOpen(false); setSearch(""); }} />
      )}
    </div>
  );
}

function ImageFilters({ obj, canvas, saveAndSync, pushUndo }) {
  // Fabric.js v6 filter approach
  const applyFilter = useCallback(
    (filterType, options = {}) => {
      if (!obj || !canvas) return;
      pushUndo(useEditorStore.getState().canvasJSON);

      // Import filters dynamically from fabric
      import("fabric").then(({ filters }) => {
        // Remove existing filters of same type
        obj.filters = (obj.filters || []).filter(
          (f) => f?.type !== filterType
        );

        let filter = null;
        switch (filterType) {
          case "Brightness":
            filter = new filters.Brightness({ brightness: options.value || 0 });
            break;
          case "Contrast":
            filter = new filters.Contrast({ contrast: options.value || 0 });
            break;
          case "Saturation":
            filter = new filters.Saturation({ saturation: options.value || 0 });
            break;
          case "Grayscale":
            if (options.enabled) filter = new filters.Grayscale();
            break;
          case "Blur":
            if (options.value > 0) filter = new filters.Blur({ blur: options.value || 0 });
            break;
        }

        if (filter) obj.filters.push(filter);
        obj.applyFilters();
        canvas.requestRenderAll();
        saveAndSync();
      });
    },
    [obj, canvas, pushUndo, saveAndSync]
  );

  const getFilterValue = (type) => {
    const f = (obj.filters || []).find((f) => f?.type === type);
    if (!f) return type === "Grayscale" ? false : 0;
    if (type === "Grayscale") return true;
    return f.brightness ?? f.contrast ?? f.saturation ?? f.blur ?? 0;
  };

  return (
    <div className="space-y-2">
      <div>
        <label className="flex items-center justify-between text-[10px] text-gray-400">
          <span>Brightness</span>
          <span>{Math.round(getFilterValue("Brightness") * 100)}</span>
        </label>
        <input
          type="range" min={-0.5} max={0.5} step={0.05}
          value={getFilterValue("Brightness")}
          onChange={(e) => applyFilter("Brightness", { value: parseFloat(e.target.value) })}
          className="w-full"
        />
      </div>
      <div>
        <label className="flex items-center justify-between text-[10px] text-gray-400">
          <span>Contrast</span>
          <span>{Math.round(getFilterValue("Contrast") * 100)}</span>
        </label>
        <input
          type="range" min={-0.5} max={0.5} step={0.05}
          value={getFilterValue("Contrast")}
          onChange={(e) => applyFilter("Contrast", { value: parseFloat(e.target.value) })}
          className="w-full"
        />
      </div>
      <div>
        <label className="flex items-center justify-between text-[10px] text-gray-400">
          <span>Saturation</span>
          <span>{Math.round(getFilterValue("Saturation") * 100)}</span>
        </label>
        <input
          type="range" min={-1} max={1} step={0.1}
          value={getFilterValue("Saturation")}
          onChange={(e) => applyFilter("Saturation", { value: parseFloat(e.target.value) })}
          className="w-full"
        />
      </div>
      <div>
        <label className="flex items-center justify-between text-[10px] text-gray-400">
          <span>Blur</span>
          <span>{Math.round(getFilterValue("Blur") * 100)}</span>
        </label>
        <input
          type="range" min={0} max={0.5} step={0.02}
          value={getFilterValue("Blur")}
          onChange={(e) => applyFilter("Blur", { value: parseFloat(e.target.value) })}
          className="w-full"
        />
      </div>
      <label className="flex items-center gap-2 text-xs text-gray-600">
        <input
          type="checkbox"
          checked={getFilterValue("Grayscale")}
          onChange={(e) => applyFilter("Grayscale", { enabled: e.target.checked })}
          className="rounded"
        />
        Grayscale
      </label>
    </div>
  );
}

function DpiDisplay({ obj, productSpec }) {
  if (!obj || !productSpec) return <span className="text-xs text-gray-400">N/A</span>;

  const imgWidth = obj.width || 0;
  const imgHeight = obj.height || 0;
  const scaleX = obj.scaleX || 1;
  const scaleY = obj.scaleY || 1;

  // Displayed size in canvas pixels
  const displayW = imgWidth * scaleX;
  const displayH = imgHeight * scaleY;

  // Convert to inches using spec DPI
  const widthInches = displayW / productSpec.dpi;
  const heightInches = displayH / productSpec.dpi;

  // Effective DPI
  const effectiveDpiX = widthInches > 0 ? imgWidth / widthInches : 0;
  const effectiveDpiY = heightInches > 0 ? imgHeight / heightInches : 0;
  const effectiveDpi = Math.round(Math.min(effectiveDpiX, effectiveDpiY));

  const isLow = effectiveDpi < productSpec.dpi;
  const isCritical = effectiveDpi < productSpec.dpi * 0.5;

  return (
    <div
      className={`rounded px-2 py-1 text-sm font-medium ${
        isCritical
          ? "bg-red-50 text-red-600"
          : isLow
          ? "bg-amber-50 text-amber-600"
          : "bg-green-50 text-green-600"
      }`}
    >
      {effectiveDpi} DPI
      {isCritical && <span className="ml-1 text-xs">(too low!)</span>}
      {isLow && !isCritical && <span className="ml-1 text-xs">(low)</span>}
    </div>
  );
}
