"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { uploadDesignSnapshot } from "@/lib/design-studio/upload-snapshot";

const STATUS_FILTERS = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "revised", label: "Revised" },
];

const STATUS_COLORS = {
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  revised: "bg-blue-100 text-blue-700",
};

function isPdf(jobOrProof) {
  const type = jobOrProof?.outputData?.fileType || jobOrProof?.fileName || "";
  return String(type).toLowerCase().includes("pdf");
}

export default function ProofManagerPage() {
  const [proofs, setProofs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("all");
  const [preview, setPreview] = useState(null);
  const [standaloneModal, setStandaloneModal] = useState(false);
  const [standaloneData, setStandaloneData] = useState({
    customerName: "",
    customerEmail: "",
    description: "",
    notes: "",
    file: null,
  });
  const [standaloneSaving, setStandaloneSaving] = useState(false);
  const [standaloneJobs, setStandaloneJobs] = useState([]);

  const fetchProofs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "50" });
      if (status !== "all") params.set("status", status);
      const res = await fetch(`/api/admin/proofs?${params}`);
      if (res.ok) {
        const data = await res.json();
        setProofs(data.proofs || []);
      }
    } catch {
      // Ignore admin proof listing errors for now.
    } finally {
      setLoading(false);
    }
  }, [status]);

  const fetchStandaloneJobs = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/tools/jobs?toolType=proof&limit=10");
      if (res.ok) {
        const data = await res.json();
        setStandaloneJobs(data.jobs || []);
      }
    } catch {
      // Ignore fetch errors.
    }
  }, []);

  useEffect(() => {
    fetchProofs();
  }, [fetchProofs]);

  useEffect(() => {
    fetchStandaloneJobs();
  }, [fetchStandaloneJobs]);

  async function handleStandaloneSave() {
    if (!standaloneData.file) return;

    setStandaloneSaving(true);
    try {
      const uploaded = await uploadDesignSnapshot(
        standaloneData.file,
        standaloneData.file.name || `proof-${Date.now()}`
      );

      const res = await fetch("/api/admin/tools/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toolType: "proof",
          inputData: {
            customerName: standaloneData.customerName || null,
            customerEmail: standaloneData.customerEmail || null,
            description: standaloneData.description || null,
            originalFileName: standaloneData.file.name || null,
          },
          outputFileUrl: uploaded.url,
          outputFileKey: uploaded.key,
          outputData: {
            fileName: standaloneData.file.name || null,
            fileType: standaloneData.file.type || null,
          },
          notes: standaloneData.notes || null,
          status: "completed",
        }),
      });
      if (!res.ok) throw new Error("Failed to save standalone proof");

      setStandaloneModal(false);
      setStandaloneData({
        customerName: "",
        customerEmail: "",
        description: "",
        notes: "",
        file: null,
      });
      fetchStandaloneJobs();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setStandaloneSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-black">Proof Manager</h1>
          <p className="mt-1 text-sm text-[#666]">Manage order proofs and create proof records for offline customers.</p>
        </div>
        <button
          type="button"
          onClick={() => setStandaloneModal(true)}
          className="inline-flex items-center gap-2 rounded-[3px] bg-black px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#222]"
        >
          Standalone Proof
        </button>
      </div>

      <div className="flex gap-1.5 overflow-x-auto">
        {STATUS_FILTERS.map((filter) => (
          <button
            key={filter.value}
            type="button"
            onClick={() => setStatus(filter.value)}
            className={`shrink-0 rounded-[3px] px-3 py-1.5 text-xs font-semibold transition-colors ${
              status === filter.value
                ? "bg-black text-white"
                : "border border-[#e0e0e0] bg-white text-[#666] hover:border-black"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-12 text-center text-sm text-[#999]">Loading proofs...</div>
      ) : proofs.length === 0 ? (
        <div className="py-12 text-center text-sm text-[#999]">No proofs found</div>
      ) : (
        <div className="space-y-3">
          {proofs.map((proof) => (
            <div key={proof.id} className="rounded-[3px] border border-[#e0e0e0] bg-white p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setPreview({ url: proof.imageUrl, fileName: proof.fileName })}
                    className="h-16 w-16 shrink-0 overflow-hidden rounded-[3px] border border-[#e0e0e0] bg-[#fafafa] transition-opacity hover:opacity-80"
                  >
                    <img src={proof.imageUrl} alt="Proof" className="h-full w-full object-cover" />
                  </button>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-black">Proof v{proof.version}</p>
                      <span className={`rounded-[2px] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${STATUS_COLORS[proof.status] || "bg-gray-100 text-gray-700"}`}>
                        {proof.status}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-[#999]">
                      {proof.order?.customerEmail || "-"} · {new Date(proof.createdAt).toLocaleDateString()}
                      {proof.uploadedBy ? <span> · by {proof.uploadedBy}</span> : null}
                    </p>
                    {proof.notes ? <p className="mt-1 text-xs text-[#777]">{proof.notes}</p> : null}
                    {proof.customerComment ? <p className="mt-1 text-xs italic text-[#555]">"{proof.customerComment}"</p> : null}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/admin/orders/${proof.orderId}`}
                    className="inline-flex items-center gap-1 rounded-[3px] border border-[#e0e0e0] px-3 py-1.5 text-xs font-medium text-[#666] transition-colors hover:border-black hover:text-black"
                  >
                    View Order
                  </Link>
                  <a
                    href={proof.imageUrl}
                    download
                    className="inline-flex items-center gap-1 rounded-[3px] border border-[#e0e0e0] px-3 py-1.5 text-xs font-medium text-[#666] transition-colors hover:border-black hover:text-black"
                  >
                    Download
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {standaloneJobs.length > 0 ? (
        <div className="rounded-[3px] border border-[#e0e0e0] bg-white">
          <div className="border-b border-[#e0e0e0] px-5 py-3">
            <h2 className="text-sm font-bold text-black">Standalone Proof Records</h2>
            <p className="text-[10px] text-[#999]">For walk-ins and phone orders not linked to an order record yet.</p>
          </div>
          <div className="divide-y divide-[#e0e0e0]">
            {standaloneJobs.map((job) => (
              <div key={job.id} className="flex flex-col gap-3 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-black">
                    {job.inputData?.customerName || job.inputData?.customerEmail || "Unnamed"} {job.operatorName ? `· ${job.operatorName}` : ""}
                  </p>
                  <p className="text-xs text-[#999]">
                    {new Date(job.createdAt).toLocaleDateString()}
                    {job.inputData?.description ? <span> · {job.inputData.description}</span> : null}
                  </p>
                  {job.notes ? <p className="mt-0.5 truncate text-xs text-[#777]">{job.notes}</p> : null}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {job.outputFileUrl ? (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          setPreview({
                            url: job.outputFileUrl,
                            fileName: job.outputData?.fileName || null,
                            pdf: isPdf(job),
                          })
                        }
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
                  <span className="rounded-[2px] bg-green-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-green-700">
                    {job.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {preview ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70" onClick={() => setPreview(null)}>
          <div className="relative max-h-[90vh] max-w-[90vw] rounded-[3px] bg-white p-3 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setPreview(null)}
              className="absolute -right-3 -top-3 rounded-full bg-white p-1.5 shadow-lg hover:bg-[#f5f5f5]"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            {preview.pdf ? (
              <iframe src={preview.url} title="Proof preview" className="h-[80vh] w-[80vw] rounded-[3px]" />
            ) : (
              <img src={preview.url} alt="Proof preview" className="max-h-[85vh] max-w-[85vw] rounded-[3px]" />
            )}
          </div>
        </div>
      ) : null}

      {standaloneModal ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50" onClick={(e) => {
          if (e.target === e.currentTarget) setStandaloneModal(false);
        }}>
          <div className="mx-4 w-full max-w-md rounded-[3px] bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-sm font-bold text-black">Create Standalone Proof Record</h3>
            <p className="mb-4 text-xs text-[#999]">Upload the proof file used for a walk-in or phone order.</p>

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-[11px] font-medium text-[#666]">Customer Name</label>
                <input
                  type="text"
                  value={standaloneData.customerName}
                  onChange={(e) => setStandaloneData((prev) => ({ ...prev, customerName: e.target.value }))}
                  className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-black"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-[#666]">Customer Email</label>
                <input
                  type="email"
                  value={standaloneData.customerEmail}
                  onChange={(e) => setStandaloneData((prev) => ({ ...prev, customerEmail: e.target.value }))}
                  className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-black"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-[#666]">Description</label>
                <input
                  type="text"
                  value={standaloneData.description}
                  onChange={(e) => setStandaloneData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="e.g. Business card proof for walk-in customer"
                  className="w-full rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-black"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-[#666]">Proof File</label>
                <input
                  type="file"
                  accept="image/*,.pdf,application/pdf"
                  onChange={(e) => setStandaloneData((prev) => ({ ...prev, file: e.target.files?.[0] || null }))}
                  className="block w-full text-sm text-[#666] file:mr-3 file:rounded-[3px] file:border-0 file:bg-black file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white"
                />
                {standaloneData.file ? (
                  <p className="mt-1 text-[10px] text-[#999]">{standaloneData.file.name}</p>
                ) : null}
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-[#666]">Notes</label>
                <textarea
                  rows={2}
                  value={standaloneData.notes}
                  onChange={(e) => setStandaloneData((prev) => ({ ...prev, notes: e.target.value }))}
                  className="w-full resize-none rounded-[3px] border border-[#d0d0d0] px-3 py-2 text-sm outline-none focus:border-black"
                />
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={handleStandaloneSave}
                disabled={standaloneSaving || !standaloneData.file}
                className="flex-1 rounded-[3px] bg-black py-2 text-xs font-semibold text-white hover:bg-[#222] disabled:opacity-50"
              >
                {standaloneSaving ? "Saving..." : "Create Record"}
              </button>
              <button
                type="button"
                onClick={() => setStandaloneModal(false)}
                className="rounded-[3px] border border-[#d0d0d0] px-4 py-2 text-xs font-medium text-[#666] hover:bg-[#fafafa]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
