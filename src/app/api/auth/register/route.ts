import { NextResponse } from "next/server";
import * as bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { encryptData } from "@/lib/encryption";
import { checkDbRateLimit, getRequestIp } from "@/lib/rateLimit";

export async function POST(req: Request) {
  try {
    // Durable per-IP limit on account creation (middleware limit is in-memory only)
    const ip = getRequestIp(req);
    const rate = await checkDbRateLimit(`register:${ip}`, 5, 60 * 60 * 1000);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Too many registration attempts. Please try again later." },
        { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } }
      );
    }

    const body = await req.json();
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
        city: encryptData(city),
        address: encryptData(address),
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
