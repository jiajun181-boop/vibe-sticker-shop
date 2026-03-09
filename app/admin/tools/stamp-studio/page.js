"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";
import { uploadDesignSnapshot } from "@/lib/design-studio/upload-snapshot";

const StampEditor = dynamic(() => import("@/components/product/StampEditor"), { ssr: false });

const STAMP_MODELS = [
  { id: "round-40mm", label: "Colop R40 — Round 40mm", shape: "round", diameterIn: 1.57, sample: "LA LUNAR\nPRINTING\nSCARBOROUGH" },
  { id: "round-50mm", label: "Colop R50 — Round 50mm", shape: "round", diameterIn: 1.97, sample: "LA LUNAR\nPRINTING INC\nTORONTO, ON" },
  { id: "rect-47x18", label: "Trodat 4912 — 47x18mm", shape: "rect", widthIn: 1.85, heightIn: 0.71, sample: "LA LUNAR PRINTING" },
  { id: "rect-58x22", label: "Trodat 4913 — 58x22mm", shape: "rect", widthIn: 2.28, heightIn: 0.87, sample: "LA LUNAR PRINTING\n416-555-0100" },
  { id: "rect-70x30", label: "Trodat 4914 — 70x30mm", shape: "rect", widthIn: 2.76, heightIn: 1.18, sample: "LA LUNAR PRINTING INC\n123 Business St, Scarborough\nToronto, ON M1H 1A1\n416-555-0100" },
];

const QUICK_PRESETS = [
  { label: "Address Stamp", model: "rect-70x30", text: "YOUR NAME\n123 Street Address\nCity, Province A1B 2C3\nPhone: 416-555-0000" },
  { label: "Business Round", model: "round-50mm", text: "COMPANY\nNAME\nEST. 2024" },
  { label: "Return Address", model: "rect-58x22", text: "John Doe\n123 Main St, Toronto ON" },
  { label: "Signature Line", model: "rect-47x18", text: "APPROVED" },
  { label: "Date Received", model: "rect-47x18", text: "RECEIVED\n____________\nDATE" },
  { label: "Confidential", model: "rect-58x22", text: "CONFIDENTIAL\nDO NOT COPY" },
];

