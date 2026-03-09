import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createRateLimiter, getClientIp } from "@/lib/rate-limit";

const SaveContourSchema = z.object({
  productSlug: z.string().min(1),
  originalFileUrl: z.string().url().optional().nullable(),
  originalFileKey: z.string().optional().nullable(),
  processedImageUrl: z.string().url().optional().nullable(),
  contourSvg: z.string().optional().nullable(),
  bleedSvg: z.string().optional().nullable(),
  bleedMm: z.number().min(0).max(20).optional().nullable(),
  bgRemoved: z.boolean().optional(),
  customerConfirmed: z.boolean().optional(),
});

const proofLimiter = createRateLimiter({ windowMs: 60_000, max: 10 }); // 10 per minute

/**
 * POST /api/proof — Save contour/proof data server-side before checkout.
 * Returns { id } which the client includes in cart metadata as proofDataId.
 */
export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const { success } = proofLimiter.check(ip);
    if (!success) {
      return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
    }

    const body = await request.json();
    const data = SaveContourSchema.parse(body);

    const proofData = await prisma.proofData.create({
      data: {
        productSlug: data.productSlug,
        originalFileUrl: data.originalFileUrl || null,
        originalFileKey: data.originalFileKey || null,
        processedImageUrl: data.processedImageUrl || null,
        contourSvg: data.contourSvg || null,
        bleedSvg: data.bleedSvg || null,
        bleedMm: data.bleedMm ?? null,
        bgRemoved: data.bgRemoved ?? false,
        customerConfirmed: data.customerConfirmed ?? false,
        confirmedAt: data.customerConfirmed ? new Date() : null,
        expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48h TTL
      },
    });

    return NextResponse.json({ id: proofData.id });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid proof data", details: err.errors },
        { status: 400 }
      );
    }
    console.error("[Proof API] Error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
