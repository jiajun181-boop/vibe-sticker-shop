// lib/stampTemplates.js
// Pre-configured stamp text templates for quick start.

export const STAMP_TEMPLATES = [
  // Business
  { id: "paid", cat: "business", label: "PAID", text: "PAID", font: "Helvetica", color: "#DC2626" },
  { id: "copy", cat: "business", label: "COPY", text: "COPY", font: "Arial", color: "#2563EB" },
  { id: "urgent", cat: "business", label: "URGENT", text: "URGENT\nACTION REQUIRED", font: "Helvetica", color: "#DC2626" },
  { id: "received", cat: "business", label: "RECEIVED", text: "RECEIVED\n__/__/____", font: "Arial", color: "#2563EB" },
  { id: "approved", cat: "business", label: "APPROVED", text: "APPROVED", font: "Helvetica", color: "#16A34A" },
  { id: "confidential", cat: "business", label: "CONFIDENTIAL", text: "CONFIDENTIAL", font: "Helvetica", color: "#DC2626" },
  // Address
  { id: "return-addr", cat: "address", label: "Return Address", text: "YOUR NAME\n123 Main St\nToronto ON M5H 2N2", font: "Helvetica", color: "#111111" },
  { id: "holiday", cat: "address", label: "Holiday Card", text: "The Smith Family\n123 Maple Ave\nOttawa ON K1A 0A6", font: "Arial", color: "#111111" },
  // Signature / Seal
  { id: "signature", cat: "signature", label: "Company Seal", text: "YOUR COMPANY\n★ EST. 2024 ★", font: "Helvetica", color: "#1E40AF", curve: 60 },
  { id: "certified", cat: "signature", label: "Certified", text: "CERTIFIED\nAPPROVED", font: "Arial", color: "#111111", curve: 50 },
];

export const STAMP_TEMPLATE_CATEGORIES = ["business", "address", "signature"];

export const INK_COLORS = [
  { id: "black", hex: "#111111", labelKey: "stamp.inkBlack" },
  { id: "red", hex: "#DC2626", labelKey: "stamp.inkRed" },
  { id: "blue", hex: "#2563EB", labelKey: "stamp.inkBlue" },
  { id: "green", hex: "#16A34A", labelKey: "stamp.inkGreen" },
  { id: "purple", hex: "#7C3AED", labelKey: "stamp.inkPurple" },
];