function formatJobTime(dateString) {
  const date = new Date(dateString);
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

export default function StampStudioPage() {
  return (
    <Suspense fallback={<div className="flex h-48 items-center justify-center text-sm text-[#999]">Loading...</div>}>
      <StampStudioContent />
    </Suspense>
  );
}

function StampStudioContent() {
  const searchParams = useSearchParams();
  const [modelId, setModelId] = useState(STAMP_MODELS[0].id);
  const [currentText, setCurrentText] = useState(STAMP_MODELS[0].sample);
  const [orderId, setOrderId] = useState(searchParams.get("orderId") || "");
  const [notes, setNotes] = useState("");
  const [stampConfig, setStampConfig] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [jobs, setJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [applyingToOrder, setApplyingToOrder] = useState(false);
  const [applyMsg, setApplyMsg] = useState("");
  const editorWrapRef = useRef(null);

  // --- Item selector state ---
  const [orderItems, setOrderItems] = useState([]);
  const [selectedItemId, setSelectedItemId] = useState("");
  const [fetchingOrder, setFetchingOrder] = useState(false);
  const [orderError, setOrderError] = useState("");

  const model = STAMP_MODELS.find((entry) => entry.id === modelId) || STAMP_MODELS[0];

  // --- Fetch jobs ---
  const fetchJobs = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/tools/jobs?toolType=stamp-studio&limit=10");
      if (res.ok) {
        const data = await res.json();
        setJobs(data.jobs || []);
      }
    } catch {
      // Ignore fetch errors on admin helper pages.
    } finally {
      setLoadingJobs(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // --- Fetch order items when orderId changes ---
  useEffect(() => {
    if (!orderId || orderId.length < 6) {
      setOrderItems([]);
      setSelectedItemId("");
      setOrderError("");
      return;
    }
    const timer = setTimeout(async () => {
      setFetchingOrder(true);
      setOrderError("");
      try {
        const res = await fetch(`/api/admin/orders/${orderId}`);
        if (!res.ok) {
          setOrderError("Order not found");
          setOrderItems([]);
          setSelectedItemId("");
          return;
        }
        const data = await res.json();
        const items = data.items || [];
        setOrderItems(items);
        if (items.length === 0) {
          setOrderError("Order has no items");
          setSelectedItemId("");
          return;
        }
        // Auto-select: prefer stamp item, else first
        const stampItem = items.find((it) => {
          const n = (it.productName || "").toLowerCase();
          return n.includes("stamp");
        });
        setSelectedItemId((stampItem || items[0]).id);
      } catch {
        setOrderError("Failed to fetch order");
        setOrderItems([]);
        setSelectedItemId("");
      } finally {
        setFetchingOrder(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [orderId]);

  // Auto-load stamp config from selected order item
  useEffect(() => {
    if (!selectedItemId || !orderItems.length) return;
    const item = orderItems.find((it) => it.id === selectedItemId);
    if (!item) return;
    const meta = item.meta && typeof item.meta === "object" ? item.meta : {};
    // If the order item has stamp text, pre-fill the editor
    if (meta.stampText || meta.text) {
      setCurrentText(meta.stampText || meta.text);
    }
    // If the order item specifies a stamp model, select it
    if (meta.stampModel && STAMP_MODELS.find((m) => m.id === meta.stampModel)) {
      setModelId(meta.stampModel);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedItemId]);

  // --- Model change (not from preset) ---
  function handleModelChange(newModelId) {
    setModelId(newModelId);
    const m = STAMP_MODELS.find((entry) => entry.id === newModelId) || STAMP_MODELS[0];
    setCurrentText(m.sample);
    setStampConfig({});
  }

  // --- Preset click ---
  function handlePresetClick(preset) {
    setModelId(preset.model);
    setCurrentText(preset.text);
    setStampConfig({});
  }

  // --- StampEditor onChange ---
  function handleEditorChange(patch) {
    setStampConfig((prev) => ({ ...prev, ...patch }));
    // If the editor fires a text change (e.g. from template selection), sync it
    if (patch.text !== undefined) {
      setCurrentText(patch.text);
    }
  }

  // --- Canvas export ---
  function getCanvas() {
    return editorWrapRef.current?.querySelector("canvas");
  }

  function exportCanvasBlob() {
    const canvas = getCanvas();
    if (!canvas) return Promise.resolve(null);
    return new Promise((resolve) => {
      canvas.toBlob(resolve, "image/png");
    });
  }

  // --- Download ---
  async function handleDownload() {
    const blob = await exportCanvasBlob();
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `stamp-${modelId}-${Date.now()}.png`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  // --- Apply to Order (with item selector) ---
  async function handleApplyToOrder() {
    if (!orderId || !selectedItemId) return;
    const targetItem = orderItems.find((it) => it.id === selectedItemId);
    if (!targetItem) return;

    setApplyingToOrder(true);
    setApplyMsg("");
    try {
      const blob = await exportCanvasBlob();
      if (!blob) throw new Error("Failed to export canvas");
      const fileName = `stamp-${modelId}-${Date.now()}.png`;
      const uploaded = await uploadDesignSnapshot(blob, fileName);

      const metaPatch = {
        stampPreviewUrl: uploaded.url,
        stampPreviewKey: uploaded.key,
        stampModel: modelId,
        stampAppliedAt: new Date().toISOString(),
        ...stampConfig,
      };

      const patchRes = await fetch(`/api/admin/orders/${orderId}/items`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: targetItem.id, meta: metaPatch }),
      });
      if (!patchRes.ok) {
        const err = await patchRes.json().catch(() => null);
        throw new Error(err?.error || "Failed to update item");
      }

      setApplyMsg(`Applied to "${targetItem.productName}"`);
      setTimeout(() => setApplyMsg(""), 5000);
    } catch (err) {
      setApplyMsg(`Error: ${err instanceof Error ? err.message : "Failed"}`);
    } finally {
      setApplyingToOrder(false);
    }
  }

  // --- Save to Records ---
  async function handleSave() {
    const blob = await exportCanvasBlob();
    if (!blob) return;

    setSaving(true);
    setSaveMsg("");

    try {
      const fileName = `stamp-${modelId}-${Date.now()}.png`;
      const uploaded = await uploadDesignSnapshot(blob, fileName);

      const res = await fetch("/api/admin/tools/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toolType: "stamp-studio",
          inputData: { model: modelId, text: currentText, ...stampConfig },
          outputFileUrl: uploaded.url,
          outputFileKey: uploaded.key,
          outputData: {
            fileName,
            shape: model.shape,
            widthIn: model.widthIn || null,
            heightIn: model.heightIn || null,
            diameterIn: model.diameterIn || null,
          },
          notes: notes || null,
          orderId: orderId || null,
          status: "completed",
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || "Failed to save stamp record");
      }

      setSaveMsg("Saved to records");
      fetchJobs();
      setTimeout(() => setSaveMsg(""), 4000);
    } catch (err) {
      setSaveMsg(`Error: ${err instanceof Error ? err.message : "Failed to save"}`);
    } finally {
      setSaving(false);
    }
  }

  // --- Reuse a previous job ---
  function handleReuseJob(job) {
    const inputData = job.inputData || {};
    if (inputData.model) {
      setModelId(inputData.model);
    }
    if (inputData.text) {
      setCurrentText(inputData.text);
    }
    if (job.orderId) {
      setOrderId(job.orderId);
    }
    if (job.notes) {
      setNotes(job.notes);
    }
    // Scroll to top
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const selectedItem = orderItems.find((it) => it.id === selectedItemId);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-black">Stamp Studio</h1>
        <p className="mt-1 text-sm text-[#666]">
          Create stamp artwork for walk-ins, phone orders, and internal production requests.
        </p>
      </div>

      {/* Quick Presets — prominent position, first thing staff sees */}
      <div className="rounded-[3px] border border-[#e0e0e0] bg-white p-4">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#999]">Quick Start — click a preset to begin</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {QUICK_PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => handlePresetClick(preset)}
              className={`rounded-[3px] border px-3 py-2 text-left transition-colors ${
                modelId === preset.model && currentText === preset.text
                  ? "border-black bg-black text-white"
                  : "border-[#d0d0d0] text-[#333] hover:border-black hover:bg-[#fafafa]"
              }`}
            >
              <span className="block text-xs font-semibold">{preset.label}</span>
              <span className="block mt-0.5 text-[10px] opacity-70 line-clamp-1">{preset.text.split("\n")[0]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Config row: Model + Order + Item selector */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-[11px] font-medium text-[#666]">Stamp Model</label>
          <select
            value={modelId}
            onChange={(e) => handleModelChange(e.target.value)}
            className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-black"
          >
            {STAMP_MODELS.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-medium text-[#666]">Order # (optional)</label>
          <input
            type="text"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            placeholder="Paste order ID to link"
            className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-black"
          />
          {fetchingOrder && <p className="mt-0.5 text-[10px] text-[#999]">Loading order...</p>}
          {orderError && <p className="mt-0.5 text-[10px] text-red-600">{orderError}</p>}
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-medium text-[#666]">
            Target Item {orderItems.length > 0 && <span className="text-[#999]">({orderItems.length} items)</span>}
          </label>
          {orderItems.length > 0 ? (
            <select
              value={selectedItemId}
              onChange={(e) => setSelectedItemId(e.target.value)}
              className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-black"
            >
              {orderItems.map((item) => {
                const isStamp = (item.productName || "").toLowerCase().includes("stamp");
                return (
                  <option key={item.id} value={item.id}>
                    {item.productName} ({item.quantity}×){isStamp ? " — recommended" : ""}
                  </option>
                );
              })}
            </select>
          ) : (
            <div className="rounded-[3px] border border-dashed border-[#d0d0d0] px-3 py-2 text-sm text-[#999]">
              {orderId ? "Enter a valid order ID" : "Enter order # to select item"}
            </div>
          )}
        </div>
      </div>

      {/* Text input — direct editing */}
      <div>
        <label className="mb-1 block text-[11px] font-medium text-[#666]">Stamp Text</label>
        <textarea
          rows={3}
          value={currentText}
          onChange={(e) => setCurrentText(e.target.value)}
          placeholder="Enter stamp text here — each line appears on a separate row"
          className="w-full resize-none rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm font-mono outline-none focus:border-black"
        />
        <p className="mt-0.5 text-[10px] text-[#999]">Use Enter/Return to add new lines. For round stamps, line 1 curves top, line 2 curves bottom, rest goes center.</p>
      </div>

      {/* Editor */}
      <div className="rounded-[3px] border border-[#e0e0e0] bg-white p-4 sm:p-6" ref={editorWrapRef}>
        <StampEditor
          key={modelId}
          shape={model.shape}
          widthIn={model.widthIn}
          heightIn={model.heightIn}
          diameterIn={model.diameterIn}
          text={currentText}
          hideInkColor
          onChange={handleEditorChange}
        />
      </div>

      {/* Notes */}
      <div>
        <label className="mb-1 block text-[11px] font-medium text-[#666]">Production Notes</label>
        <textarea
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Customer name, phone order ref, special requests..."
          className="w-full resize-none rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-black"
        />
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={handleDownload}
          className="inline-flex items-center justify-center gap-2 rounded-[3px] border border-[#e0e0e0] bg-white px-4 py-2.5 text-sm font-semibold text-black transition-colors hover:border-black"
        >
          Download PNG
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 rounded-[3px] bg-black px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#222] disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save to Records"}
        </button>
        {orderId && selectedItemId && selectedItem && (
          <button
            type="button"
            onClick={handleApplyToOrder}
            disabled={applyingToOrder}
            className="inline-flex items-center justify-center gap-2 rounded-[3px] border-2 border-blue-600 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-100 disabled:opacity-50"
            title={`Will write stamp data to: ${selectedItem.productName}`}
          >
            {applyingToOrder
              ? "Applying..."
              : `Apply to: ${selectedItem.productName.length > 25 ? selectedItem.productName.slice(0, 25) + "..." : selectedItem.productName}`}
          </button>
        )}
        {saveMsg ? (
          <span className={`text-xs font-medium ${saveMsg.startsWith("Error") ? "text-red-600" : "text-green-600"}`}>
            {saveMsg}
          </span>
        ) : null}
        {applyMsg ? (
          <span className={`text-xs font-medium ${applyMsg.startsWith("Error") ? "text-red-600" : "text-blue-600"}`}>
            {applyMsg}
          </span>
        ) : null}
      </div>

      {/* Recent Jobs */}
      <div className="rounded-[3px] border border-[#e0e0e0] bg-white">
        <div className="border-b border-[#e0e0e0] px-5 py-3">
          <h2 className="text-sm font-bold text-black">Recent Stamp Jobs</h2>
          <p className="mt-0.5 text-[10px] text-[#999]">Click &quot;Reuse&quot; to load a previous job back into the editor.</p>
        </div>
        {loadingJobs ? (
          <div className="px-5 py-8 text-center text-sm text-[#999]">Loading...</div>
        ) : jobs.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <p className="text-sm text-[#999]">No stamp jobs yet</p>
            <p className="mt-1 text-xs text-[#bbb]">Start by selecting a quick preset above, then save your first stamp.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#e0e0e0]">
            {jobs.map((job) => (
              <div key={job.id} className="flex flex-col gap-3 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-black">
                    {job.inputData?.model || "stamp"} {job.operatorName ? `· ${job.operatorName}` : ""}
                  </p>
                  <p className="text-xs text-[#999]">
                    {formatJobTime(job.createdAt)}
                    {job.orderId ? <span> · Order: {job.orderId.slice(0, 8)}...</span> : null}
                  </p>
                  {job.inputData?.text ? (
                    <p className="mt-0.5 truncate text-xs text-[#777]">{job.inputData.text.split("\n")[0]}</p>
                  ) : job.notes ? (
                    <p className="mt-0.5 truncate text-xs text-[#777]">{job.notes}</p>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                  <button
                    type="button"
                    onClick={() => handleReuseJob(job)}
                    className="rounded-[3px] border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100"
                  >
                    Reuse
                  </button>
                  {job.outputFileUrl ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setPreviewUrl(job.outputFileUrl)}
                        className="rounded-[3px] border border-[#e0e0e0] px-3 py-1.5 text-xs font-medium text-[#666] transition-colors hover:border-black hover:text-black"
                      >
                        Preview
                      </button>
                      <a
                        href={job.outputFileUrl}
                        download={job.outputData?.fileName || undefined}
                        className="rounded-[3px] border border-[#e0e0e0] px-3 py-1.5 text-xs font-medium text-[#666] transition-colors hover:border-black hover:text-black"
                      >
                        Download
                      </a>
                    </>
                  ) : null}
                  {job.orderId ? (
                    <Link
                      href={`/admin/orders/${job.orderId}`}
                      className="rounded-[3px] border border-[#e0e0e0] px-3 py-1.5 text-xs font-medium text-[#666] transition-colors hover:border-black hover:text-black"
                    >
                      View Order
                    </Link>
                  ) : null}
                  <span
                    className={`rounded-[2px] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      job.status === "completed" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {job.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {previewUrl ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70" onClick={() => setPreviewUrl(null)}>
          <div className="relative max-h-[90vh] max-w-[90vw]" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setPreviewUrl(null)}
              className="absolute -right-3 -top-3 rounded-full bg-white p-1.5 shadow-lg hover:bg-[#f5f5f5]"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img src={previewUrl} alt="Stamp preview" className="max-h-[85vh] max-w-[85vw] rounded-[3px] shadow-2xl" />
          </div>
        </div>
      ) : null}
    </div>
  );
}
