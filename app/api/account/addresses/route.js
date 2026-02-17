import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(request) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const addresses = await prisma.address.findMany({
    where: { userId: user.id },
    orderBy: [{ isDefaultShipping: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({ addresses });
}

export async function POST(request) {
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

  const { label, name, phone, company, line1, line2, city, state, postalCode, country, isDefaultShipping } = body;

  if (!line1 || !city || !postalCode) {
    return NextResponse.json({ error: "Address, city, and postal code are required" }, { status: 400 });
  }

  // If setting as default, unset other defaults first
  if (isDefaultShipping) {
    await prisma.address.updateMany({
      where: { userId: user.id, isDefaultShipping: true },
      data: { isDefaultShipping: false },
    });
  }

  const address = await prisma.address.create({
    data: {
      userId: user.id,
      label: label?.trim() || null,
      name: name?.trim() || null,
      phone: phone?.trim() || null,
      company: company?.trim() || null,
      line1: line1.trim(),
      line2: line2?.trim() || null,
      city: city.trim(),
      state: state?.trim() || null,
      postalCode: postalCode.trim(),
      country: country?.trim() || "CA",
      isDefaultShipping: !!isDefaultShipping,
    },
  });

  return NextResponse.json({ address }, { status: 201 });
}
