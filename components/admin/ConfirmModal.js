"use client";

import { useRef, useEffect } from "react";

export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  onConfirm,
  onCancel,
}) {
  const btnRef = useRef(null);

  useEffect(() => {
    if (open) setTimeout(() => btnRef.current?.focus(), 50);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e) {
      if (e.key === "Escape") onCancel?.();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  const btnColor =
    variant === "danger"
      ? "bg-red-600 hover:bg-red-700 focus:ring-red-500 text-white"
      : "bg-gray-900 hover:bg-black focus:ring-gray-500 text-white";

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} aria-label="Close" />
      <div className="relative w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-desc">
        <div className={`mx-auto flex h-10 w-10 items-center justify-center rounded-full ${variant === "danger" ? "bg-red-100" : "bg-blue-100"}`}>
          {variant === "danger" ? (
            <svg className="h-5 w-5 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          ) : (
            <svg className="h-5 w-5 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
            </svg>
          )}
        </div>
        <h3 id="confirm-title" className="mt-4 text-center text-sm font-semibold text-gray-900">{title}</h3>
        <p id="confirm-desc" className="mt-2 text-center text-sm text-gray-600">{message}</p>
        <div className="mt-5 flex gap-2">
          <button type="button" onClick={onCancel} className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300">
            {cancelLabel}
          </button>
          <button ref={btnRef} type="button" onClick={onConfirm} className={`flex-1 rounded-lg px-4 py-2.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 ${btnColor}`}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
