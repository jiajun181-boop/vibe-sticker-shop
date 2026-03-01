// lib/design-studio/upload-snapshot.js — Upload design snapshots to server

/**
 * Upload a design snapshot blob to the server.
 * @param {Blob} blob - PNG or PDF blob
 * @param {string} fileName - e.g., "design-preview.png"
 * @returns {Promise<{ url: string, key: string }>}
 */
export async function uploadDesignSnapshot(blob, fileName) {
  const formData = new FormData();
  formData.append("file", blob, fileName);

  const res = await fetch("/api/design-studio/upload-snapshot", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "Upload failed");
    throw new Error(text);
  }

  return res.json();
}
