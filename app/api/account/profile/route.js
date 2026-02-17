import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(request) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    profile: {
      name: user.name,
      email: user.email,
      phone: user.phone,
      companyName: user.companyName,
      accountType: user.accountType,
      emailVerified: user.emailVerified,
      b2bApproved: user.b2bApproved,
      createdAt: user.createdAt,
    },
  });
}

export async function PATCH(request) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { name, phone, companyName } = body;

  if (name !== undefined && (typeof name !== "string" || name.trim().length === 0)) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }
  if (name !== undefined && name.length > 100) {
    return NextResponse.json({ error: "Name too long" }, { status: 400 });
  }
  if (phone !== undefined && phone !== null && typeof phone !== "string") {
    return NextResponse.json({ error: "Invalid phone" }, { status: 400 });
  }
  if (companyName !== undefined && companyName !== null && typeof companyName !== "string") {
    return NextResponse.json({ error: "Invalid company name" }, { status: 400 });
  }

  const data = {};
  if (name !== undefined) data.name = name.trim();
  if (phone !== undefined) data.phone = phone ? phone.trim() : null;
  if (companyName !== undefined) data.companyName = companyName ? companyName.trim() : null;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data,
    select: {
      name: true,
      email: true,
      phone: true,
      companyName: true,
      accountType: true,
      emailVerified: true,
      b2bApproved: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ profile: updated });
}
