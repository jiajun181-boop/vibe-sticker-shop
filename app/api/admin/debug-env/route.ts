import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/admin-auth";

/**
 * GET /api/admin/debug-env — Check env vars and test UploadThing token parsing.
 */
export async function GET(request: NextRequest) {
  const auth = await requirePermission(request, "media", "view");
  if (!auth.authenticated) return auth.response;

  const token = process.env.UPLOADTHING_TOKEN || "";
  let tokenStatus = "missing";
  let tokenDecoded = null;
  let reencodeChanges = false;
  let effectParseResult = "not tested";

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

      // Check if re-encoding changes the token
      const clean = Buffer.from(
        Buffer.from(token, "base64").toString("utf-8")
      ).toString("base64");
      reencodeChanges = clean !== token;

      // Test if UTApi can actually parse the token
      try {
        const { UTApi } = await import("uploadthing/server");
        // Try with clean token
        process.env.UPLOADTHING_TOKEN = clean;
        const utapi = new UTApi();
        // Force token resolution by listing files (lightweight)
        await utapi.listFiles({ limit: 1 });
        effectParseResult = "ok";
      } catch (e) {
        effectParseResult =
          e instanceof Error ? e.message.slice(0, 200) : String(e).slice(0, 200);
      } finally {
        // Restore original
        process.env.UPLOADTHING_TOKEN = token;
      }
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
    reencodeChanges,
    effectParseResult,
    uploadthingUrl: process.env.UPLOADTHING_URL || "not set",
    hasVercelEnv: !!process.env.VERCEL,
    vercelEnv: process.env.VERCEL_ENV || "not set",
  });
}
