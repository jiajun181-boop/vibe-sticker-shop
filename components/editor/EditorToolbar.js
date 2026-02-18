"use client";

export default function EditorToolbar({ onAddText, onUndo, onRedo, onExport, canUndo, canRedo, exporting }) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2">
      <button
        onClick={onAddText}
        className="rounded-md bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200"
      >
        + Text
      </button>

      <div className="h-5 w-px bg-gray-200" />

      <button
        onClick={onUndo}
        disabled={!canUndo}
        className="rounded-md px-2 py-1.5 text-xs text-gray-500 hover:bg-gray-100 disabled:opacity-30"
        title="Undo"
      >
        Undo
      </button>
      <button
        onClick={onRedo}
        disabled={!canRedo}
        className="rounded-md px-2 py-1.5 text-xs text-gray-500 hover:bg-gray-100 disabled:opacity-30"
        title="Redo"
      >
        Redo
      </button>

      <div className="flex-1" />

      <button
        onClick={onExport}
        disabled={exporting}
        className="rounded-lg bg-gray-900 px-4 py-1.5 text-xs font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
      >
        {exporting ? "Exporting..." : "Export High-Res PNG"}
      </button>
    </div>
  );
}
