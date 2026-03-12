// app/api/admin/pricing/b2b-rules/[id]/route.ts
// Single B2B price rule: GET, PATCH, DELETE
// PATCH and DELETE gated with approval workflow.

import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/admin-auth";
import { updateB2BRule, deleteB2BRule } from "@/lib/pricing/b2b-rules";
import { gateWithApproval } from "@/lib/pricing/approval";
import { logPriceChange } from "@/lib/pricing/change-log";
import { checkFloorCompliance } from "@/lib/pricing/floor-enforcement";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(request, "b2b", "view");
  if (!auth.authenticated) return auth.response;

  try {
    const { id } = await params;
    const rule = await prisma.b2BPriceRule.findUnique({ where: { id } });
    if (!rule) {
      return NextResponse.json({ error: "Rule not found" }, { status: 404 });
    }
    return NextResponse.json({ rule });
  } catch (err) {
    console.error("[b2b-rules] GET single failed:", err);
    return NextResponse.json({ error: "Failed to fetch rule" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(request, "b2b", "edit");
  if (!auth.authenticated) return auth.response;

  try {
    const { id } = await params;
    const body = await request.json();

    // Verify rule exists
    const existing = await prisma.b2BPriceRule.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Rule not found" }, { status: 404 });
    }

    // Floor check when value or ruleType is changed for product-targeted rules
    const effectiveSlug = body.productSlug !== undefined ? body.productSlug : existing.productSlug;
    const effectiveType = body.ruleType || existing.ruleType;
    const effectiveValue = body.value !== undefined ? Number(body.value) : existing.value;
    const valueChanged = body.value !== undefined && Number(body.value) !== existing.value;
    const ruleTypeChanged = body.ruleType !== undefined && body.ruleType !== existing.ruleType;

    if (
      effectiveSlug &&
      (valueChanged || ruleTypeChanged) &&
      (effectiveType === "fixed_price" || effectiveType === "pct_discount")
    ) {
      let proposedPriceCents = 0;

      if (effectiveType === "fixed_price") {
        proposedPriceCents = Math.round(effectiveValue);
      } else if (effectiveType === "pct_discount") {
        const { buildPricingContract, getDefaultInput } = await import(
          "@/lib/pricing/pricing-contract"
        );
        const prod = await prisma.product.findFirst({
          where: { slug: effectiveSlug },
          include: { pricingPreset: true },
        });
        if (prod) {
          const defaults = getDefaultInput(prod);
          const minQty = body.minQty !== undefined ? Number(body.minQty) : (existing.minQty ?? undefined);
          const contract = await buildPricingContract(prod, {
            quantity: minQty || defaults.quantity,
          });
          const retailCents = contract.sellPrice?.totalCents || 0;
          proposedPriceCents = Math.round(
            retailCents * (1 - effectiveValue / 100)
          );
        }
      }

      if (proposedPriceCents > 0) {
        const floorResult = await checkFloorCompliance({
          productSlug: effectiveSlug,
          proposedPriceCents,
          operatorRole: auth.user.role,
        });

        if (!floorResult.allowed) {
          const floorGate = await gateWithApproval({
            operatorRole: auth.user.role,
            operator: {
              id: auth.user.id,
              name: auth.user.name || auth.user.email,
              role: auth.user.role,
            },
            changeType: "b2b_floor_override",
            scope: "b2b",
            targetId: id,
            targetSlug: effectiveSlug,
            targetName: `B2B ${effectiveType}: ${effectiveValue}`,
            description: `${floorResult.reason} — B2B rule update ${effectiveType}=${effectiveValue} for ${effectiveSlug}`,
            changeDiff: {
              ruleType: effectiveType,
              value: effectiveValue,
              proposedPriceCents,
              floorPriceCents: floorResult.floorPriceCents,
              policySource: floorResult.policySource,
              before: existing,
            },
          });

          if (floorGate.needsApproval) {
            return NextResponse.json(
              {
                requiresApproval: true,
                approvalId: floorGate.approvalId,
                reason: floorGate.reason || floorResult.reason,
                floorCheck: floorResult,
              },
              { status: 202 }
            );
          }
        }
      }
    }

    // Approval gate — b2b_discount for updates
    const gate = await gateWithApproval({
      operatorRole: auth.user.role,
      operator: {
        id: auth.user.id,
        name: auth.user.name || auth.user.email,
        role: auth.user.role,
      },
      changeType: "b2b_discount",
      scope: "b2b",
      targetId: id,
      targetSlug: existing.productSlug || existing.category || existing.partnerTier || "global",
      targetName: `B2B ${existing.ruleType}: ${existing.value} → ${body.value ?? existing.value}`,
      description: `Update B2B rule ${id}: ${body.note || existing.note || "no note"}`,
      changeDiff: { id, before: existing, after: body },
      driftPct: body.value !== undefined ? body.value : undefined,
    });

    if (gate.needsApproval) {
      return NextResponse.json(
        {
          requiresApproval: true,
          approvalId: gate.approvalId,
          reason: gate.reason,
        },
        { status: 202 }
      );
    }

    // Owner bypass or within guardrails — apply directly
    const rule = await updateB2BRule(id, {
      userId: body.userId,
      companyName: body.companyName,
      partnerTier: body.partnerTier,
      productId: body.productId,
      productSlug: body.productSlug,
      category: body.category,
      templateKey: body.templateKey,
      ruleType: body.ruleType,
      value: body.value !== undefined ? Number(body.value) : undefined,
      minQty: body.minQty !== undefined ? (body.minQty ? Number(body.minQty) : null) : undefined,
      maxQty: body.maxQty !== undefined ? (body.maxQty ? Number(body.maxQty) : null) : undefined,
      note: body.note,
      validFrom: body.validFrom !== undefined ? (body.validFrom ? new Date(body.validFrom) : null) : undefined,
      validUntil: body.validUntil !== undefined ? (body.validUntil ? new Date(body.validUntil) : null) : undefined,
    });

    // Log change (fire-and-forget, owner-bypass note when applicable)
    logPriceChange({
      scope: "b2b",
      field: "b2b_rule.update",
      productSlug: existing.productSlug || undefined,
      valueBefore: existing,
      valueAfter: rule,
      operatorId: auth.user.id,
      operatorName: auth.user.name || auth.user.email,
      note: gate.needsApproval === false ? "owner-bypass" : undefined,
    });

    return NextResponse.json({ rule });
  } catch (err) {
    console.error("[b2b-rules] PATCH failed:", err);
    return NextResponse.json({ error: "Failed to update rule" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission(request, "b2b", "edit");
  if (!auth.authenticated) return auth.response;

  try {
    const { id } = await params;

    // Verify rule exists
    const existing = await prisma.b2BPriceRule.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Rule not found" }, { status: 404 });
    }

    // Approval gate — b2b_delete
    const gate = await gateWithApproval({
      operatorRole: auth.user.role,
      operator: {
        id: auth.user.id,
        name: auth.user.name || auth.user.email,
        role: auth.user.role,
      },
      changeType: "b2b_delete",
      scope: "b2b",
      targetId: id,
      targetSlug: existing.productSlug || existing.category || existing.partnerTier || "global",
      targetName: `B2B ${existing.ruleType}: ${existing.value}`,
      description: `Delete B2B rule ${id}: ${existing.note || existing.ruleType}`,
      changeDiff: { id, rule: existing },
    });

    if (gate.needsApproval) {
      return NextResponse.json(
        {
          requiresApproval: true,
          approvalId: gate.approvalId,
          reason: gate.reason,
        },
        { status: 202 }
      );
    }

    // Owner bypass or within guardrails — apply directly
    const result = await deleteB2BRule(id);

    // Log change (fire-and-forget)
    logPriceChange({
      scope: "b2b",
      field: "b2b_rule.delete",
      productSlug: existing.productSlug || undefined,
      valueBefore: existing,
      valueAfter: { deleted: true },
      operatorId: auth.user.id,
      operatorName: auth.user.name || auth.user.email,
      note: "owner-bypass",
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("[b2b-rules] DELETE failed:", err);
    return NextResponse.json({ error: "Failed to deactivate rule" }, { status: 500 });
  }
}
