import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/admin-auth";

/**
 * GET /api/admin/debug-env — Check if critical env vars are set (admin only).
 * Does NOT expose actual values — only presence and basic shape.
 */
export async function GET(request: NextRequest) {
  const auth = await requirePermission(request, "media", "view");
  if (!auth.authenticated) return auth.response;

  const token = process.env.UPLOADTHING_TOKEN || "";
  let tokenStatus = "missing";
  let tokenDecoded = null;

  if (token) {
    try {
      const decoded = JSON.parse(Buffer.from(token, "base64").toString());
      tokenStatus = "valid";
      tokenDecoded = {
        hasApiKey: !!decoded.apiKey,
        apiKeyPrefix: decoded.apiKey?.slice(0, 8) + "...",
        appId: decoded.appId,
        regions: decoded.regions,
      };
    } catch {
      tokenStatus = "malformed";
      tokenDecoded = {
        length: token.length,
        first10: token.slice(0, 10),
        last10: token.slice(-10),
        hasWhitespace: /\s/.test(token),
      };
    }
  }

  return NextResponse.json({
    env: process.env.NODE_ENV,
    uploadthingToken: tokenStatus,
    tokenDetails: tokenDecoded,
    uploadthingUrl: process.env.UPLOADTHING_URL || "not set",
    hasVercelEnv: !!process.env.VERCEL,
    vercelEnv: process.env.VERCEL_ENV || "not set",
  });
}
