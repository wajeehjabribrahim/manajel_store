import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { applyCorsHeaders, corsMiddleware } from "@/lib/cors";

export async function POST(req: Request) {
  // @ts-ignore
  const corsResult = corsMiddleware(req);
  if (corsResult && corsResult instanceof NextResponse && corsResult.body === null) {
    return corsResult;
  }

  try {
    const body = await req.json();
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      let response = NextResponse.json({ error: "Invalid email" }, { status: 400 });
      response = applyCorsHeaders(response, req.headers.get("origin"));
      return response;
    }

    await prisma.newsletterSubscriber.upsert({
      where: { email },
      update: {},
      create: { email },
    });

    let response = NextResponse.json({ success: true });
    response = applyCorsHeaders(response, req.headers.get("origin"));
    return response;
  } catch {
    let response = NextResponse.json({ error: "Server error" }, { status: 500 });
    response = applyCorsHeaders(response, req.headers.get("origin"));
    return response;
  }
}
