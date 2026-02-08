"use client";

import { useEffect, useState } from "react";
import { useCartStore } from "@/lib/store";

const ICONS = {
  success: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  ),
  remove: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
    </svg>
  ),
  error: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
  ),
  info: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
    </svg>
  ),
};

const STYLES = {
  success: "bg-green-600 text-white",
  remove: "bg-gray-800 text-white",
  error: "bg-red-600 text-white",
  info: "bg-blue-600 text-white",
};

export default function Toast() {
  const toast = useCartStore((s) => s.toast);
  const dismissToast = useCartStore((s) => s.dismissToast);
  const openCart = useCartStore((s) => s.openCart);
  const undoRemove = useCartStore((s) => s.undoRemove);
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (toast) {
      setVisible(true);
    } else {
      setVisible(false);
    }
  }, [toast]);

  if (!mounted || !toast) return null;

  const handleAction = () => {
    if (toast.action?.fn === "openCart") openCart();
    if (toast.action?.fn === "undoRemove") undoRemove();
    dismissToast();
  };

  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] transition-all duration-300 ${
        visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
      }`}
    >
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl ${STYLES[toast.type] || STYLES.info} min-w-[280px] max-w-[420px]`}>
        {/* Icon */}
        <div className="flex-shrink-0 opacity-80">
          {ICONS[toast.type] || ICONS.info}
        </div>

        {/* Message */}
        <p className="text-sm font-medium flex-1">{toast.message}</p>

        {/* Action button */}
        {toast.action && (
          <button
            onClick={handleAction}
            className="text-xs font-black uppercase tracking-wider bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
          >
            {toast.action.label}
          </button>
        )}

        {/* Dismiss */}
        <button
          onClick={dismissToast}
          className="text-white/50 hover:text-white transition-colors flex-shrink-0 ml-1"
          aria-label="Dismiss"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
