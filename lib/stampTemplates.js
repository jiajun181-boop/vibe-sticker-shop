// lib/stampTemplates.js
// Pre-configured stamp text templates for quick start.

export const STAMP_TEMPLATES = [
  // ── Business ──
  { id: "paid", cat: "business", label: "PAID", text: "PAID", font: "Bebas Neue", color: "#DC2626" },
  { id: "copy", cat: "business", label: "COPY", text: "COPY", font: "Oswald", color: "#2563EB" },
  { id: "urgent", cat: "business", label: "URGENT", text: "URGENT\nACTION REQUIRED", font: "Oswald", color: "#DC2626" },
  { id: "received", cat: "business", label: "RECEIVED", text: "RECEIVED\n__/__/____", font: "Inter", color: "#2563EB" },
  { id: "approved", cat: "business", label: "APPROVED", text: "APPROVED", font: "Rubik", color: "#16A34A" },
  { id: "confidential", cat: "business", label: "CONFIDENTIAL", text: "CONFIDENTIAL", font: "Bebas Neue", color: "#DC2626" },

  // ── Address ──
  { id: "return-addr", cat: "address", label: "Return Address", text: "YOUR NAME\n123 Main St\nToronto ON M5H 2N2", font: "Inter", color: "#111111" },
  { id: "holiday", cat: "address", label: "Holiday Card", text: "The Smith Family\n123 Maple Ave\nOttawa ON K1A 0A6", font: "Caveat", color: "#111111" },
  { id: "from-desk", cat: "address", label: "From the Desk of", text: "FROM THE DESK OF\nYOUR NAME", font: "Playfair Display", color: "#111111" },
  { id: "with-love", cat: "address", label: "With Love", text: "With Love\nFrom The Johnsons\n123 Maple Ave, Toronto", font: "Satisfy", color: "#111111" },

  // ── Seal ──
  { id: "company-seal", cat: "seal", label: "Company Seal", text: "YOUR COMPANY\n\u2605 ESTABLISHED \u2605\n2024", font: "Playfair Display", color: "#1E40AF", curve: 70, border: "double" },
  { id: "notary", cat: "seal", label: "Notary Public", text: "NOTARY PUBLIC\nPROVINCE OF ONTARIO\nYOUR NAME", font: "EB Garamond", color: "#111111", curve: 60, border: "thick-thin" },
  { id: "certified-seal", cat: "seal", label: "Certified", text: "CERTIFIED\n\u2713\nAPPROVED", font: "Oswald", color: "#16A34A", curve: 55, border: "double" },
  { id: "official", cat: "seal", label: "Official", text: "OFFICIAL\nDOCUMENT", font: "Bebas Neue", color: "#DC2626", curve: 50, border: "single" },
  { id: "corporate", cat: "seal", label: "Corporate", text: "ACME CORP\n\u2605 SINCE 1990 \u2605", font: "Rubik", color: "#111111", curve: 65, border: "star" },

  // ── Inspection / QC ──
  { id: "qc-pass", cat: "inspection", label: "QC Passed", text: "QC PASSED\n\u2713", font: "Oswald", color: "#16A34A" },
  { id: "qc-fail", cat: "inspection", label: "Rejected", text: "REJECTED\n\u2717", font: "Oswald", color: "#DC2626" },
  { id: "inspected", cat: "inspection", label: "Inspected By", text: "INSPECTED BY\n___________\nDATE: __/__/____", font: "Inter", color: "#111111" },
  { id: "void", cat: "inspection", label: "VOID", text: "VOID", font: "Bebas Neue", color: "#DC2626" },
  { id: "sample", cat: "inspection", label: "SAMPLE", text: "SAMPLE\nNOT FOR SALE", font: "Oswald", color: "#7C3AED" },
  { id: "draft", cat: "inspection", label: "DRAFT", text: "DRAFT", font: "Rubik", color: "#2563EB" },

  // ── Date ──
  { id: "received-date", cat: "date", label: "Received + Date", text: "RECEIVED\n__/__/____\nBY: ________", font: "Inter", color: "#2563EB" },
  { id: "due-date", cat: "date", label: "Due Date", text: "DUE DATE\n__/__/____", font: "Oswald", color: "#DC2626" },
  { id: "completed", cat: "date", label: "Completed", text: "COMPLETED\n__/__/____\nBY: ________", font: "Inter", color: "#16A34A" },
];

export const STAMP_TEMPLATE_CATEGORIES = ["business", "address", "seal", "inspection", "date"];

export const INK_COLORS = [
  { id: "black", hex: "#111111", labelKey: "stamp.inkBlack" },
  { id: "red", hex: "#DC2626", labelKey: "stamp.inkRed" },
  { id: "blue", hex: "#2563EB", labelKey: "stamp.inkBlue" },
  { id: "green", hex: "#16A34A", labelKey: "stamp.inkGreen" },
  { id: "purple", hex: "#7C3AED", labelKey: "stamp.inkPurple" },
];
