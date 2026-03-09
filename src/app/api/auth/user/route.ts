import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { encryptData, decryptData } from "@/lib/encryption";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!(session?.user as any)?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const id = String((session as any).user.id);
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, phone: true, city: true, address: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const safeUser = {
      ...user,
      city: user.city ? decryptData(user.city) : user.city,
      address: user.address ? decryptData(user.address) : user.address,
    };

    return NextResponse.json({ user: safeUser }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!(session?.user as any)?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const id = String((session as any).user.id);
    const body = await req.json();
    const phone = typeof body?.phone === "string" ? body.phone.trim() : undefined;
    const city = typeof body?.city === "string" ? body.city.trim() : undefined;
    const address = typeof body?.address === "string" ? body.address.trim() : undefined;

    // At least one field must be present
    if (phone === undefined && city === undefined && address === undefined) {
      return NextResponse.json({ error: "No fields provided" }, { status: 400 });
    }

    const data: any = {};
    if (phone !== undefined) data.phone = phone;
    if (city !== undefined) data.city = encryptData(city);
    if (address !== undefined) data.address = encryptData(address);

    const updated = await prisma.user.update({ where: { id }, data });

    return NextResponse.json({ user: { id: updated.id, name: updated.name, email: updated.email, phone: updated.phone, city: updated.city ? decryptData(updated.city) : updated.city, address: updated.address ? decryptData(updated.address) : updated.address } }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
