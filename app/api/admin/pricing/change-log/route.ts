// app/api/admin/pricing/change-log/route.ts
// Change history API with rich filters for version history view.

import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/admin-auth";
import { listChangeHistory } from "@/lib/pricing/change-log";
import type { ChangeScope } from "@/lib/pricing/change-log";

const VALID_SCOPES = ["product", "material", "setting", "preset", "b2b"];

export async function GET(request: NextRequest) {
  const auth = await requirePermission(request, "pricing", "view");
  if (!auth.authenticated) return auth.response;

  try {
    const { searchParams } = new URL(request.url);

    const scopeRaw = searchParams.get("scope");
    const scope = scopeRaw && VALID_SCOPES.includes(scopeRaw)
      ? (scopeRaw as ChangeScope)
      : undefined;

    const productSlug = searchParams.get("productSlug") || undefined;
    const field = searchParams.get("field") || undefined;
    const operatorId = searchParams.get("operatorId") || undefined;
    const highDriftOnly = searchParams.get("highDrift") === "true";
    const fromRaw = searchParams.get("from");
    const toRaw = searchParams.get("to");
    const dateFrom = fromRaw ? new Date(fromRaw) : undefined;
    const dateTo = toRaw ? new Date(toRaw) : undefined;
    const page = Number(searchParams.get("page")) || 1;
    const limit = Number(searchParams.get("limit")) || 50;

    const result = await listChangeHistory({
      scope,
      productSlug,
      field,
      operatorId,
      highDriftOnly,
      dateFrom,
      dateTo,
      page,
      limit,
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("[change-log] GET failed:", err);
    return NextResponse.json(
      { error: "Failed to list change history" },
      { status: 500 }
    );
  }
}
