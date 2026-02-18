import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";

/**
 * POST /api/editor/render
 * Accepts a design template JSON and returns status.
 * The actual high-res rendering happens client-side via canvas.
 * This endpoint is reserved for future server-side rendering with UploadThing upload.
 */
export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req as any);

  try {
    const body = await req.json();
    const { template, product } = body;

    if (!template || !template.canvas || !template.elements) {
      return NextResponse.json({ error: "Invalid template data" }, { status: 400 });
    }

    // For now, return success — client handles the actual render
    // In the future, this can use a headless canvas library (e.g., node-canvas)
    // to render server-side and upload to UploadThing
    return NextResponse.json({
      status: "client-render",
      message: "Use client-side export for high-res output",
      product,
      userId: session?.userId || null,
    });
  } catch (err) {
    console.error("[EditorRender] Error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
