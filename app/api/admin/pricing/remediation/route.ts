// app/api/admin/pricing/remediation/route.ts
// =================================================================
// Data remediation API — preview and execute fixes for pricing
// data quality issues.
//
// GET  — List available remediation actions with dry-run preview
// POST — Execute a remediation action (with approval gate)
//
// Workstream 6: Data Remediation Tools
// =================================================================

import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/admin-auth";
import {
  planRemediation,
  executeRemediation,
  ACTION_META,
  type RemediationAction,
} from "@/lib/pricing/remediation";
import { gateWithApproval } from "@/lib/pricing/approval";

const VALID_ACTIONS: RemediationAction[] = [
  "backfill_display_from_price",
  "fix_placeholder_materials",
  "fix_zero_cost_materials",
  "fix_suspicious_hardware",
  "backfill_floor_policy",
  "flag_fixed_missing_vendor_cost",
];

// ── GET — Preview remediation actions ────────────────────────────

export async function GET(request: NextRequest) {
  const auth = await requirePermission(request, "pricing", "view");
  if (!auth.authenticated) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const actionParam = searchParams.get("action") || "all";

    if (actionParam !== "all" && !VALID_ACTIONS.includes(actionParam as RemediationAction)) {
      return NextResponse.json(
        { error: `Invalid action. Valid actions: ${VALID_ACTIONS.join(", ")}` },
        { status: 400 }
      );
    }

    if (actionParam === "all") {
      // Return summary of all actions
      const plans = await Promise.all(
        VALID_ACTIONS.map(async (action) => {
          const plan = await planRemediation(action);
          return {
            action,
            ...ACTION_META[action],
            affectedCount: plan.affectedCount,
            summary: plan.summary,
            items: plan.items,
          };
        })
      );

      return NextResponse.json({ plans });
    }

    // Single action preview
    const plan = await planRemediation(actionParam as RemediationAction);
    const meta = ACTION_META[actionParam as RemediationAction];

    return NextResponse.json({
      plan: {
        ...plan,
        ...meta,
      },
    });
  } catch (err) {
    console.error("[remediation] GET failed:", err);
    return NextResponse.json(
      { error: "Failed to generate remediation plan" },
      { status: 500 }
    );
  }
}

// ── POST — Execute remediation action ────────────────────────────

export async function POST(request: NextRequest) {
  const auth = await requirePermission(request, "pricing", "edit");
  if (!auth.authenticated) return auth.response;

  try {
    const body = await request.json();
    const { action, dryRun, itemIds } = body as {
      action?: string;
      dryRun?: boolean;
      itemIds?: string[];
    };

    if (!action || !VALID_ACTIONS.includes(action as RemediationAction)) {
      return NextResponse.json(
        { error: `Invalid action. Valid actions: ${VALID_ACTIONS.join(", ")}` },
        { status: 400 }
      );
    }

    const typedAction = action as RemediationAction;
    const meta = ACTION_META[typedAction];

    // Generate the plan
    const plan = await planRemediation(typedAction);

    // If dry run requested, just return the plan
    if (dryRun) {
      return NextResponse.json({
        plan: { ...plan, ...meta },
      });
    }

    // Read-only actions cannot be executed
    if (meta.readOnly) {
      return NextResponse.json(
        {
          error: `Action "${typedAction}" is read-only (flag only). No changes to apply.`,
          plan: { ...plan, ...meta },
        },
        { status: 400 }
      );
    }

    // Nothing to fix
    if (plan.affectedCount === 0) {
      return NextResponse.json({
        plan: { ...plan, ...meta },
        result: { applied: 0, skipped: 0, errors: [] },
        message: "No items to remediate",
      });
    }

    // Determine the actual count being applied
    const effectiveCount = itemIds
      ? plan.items.filter((i) => itemIds.includes(i.id)).length
      : plan.affectedCount;

    // Approval gate
    const gate = await gateWithApproval({
      operatorRole: auth.user.role,
      operator: {
        id: auth.user.id,
        name: auth.user.name || auth.user.email,
        role: auth.user.role,
      },
      changeType: "remediation_backfill",
      scope: "product",
      description: `Remediation: ${meta.label} (${effectiveCount} items)`,
      changeDiff: {
        action: typedAction,
        itemCount: effectiveCount,
        itemIds: itemIds || plan.items.map((i) => i.id),
      },
      affectedCount: effectiveCount,
    });

    if (gate.needsApproval) {
      return NextResponse.json(
        {
          requiresApproval: true,
          approvalId: gate.approvalId,
          reason: gate.reason,
          plan: { ...plan, ...meta },
        },
        { status: 202 }
      );
    }

    // Execute the remediation
    const result = await executeRemediation(
      plan,
      {
        id: auth.user.id,
        name: auth.user.name || auth.user.email,
      },
      itemIds
    );

    return NextResponse.json({
      plan: { ...plan, ...meta },
      result,
      message: `Applied ${result.applied}, skipped ${result.skipped}${result.errors.length ? `, ${result.errors.length} errors` : ""}`,
    });
  } catch (err) {
    console.error("[remediation] POST failed:", err);
    return NextResponse.json(
      { error: "Failed to execute remediation" },
      { status: 500 }
    );
  }
}
