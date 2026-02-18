import crypto from "crypto";
import { prisma } from "./prisma";

/**
 * Generate a new API key.
 * Returns the raw key (only shown once) and the hash for storage.
 */
export function generateApiKey(): { rawKey: string; keyHash: string; keyPrefix: string } {
  const raw = `lp_live_${crypto.randomBytes(24).toString("hex")}`;
  const keyHash = crypto.createHash("sha256").update(raw).digest("hex");
  const keyPrefix = raw.slice(0, 12);
  return { rawKey: raw, keyHash, keyPrefix };
}

/**
 * Authenticate a request using an API key from the Authorization header.
 * Returns the user associated with the key, or null.
 */
export async function authenticateApiKey(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.slice(7);
  if (!token.startsWith("lp_live_")) return null;

  const keyHash = crypto.createHash("sha256").update(token).digest("hex");

  const apiKey = await prisma.apiKey.findUnique({
    where: { keyHash },
    include: { user: { select: { id: true, email: true, accountType: true, b2bApproved: true } } },
  });

  if (!apiKey || !apiKey.isActive) return null;

  // Update last used
  await prisma.apiKey.update({
    where: { id: apiKey.id },
    data: { lastUsedAt: new Date() },
  }).catch(() => {});

  return apiKey.user;
}
