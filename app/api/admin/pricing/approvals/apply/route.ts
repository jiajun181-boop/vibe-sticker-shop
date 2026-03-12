// app/api/admin/pricing/approvals/apply/route.ts
// Execute deferred pricing mutations after approval.
// POST with { approvalId } — looks up the approved request,
// executes the stored changeDiff based on changeType.

import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/admin-auth";
import { canApprovePricing } from "@/lib/pricing/pricing-permissions";
import { logPriceChange } from "@/lib/pricing/change-log";
import { prisma } from "@/lib/prisma";
import { validatePresetConfig } from "@/lib/pricing/validate-config";
import { computeFromPrice } from "@/lib/pricing/from-price";

// B2B rule helpers
import {
  createB2BRule,
  updateB2BRule,
  deleteB2BRule,
} from "@/lib/pricing/b2b-rules";

// Vendor cost helpers
import {
  upsertVendorCost,
  updateVendorCost,
  deleteVendorCost,
} from "@/lib/pricing/vendor-cost";

export async function POST(request: NextRequest) {
  const auth = await requirePermission(request, "pricing", "edit");
  if (!auth.authenticated) return auth.response;

  // Only managers+ can apply approved mutations
  if (!canApprovePricing(auth.user.role)) {
    return NextResponse.json(
      { error: "Insufficient pricing tier to apply approved changes" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { approvalId } = body;

    if (!approvalId) {
      return NextResponse.json(
        { error: "approvalId is required" },
        { status: 400 }
      );
    }

    // Fetch the approval record
    const approval = await prisma.pricingApproval.findUnique({
      where: { id: approvalId },
    });

    if (!approval) {
      return NextResponse.json(
        { error: "Approval not found" },
        { status: 404 }
      );
    }

    if (approval.status !== "approved") {
      return NextResponse.json(
        { error: `Approval is "${approval.status}", expected "approved"` },
        { status: 400 }
      );
    }

    const changeDiff = approval.changeDiff as Record<string, unknown> | null;
    if (!changeDiff) {
      return NextResponse.json(
        { error: "No changeDiff stored on approval — cannot apply" },
        { status: 400 }
      );
    }

    let result: unknown;
    const changeType = approval.changeType;

    switch (changeType) {
      // ── B2B rules ──────────────────────────────────────────────
      case "b2b_discount": {
        // changeDiff could be a create payload or an update payload with { id, before, after }
        if (changeDiff.id && changeDiff.before && changeDiff.after) {
          // Update path
          const updatePayload = changeDiff.after as Record<string, unknown>;
          result = await updateB2BRule(changeDiff.id as string, {
            userId: updatePayload.userId as string | undefined,
            companyName: updatePayload.companyName as string | undefined,
            partnerTier: updatePayload.partnerTier as string | undefined,
            productId: updatePayload.productId as string | undefined,
            productSlug: updatePayload.productSlug as string | undefined,
            category: updatePayload.category as string | undefined,
            templateKey: updatePayload.templateKey as string | undefined,
            ruleType: updatePayload.ruleType as "pct_discount" | "fixed_price" | "cost_plus_override" | "margin_override" | undefined,
            value: updatePayload.value !== undefined ? Number(updatePayload.value) : undefined,
            minQty: updatePayload.minQty !== undefined ? (updatePayload.minQty ? Number(updatePayload.minQty) : null) : undefined,
            maxQty: updatePayload.maxQty !== undefined ? (updatePayload.maxQty ? Number(updatePayload.maxQty) : null) : undefined,
            note: updatePayload.note as string | undefined,
          });
        } else {
          // Create path — changeDiff IS the create payload
          result = await createB2BRule({
            userId: changeDiff.userId as string | undefined,
            companyName: changeDiff.companyName as string | undefined,
            partnerTier: changeDiff.partnerTier as string | undefined,
            productId: changeDiff.productId as string | undefined,
            productSlug: changeDiff.productSlug as string | undefined,
            category: changeDiff.category as string | undefined,
            templateKey: changeDiff.templateKey as string | undefined,
            ruleType: (changeDiff.ruleType as string) as "pct_discount" | "fixed_price" | "cost_plus_override" | "margin_override",
            value: Number(changeDiff.value),
            minQty: changeDiff.minQty ? Number(changeDiff.minQty) : undefined,
            maxQty: changeDiff.maxQty ? Number(changeDiff.maxQty) : undefined,
            note: changeDiff.note as string | undefined,
            validFrom: changeDiff.validFrom ? new Date(changeDiff.validFrom as string) : undefined,
            validUntil: changeDiff.validUntil ? new Date(changeDiff.validUntil as string) : undefined,
            createdBy: approval.requesterId,
          });
        }
        break;
      }

      case "b2b_delete": {
        // changeDiff = { id, rule }
        const ruleId = (changeDiff.id as string) || "";
        result = await deleteB2BRule(ruleId);
        break;
      }

      // ── Vendor costs ───────────────────────────────────────────
      case "vendor_cost_create": {
        // changeDiff IS the full create payload
        result = await upsertVendorCost({
          productId: changeDiff.productId as string | undefined,
          productSlug: changeDiff.productSlug as string | undefined,
          productName: changeDiff.productName as string | undefined,
          vendorName: changeDiff.vendorName as string,
          vendorSku: changeDiff.vendorSku as string | undefined,
          sizeKey: changeDiff.sizeKey as string | undefined,
          qtyTier: changeDiff.qtyTier ? Number(changeDiff.qtyTier) : undefined,
          unitCostCents: Number(changeDiff.unitCostCents) || 0,
          setupFeeCents: changeDiff.setupFeeCents ? Number(changeDiff.setupFeeCents) : undefined,
          shippingCents: changeDiff.shippingCents ? Number(changeDiff.shippingCents) : undefined,
          leadTimeDays: changeDiff.leadTimeDays ? Number(changeDiff.leadTimeDays) : undefined,
          note: changeDiff.note as string | undefined,
        });
        break;
      }

      case "vendor_cost_update": {
        // changeDiff = { id, before, after }
        const costId = changeDiff.id as string;
        const updateData = changeDiff.after as Record<string, unknown>;
        result = await updateVendorCost(costId, {
          productId: updateData.productId as string | undefined,
          productSlug: updateData.productSlug as string | undefined,
          productName: updateData.productName as string | undefined,
          vendorName: updateData.vendorName as string | undefined,
          vendorSku: updateData.vendorSku as string | undefined,
          sizeKey: updateData.sizeKey as string | undefined,
          qtyTier: updateData.qtyTier !== undefined ? Number(updateData.qtyTier) : undefined,
          unitCostCents: updateData.unitCostCents !== undefined ? Number(updateData.unitCostCents) : undefined,
          setupFeeCents: updateData.setupFeeCents !== undefined ? Number(updateData.setupFeeCents) : undefined,
          shippingCents: updateData.shippingCents !== undefined ? Number(updateData.shippingCents) : undefined,
          leadTimeDays: updateData.leadTimeDays !== undefined ? Number(updateData.leadTimeDays) : undefined,
          note: updateData.note as string | undefined,
        });
        break;
      }

      case "vendor_cost_delete": {
        // changeDiff = { id, cost }
        const deleteId = changeDiff.id as string;
        result = await deleteVendorCost(deleteId);
        break;
      }

      // ── Preset operations ─────────────────────────────────────
      case "preset_create": {
        // changeDiff = { key, name, model, config }
        const { key, name, model, config } = changeDiff as Record<string, unknown>;
        const validation = validatePresetConfig(model as string, config);
        if (!validation.valid) {
          return NextResponse.json(
            { error: "Invalid preset config", errors: validation.errors },
            { status: 400 }
          );
        }
        result = await prisma.pricingPreset.create({
          data: { key: key as string, name: name as string, model: model as string, config: config as object },
        });
        break;
      }

      case "preset_config_edit": {
        // changeDiff = { before, after } where after is the new config
        const targetId = approval.targetId;
        if (!targetId) {
          return NextResponse.json({ error: "No targetId on approval" }, { status: 400 });
        }
        const preset = await prisma.pricingPreset.findUnique({ where: { id: targetId }, select: { id: true, model: true } });
        if (!preset) {
          return NextResponse.json({ error: "Preset not found" }, { status: 404 });
        }
        const newConfig = changeDiff.after as object;
        const configValidation = validatePresetConfig(preset.model, newConfig);
        if (!configValidation.valid) {
          return NextResponse.json(
            { error: "Invalid preset config", errors: configValidation.errors },
            { status: 400 }
          );
        }
        result = await prisma.pricingPreset.update({
          where: { id: targetId },
          data: { config: newConfig },
        });
        // Refresh minPrice for affected products
        try {
          const affected = await prisma.product.findMany({
            where: { pricingPresetId: targetId, isActive: true },
            include: { pricingPreset: true },
          });
          for (const p of affected) {
            const fresh = computeFromPrice(p);
            if (fresh > 0 && fresh !== p.minPrice) {
              await prisma.product.update({ where: { id: p.id }, data: { minPrice: fresh } });
            }
          }
        } catch (e) {
          console.warn("[approvals/apply] minPrice refresh non-critical error:", e);
        }
        break;
      }

      case "preset_delete": {
        // changeDiff = { preset, affectedProducts }
        const presetId = approval.targetId;
        if (!presetId) {
          return NextResponse.json({ error: "No targetId on approval" }, { status: 400 });
        }
        // Nullify product references and clear cached minPrice
        await prisma.product.updateMany({
          where: { pricingPresetId: presetId },
          data: { pricingPresetId: null, minPrice: null },
        });
        await prisma.pricingPreset.delete({ where: { id: presetId } });
        result = { deleted: presetId };
        break;
      }

      // ── Material operations ───────────────────────────────────
      case "material_create": {
        // changeDiff = { name, type, rollCost, costPerSqft, ... }
        result = await prisma.material.create({
          data: {
            type: (changeDiff.type as string) || "Adhesive Vinyl",
            name: (changeDiff.name as string) || "New Material",
            rollCost: Number(changeDiff.rollCost) || 0,
            costPerSqft: Number(changeDiff.costPerSqft) || 0,
            costPerSqm: Number(changeDiff.costPerSqft || 0) * 10.7639,
          },
        });
        break;
      }

      case "material_delete": {
        // changeDiff = { name, type }
        const matId = approval.targetId;
        if (!matId) {
          return NextResponse.json({ error: "No targetId on approval" }, { status: 400 });
        }
        await prisma.material.update({
          where: { id: matId },
          data: { isActive: false },
        });
        result = { deactivated: matId };
        break;
      }

      case "material_cost_edit": {
        // changeDiff = { before: { costPerSqft, rollCost }, after: { costPerSqft, rollCost } }
        const matCostId = approval.targetId;
        if (!matCostId) {
          return NextResponse.json({ error: "No targetId on approval" }, { status: 400 });
        }
        const afterData = changeDiff.after as Record<string, unknown>;
        const updateFields: Record<string, unknown> = {};
        if (afterData.costPerSqft !== undefined) {
          updateFields.costPerSqft = Number(afterData.costPerSqft);
          updateFields.costPerSqm = Number(afterData.costPerSqft) * 10.7639;
        }
        if (afterData.rollCost !== undefined) updateFields.rollCost = Number(afterData.rollCost);
        result = await prisma.material.update({
          where: { id: matCostId },
          data: updateFields,
        });
        break;
      }

      default:
        return NextResponse.json(
          { error: `Unknown changeType: ${changeType}` },
          { status: 400 }
        );
    }

    // Mark the approval with a reviewNote indicating it was applied.
    // The ApprovalStatus enum does not include "applied", so we keep it "approved"
    // and track execution in the review note + change log.
    await prisma.pricingApproval.update({
      where: { id: approvalId },
      data: {
        reviewNote: [
          approval.reviewNote || "",
          `[Applied by ${auth.user.name || auth.user.email} at ${new Date().toISOString()}]`,
        ].filter(Boolean).join(" "),
      },
    }).catch((err: unknown) => {
      console.error("[approvals/apply] Failed to update review note:", err);
    });

    // Log the execution to PriceChangeLog (fire-and-forget)
    logPriceChange({
      scope: (approval.scope as "product" | "material" | "setting" | "preset" | "b2b") || "b2b",
      field: `approval.applied.${changeType}`,
      productSlug: approval.targetSlug || undefined,
      valueBefore: changeDiff,
      valueAfter: result,
      operatorId: auth.user.id,
      operatorName: auth.user.name || auth.user.email,
      note: `Applied approved change (approval ${approvalId})`,
    });

    // Fetch final approval state so the UI can immediately reflect the applied status
    let updatedApproval = null;
    try {
      updatedApproval = await prisma.pricingApproval.findUnique({ where: { id: approvalId } });
    } catch (_e) {
      // Non-critical
    }

    // Map changeType to which home-summary sections are affected
    const invalidates: string[] = ["pendingApprovals"];
    if (changeType?.startsWith("vendor_cost")) invalidates.push("missingVendorCost");
    if (changeType?.startsWith("material")) invalidates.push("missingVendorCost");
    if (changeType?.startsWith("preset")) invalidates.push("profitAlerts");

    return NextResponse.json({
      success: true,
      result,
      approval: updatedApproval,
      refreshHint: { invalidates },
    });
  } catch (err) {
    console.error("[approvals/apply] POST failed:", err);
    return NextResponse.json(
      { error: "Failed to apply approved change" },
      { status: 500 }
    );
  }
}
