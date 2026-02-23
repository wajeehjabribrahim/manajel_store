import { NextResponse } from "next/server";
import * as bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    try {
      // Log incoming request body for debugging (remove in production)
      console.log("[register] body:", JSON.stringify(body));
    } catch (e) {
      // ignore logging errors
    }
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const phone = typeof body?.phone === "string" ? body.phone.trim() : "";
    const city = typeof body?.city === "string" ? body.city.trim() : "";
    const address = typeof body?.address === "string" ? body.address.trim() : "";
    const email = typeof body?.email === "string" ? body.email.toLowerCase().trim() : "";
    const password = typeof body?.password === "string" ? body.password : "";

    const missing: string[] = [];
    if (!name) missing.push("name");
    if (!phone) missing.push("phone");
    if (!city) missing.push("city");
    if (!address) missing.push("address");
    if (!email) missing.push("email");
    if (!password) missing.push("password");
    if (password && password.length < 6) missing.push("password_too_short");

    if (missing.length > 0) {
      try {
        console.log("[register] validation missing:", missing);
      } catch (e) {}
      return NextResponse.json(
        { error: "Invalid data", missing },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Email already in use" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        phone,
        city,
        address,
        email,
        password: hashedPassword,
      },
    });

    return NextResponse.json(
      {
        ok: true,
        user: { id: user.id, name: user.name, email: user.email },
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
