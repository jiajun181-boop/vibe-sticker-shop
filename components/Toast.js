"use client";

import { Toaster as HotToaster, toast } from "react-hot-toast";

export function Toaster() {
  return (
    <HotToaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: "#1f2937",
          color: "#fff",
          borderRadius: "8px",
          padding: "12px 20px",
        },
        success: {
          iconTheme: {
            primary: "#10b981",
            secondary: "#fff",
          },
        },
        error: {
          iconTheme: {
            primary: "#ef4444",
            secondary: "#fff",
          },
        },
      }}
    />
  );
}

export default function Toast() {
  return <Toaster />;
}

export const showSuccessToast = (message, options = {}) => toast.success(message, { ...options });
export const showErrorToast = (message, options = {}) => toast.error(message, { ...options });
export const showInfoToast = (message, options = {}) => toast(message, { icon: "i", ...options });
export const showLoadingToast = (message) => toast.loading(message);
export const dismissToast = (toastId) => toast.dismiss(toastId);
