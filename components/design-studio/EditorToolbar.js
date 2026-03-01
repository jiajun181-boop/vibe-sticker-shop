"use client";

import { useEditorStore } from "@/lib/design-studio/editor-store";

export default function EditorToolbar({ productSpec, onApprove }) {
  const {
    undoStack,
    redoStack,
    undo,
    redo,
    zoom,
    showGuides,
    toggleGuides,
  } = useEditorStore();

  return (
    <div className="flex h-12 items-center justify-between border-b border-gray-200 bg-white px-4">
      {/* Left: Product info */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-gray-800">
          {productSpec?.label || "Design Studio"}
        </span>
        {productSpec && (
          <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
            {productSpec.widthIn}" x {productSpec.heightIn}"
          </span>
        )}
      </div>

      {/* Center: Tools */}
      <div className="flex items-center gap-1">
        {/* Undo */}
        <button
          onClick={() => {
            const prev = undo();
            if (prev) {
              // Canvas will be restored via store subscription
              window.dispatchEvent(
                new CustomEvent("design-studio:restore", { detail: prev })
              );
            }
          }}
          disabled={undoStack.length === 0}
          className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-30 disabled:hover:bg-transparent"
          title="Undo (Ctrl+Z)"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
          </svg>
        </button>

        {/* Redo */}
        <button
          onClick={() => {
            const next = redo();
            if (next) {
              window.dispatchEvent(
                new CustomEvent("design-studio:restore", { detail: next })
              );
            }
          }}
          disabled={redoStack.length === 0}
          className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-30 disabled:hover:bg-transparent"
          title="Redo (Ctrl+Y)"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l6-6m0 0l-6-6m6 6H9a6 6 0 000 12h3" />
          </svg>
        </button>

        <div className="mx-2 h-5 w-px bg-gray-200" />

        {/* Zoom display */}
        <span className="min-w-[3rem] text-center text-xs font-medium text-gray-500">
          {Math.round(zoom * 100)}%
        </span>

        <div className="mx-2 h-5 w-px bg-gray-200" />

        {/* Print guides toggle */}
        <button
          onClick={toggleGuides}
          className={`flex items-center gap-1.5 rounded px-2 py-1 text-xs font-medium transition-colors ${
            showGuides
              ? "bg-blue-50 text-blue-600"
              : "text-gray-500 hover:bg-gray-100"
          }`}
          title="Toggle print guides"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
          </svg>
          Guides
        </button>
      </div>

      {/* Right: Approve button */}
      <div className="flex items-center gap-2">
        <button
          onClick={onApprove}
          className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Approve for Production
        </button>
      </div>
    </div>
  );
}
