// app/api/admin/pricing/b2b-rules/route.ts
// B2B price rule CRUD API.
// GET: list rules
// POST: create rule (with floor price enforcement)

import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/admin-auth";
import { createB2BRule, listB2BRules } from "@/lib/pricing/b2b-rules";
import { checkApprovalRequired } from "@/lib/pricing/pricing-permissions";
import { createApprovalRequest, gateWithApproval } from "@/lib/pricing/approval";
import { logPriceChange } from "@/lib/pricing/change-log";
import { checkFloorCompliance } from "@/lib/pricing/floor-enforcement";

export async function GET(request: NextRequest) {
  const auth = await requirePermission(request, "b2b", "view");
  if (!auth.authenticated) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") || undefined;
    const partnerTier = searchParams.get("partnerTier") || undefined;
    const page = Number(searchParams.get("page")) || 1;
    const limit = Number(searchParams.get("limit")) || 50;

    const isActiveParam = searchParams.get("isActive");
    const isActive = isActiveParam === "true" ? true : isActiveParam === "false" ? false : undefined;

    const result = await listB2BRules({ userId, partnerTier, isActive, page, limit });
    return NextResponse.json(result);
  } catch (err) {
    console.error("[b2b-rules] GET failed:", err);
    return NextResponse.json({ error: "Failed to list B2B rules" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requirePermission(request, "b2b", "edit");
  if (!auth.authenticated) return auth.response;

  try {
    const body = await request.json();

    // ── 1. Floor price check FIRST (before approval gate) ──
    // Run floor check for fixed_price and pct_discount rules targeting a
    // specific product. This must happen before the approval gate so the
    // floor context is included in the approval request when needed.
    let floorCheck: Awaited<ReturnType<typeof checkFloorCompliance>> | null = null;

    if (
      body.productSlug &&
      (body.ruleType === "fixed_price" || body.ruleType === "pct_discount")
    ) {
      let proposedPriceCents = 0;

      if (body.ruleType === "fixed_price") {
        proposedPriceCents = Math.round(Number(body.value));
      } else if (body.ruleType === "pct_discount") {
        // Estimate resulting price: fetch retail, apply discount
        const { buildPricingContract, getDefaultInput } = await import(
          "@/lib/pricing/pricing-contract"
        );
        const { prisma } = await import("@/lib/prisma");
        const prod = await prisma.product.findFirst({
          where: { slug: body.productSlug },
          include: { pricingPreset: true },
        });
        if (prod) {
          const defaults = getDefaultInput(prod);
          const contract = await buildPricingContract(prod, {
            quantity: Number(body.minQty) || defaults.quantity,
          });
          const retailCents = contract.sellPrice?.totalCents || 0;
          proposedPriceCents = Math.round(
            retailCents * (1 - Number(body.value) / 100)
          );
        }
      }

      if (proposedPriceCents > 0) {
        floorCheck = await checkFloorCompliance({
          productSlug: body.productSlug,
          proposedPriceCents,
          quantity: body.minQty ? Number(body.minQty) : undefined,
          operatorRole: auth.user.role,
        });
      }
    }

    // ── 2. Floor violation gate (non-owner blocked here) ──
    if (floorCheck && !floorCheck.allowed) {
      const gate = await gateWithApproval({
        operatorRole: auth.user.role,
        operator: {
          id: auth.user.id,
          name: auth.user.name || auth.user.email,
          role: auth.user.role,
        },
        changeType: "b2b_floor_override",
        scope: "b2b",
        targetSlug: body.productSlug,
        targetName: `B2B ${body.ruleType}: ${body.value}`,
        description: `${floorCheck.reason} — B2B rule ${body.ruleType}=${body.value} for ${body.productSlug}`,
        changeDiff: {
          ruleType: body.ruleType,
          value: body.value,
          proposedPriceCents: floorCheck.proposedPriceCents,
          floorPriceCents: floorCheck.floorPriceCents,
          policySource: floorCheck.policySource,
        },
      });

      if (gate.needsApproval) {
        return NextResponse.json(
          {
            requiresApproval: true,
            approvalId: gate.approvalId,
            reason: gate.reason || floorCheck.reason,
            floorCheck,
          },
          { status: 202 }
        );
      }
    }

    // ── 3. General approval gate for b2b_discount ──
    // Runs after floor check so non-floor approvals still include floor
    // context in the changeDiff for reviewer awareness.
    const approvalCheck = checkApprovalRequired({
      operatorRole: auth.user.role,
      changeType: "b2b_discount",
      driftPct: body.value, // for pct_discount, value = discount %
    });

    if (approvalCheck.requiresApproval) {
      const approvalId = await createApprovalRequest({
        changeType: "b2b_discount",
        scope: "b2b",
        targetSlug: body.productSlug || body.category || body.partnerTier || "global",
        targetName: `B2B ${body.ruleType}: ${body.value}`,
        description: body.note || `B2B price rule: ${body.ruleType} = ${body.value}`,
        changeDiff: {
          ...body,
          // Include floor context so reviewers can see floor compliance
          ...(floorCheck ? { _floorCheck: floorCheck } : {}),
        },
        driftPct: body.ruleType === "pct_discount" ? Number(body.value) : undefined,
        requester: {
          id: auth.user.id,
          name: auth.user.name || auth.user.email,
          role: auth.user.role,
        },
      });

      return NextResponse.json({
        requiresApproval: true,
        approvalId,
        reason: approvalCheck.reason,
        ...(floorCheck ? { floorCheck } : {}),
      }, { status: 202 });
    }

    // ── 4. Direct creation (owner or within guardrails) ──
    const rule = await createB2BRule({
      userId: body.userId,
      companyName: body.companyName,
      partnerTier: body.partnerTier,
      productId: body.productId,
      productSlug: body.productSlug,
      category: body.category,
      templateKey: body.templateKey,
      ruleType: body.ruleType,
      value: Number(body.value),
      minQty: body.minQty ? Number(body.minQty) : undefined,
      maxQty: body.maxQty ? Number(body.maxQty) : undefined,
      note: body.note,
      validFrom: body.validFrom ? new Date(body.validFrom) : undefined,
      validUntil: body.validUntil ? new Date(body.validUntil) : undefined,
      createdBy: auth.user.id,
    });

    // Log change (fire-and-forget, owner-bypass audit trail)
    logPriceChange({
      scope: "b2b",
      field: "b2b_rule.create",
      productSlug: body.productSlug || body.category || body.partnerTier || undefined,
      valueBefore: null,
      valueAfter: rule,
      operatorId: auth.user.id,
      operatorName: auth.user.name || auth.user.email,
      note: "owner-bypass",
    });

    return NextResponse.json({ rule });
  } catch (err) {
    console.error("[b2b-rules] POST failed:", err);
    return NextResponse.json({ error: "Failed to create B2B rule" }, { status: 500 });
  }
}
