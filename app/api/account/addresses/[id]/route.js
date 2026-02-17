import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function PATCH(request, { params }) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const existing = await prisma.address.findUnique({ where: { id } });
  if (!existing || existing.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { label, name, phone, company, line1, line2, city, state, postalCode, country, isDefaultShipping } = body;

  // If setting as default, unset other defaults first
  if (isDefaultShipping && !existing.isDefaultShipping) {
    await prisma.address.updateMany({
      where: { userId: user.id, isDefaultShipping: true },
      data: { isDefaultShipping: false },
    });
  }

  const data = {};
  if (label !== undefined) data.label = label?.trim() || null;
  if (name !== undefined) data.name = name?.trim() || null;
  if (phone !== undefined) data.phone = phone?.trim() || null;
  if (company !== undefined) data.company = company?.trim() || null;
  if (line1 !== undefined) data.line1 = line1.trim();
  if (line2 !== undefined) data.line2 = line2?.trim() || null;
  if (city !== undefined) data.city = city.trim();
  if (state !== undefined) data.state = state?.trim() || null;
  if (postalCode !== undefined) data.postalCode = postalCode.trim();
  if (country !== undefined) data.country = country?.trim() || "CA";
  if (isDefaultShipping !== undefined) data.isDefaultShipping = !!isDefaultShipping;

  const updated = await prisma.address.update({ where: { id }, data });

  return NextResponse.json({ address: updated });
}

export async function DELETE(request, { params }) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const existing = await prisma.address.findUnique({ where: { id } });
  if (!existing || existing.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.address.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
