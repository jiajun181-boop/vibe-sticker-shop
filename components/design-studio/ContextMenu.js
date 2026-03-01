"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useEditorStore } from "@/lib/design-studio/editor-store";

/**
 * Right-click context menu for canvas objects.
 * Provides quick access to common actions: copy, paste, duplicate,
 * bring to front, send to back, lock, delete.
 */
export default function ContextMenu({ fabricRef }) {
  const [menu, setMenu] = useState(null); // { x, y, target }
  const menuRef = useRef(null);
  const clipboardRef = useRef(null);
  const { pushUndo, setCanvasJSON } = useEditorStore();

  const getCanvas = () => fabricRef?.current;

  const saveState = useCallback(() => {
    const canvas = getCanvas();
    if (!canvas) return;
    const json = canvas.toJSON(["id", "selectable", "evented", "excludeFromExport"]);
    pushUndo(useEditorStore.getState().canvasJSON);
    setCanvasJSON(json);
  }, [pushUndo, setCanvasJSON]);

  // Show context menu on right-click
  useEffect(() => {
    const canvas = getCanvas();
    if (!canvas) return;

    const upperCanvas = canvas.upperCanvasEl || canvas.wrapperEl;
    if (!upperCanvas) return;

    const handleContextMenu = (e) => {
      e.preventDefault();
      e.stopPropagation();

      const rect = upperCanvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Check if right-clicked on an object
      const pointer = canvas.getScenePoint(e);
      const target = canvas.findTarget(e);

      if (target && !target.id?.startsWith("__guide_") && !target.id?.startsWith("__snap_")) {
        canvas.setActiveObject(target);
        canvas.requestRenderAll();
      }

      setMenu({
        x: e.clientX,
        y: e.clientY,
        hasTarget: !!target && !target.id?.startsWith("__guide_"),
        hasClipboard: !!clipboardRef.current,
      });
    };

    upperCanvas.addEventListener("contextmenu", handleContextMenu);
    return () => upperCanvas.removeEventListener("contextmenu", handleContextMenu);
  }, [fabricRef?.current]);

  // Close on click outside or Escape
  useEffect(() => {
    if (!menu) return;
    const close = () => setMenu(null);
    const handleEsc = (e) => { if (e.key === "Escape") close(); };
    window.addEventListener("click", close);
    window.addEventListener("keydown", handleEsc);
    return () => {
      window.removeEventListener("click", close);
      window.removeEventListener("keydown", handleEsc);
    };
  }, [menu]);

  // Keyboard shortcuts for copy/paste
  useEffect(() => {
    const handleKeyDown = (e) => {
      const canvas = getCanvas();
      if (!canvas) return;
      const active = canvas.getActiveObject();

      // Don't intercept when editing text
      if (active?.isEditing) return;

      // Ctrl+C / Cmd+C — Copy
      if ((e.ctrlKey || e.metaKey) && e.key === "c") {
        if (active && !active.id?.startsWith("__guide_")) {
          active.clone().then((cloned) => {
            clipboardRef.current = cloned;
          });
        }
      }

      // Ctrl+V / Cmd+V — Paste
      if ((e.ctrlKey || e.metaKey) && e.key === "v") {
        if (clipboardRef.current) {
          e.preventDefault();
          handlePaste();
        }
      }

      // Ctrl+D / Cmd+D — Duplicate
      if ((e.ctrlKey || e.metaKey) && e.key === "d") {
        if (active && !active.id?.startsWith("__guide_")) {
          e.preventDefault();
          handleDuplicate();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [fabricRef?.current]);

  const handleCopy = useCallback(() => {
    const canvas = getCanvas();
    const active = canvas?.getActiveObject();
    if (!active) return;
    active.clone().then((cloned) => {
      clipboardRef.current = cloned;
    });
    setMenu(null);
  }, []);

  const handlePaste = useCallback(() => {
    const canvas = getCanvas();
    if (!canvas || !clipboardRef.current) return;
    clipboardRef.current.clone().then((cloned) => {
      saveState();
      cloned.set({
        left: (cloned.left || 0) + 20,
        top: (cloned.top || 0) + 20,
        id: `${cloned.type?.toLowerCase() || "obj"}_${Date.now()}`,
      });
      canvas.add(cloned);
      canvas.setActiveObject(cloned);
      canvas.requestRenderAll();
      const json = canvas.toJSON(["id", "selectable", "evented", "excludeFromExport"]);
      useEditorStore.getState().setCanvasJSON(json);
    });
    setMenu(null);
  }, [saveState]);

  const handleDuplicate = useCallback(() => {
    const canvas = getCanvas();
    const active = canvas?.getActiveObject();
    if (!active) return;
    active.clone().then((cloned) => {
      saveState();
      cloned.set({
        left: (active.left || 0) + 20,
        top: (active.top || 0) + 20,
        id: `${cloned.type?.toLowerCase() || "obj"}_${Date.now()}`,
      });
      canvas.add(cloned);
      canvas.setActiveObject(cloned);
      canvas.requestRenderAll();
      const json = canvas.toJSON(["id", "selectable", "evented", "excludeFromExport"]);
      useEditorStore.getState().setCanvasJSON(json);
    });
    setMenu(null);
  }, [saveState]);

  const handleBringToFront = useCallback(() => {
    const canvas = getCanvas();
    const active = canvas?.getActiveObject();
    if (!active) return;
    saveState();
    canvas.bringObjectToFront(active);
    canvas.requestRenderAll();
    const json = canvas.toJSON(["id", "selectable", "evented", "excludeFromExport"]);
    useEditorStore.getState().setCanvasJSON(json);
    setMenu(null);
  }, [saveState]);

  const handleSendToBack = useCallback(() => {
    const canvas = getCanvas();
    const active = canvas?.getActiveObject();
    if (!active) return;
    saveState();
    canvas.sendObjectToBack(active);
    canvas.requestRenderAll();
    const json = canvas.toJSON(["id", "selectable", "evented", "excludeFromExport"]);
    useEditorStore.getState().setCanvasJSON(json);
    setMenu(null);
  }, [saveState]);

  const handleLock = useCallback(() => {
    const canvas = getCanvas();
    const active = canvas?.getActiveObject();
    if (!active) return;
    const locked = active.selectable;
    active.set({ selectable: !locked, evented: !locked });
    canvas.discardActiveObject();
    canvas.requestRenderAll();
    setMenu(null);
  }, []);

  const handleDelete = useCallback(() => {
    const canvas = getCanvas();
    const active = canvas?.getActiveObject();
    if (!active) return;
    saveState();
    canvas.remove(active);
    canvas.discardActiveObject();
    canvas.requestRenderAll();
    const json = canvas.toJSON(["id", "selectable", "evented", "excludeFromExport"]);
    useEditorStore.getState().setCanvasJSON(json);
    setMenu(null);
  }, [saveState]);

  if (!menu) return null;

  const items = [];

  if (menu.hasTarget) {
    items.push(
      { label: "Copy", shortcut: "Ctrl+C", action: handleCopy },
      { label: "Duplicate", shortcut: "Ctrl+D", action: handleDuplicate },
      { divider: true },
      { label: "Bring to Front", action: handleBringToFront },
      { label: "Send to Back", action: handleSendToBack },
      { divider: true },
      { label: "Lock / Unlock", action: handleLock },
      { label: "Delete", shortcut: "Del", action: handleDelete, danger: true },
    );
  }

  if (menu.hasClipboard) {
    if (menu.hasTarget) {
      // Insert paste after copy
      items.splice(1, 0, { label: "Paste", shortcut: "Ctrl+V", action: handlePaste });
    } else {
      items.push({ label: "Paste", shortcut: "Ctrl+V", action: handlePaste });
    }
  }

  if (items.length === 0) return null;

  return (
    <div
      ref={menuRef}
      className="fixed z-[100] min-w-[180px] rounded-lg border border-gray-200 bg-white py-1 shadow-xl"
      style={{ left: menu.x, top: menu.y }}
      onClick={(e) => e.stopPropagation()}
    >
      {items.map((item, i) =>
        item.divider ? (
          <div key={i} className="my-1 border-t border-gray-100" />
        ) : (
          <button
            key={i}
            onClick={item.action}
            className={`flex w-full items-center justify-between px-3 py-1.5 text-sm transition-colors ${
              item.danger
                ? "text-red-600 hover:bg-red-50"
                : "text-gray-700 hover:bg-gray-50"
            }`}
          >
            <span>{item.label}</span>
            {item.shortcut && (
              <span className="ml-4 text-[10px] text-gray-400">{item.shortcut}</span>
            )}
          </button>
        )
      )}
    </div>
  );
}
