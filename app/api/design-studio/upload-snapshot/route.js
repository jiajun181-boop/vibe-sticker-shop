import { NextResponse } from "next/server";

const ALLOWED_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/pdf",
];

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string") {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type: ${file.type}. Allowed: ${ALLOWED_TYPES.join(", ")}` },
        { status: 400 }
      );
    }

    // Validate file size (32MB max for PDF, 16MB for images)
    const maxSize = file.type === "application/pdf" ? 32 * 1024 * 1024 : 16 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File too large. Max size: ${maxSize / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    // Upload via UploadThing server SDK
    const { UTApi, UTFile } = await import("uploadthing/server");
    const utapi = new UTApi();

    const buffer = await file.arrayBuffer();
    const utFile = new UTFile(
      [new Uint8Array(buffer)],
      file.name || "design-snapshot",
      { type: file.type }
    );

    const response = await utapi.uploadFiles(utFile);

    if (response.error) {
      console.error("[Design Studio Upload] UploadThing error:", response.error);
      return NextResponse.json(
        { error: "Upload failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      url: response.data.ufsUrl || response.data.url,
      key: response.data.key,
    });
  } catch (err) {
    console.error("[Design Studio Upload] Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
