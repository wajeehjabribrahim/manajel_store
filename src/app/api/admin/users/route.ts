import { NextRequest, NextResponse } from "next/server";
import { corsMiddleware, applyCorsHeaders } from "@/lib/cors";
import { prisma } from "@/lib/prisma";
import { decryptData } from "@/lib/encryption";
import { requireAdminAccess } from "@/lib/adminAuth";

export async function GET(request: NextRequest) {
  // CORS preflight
  // @ts-ignore
  const corsResult = corsMiddleware(request);
  if (corsResult && corsResult instanceof NextResponse && corsResult.body === null) {
    return corsResult;
  }
  try {
    const adminCheck = await requireAdminAccess();
    if (!adminCheck.ok) {
      let response = adminCheck.response;
      response = applyCorsHeaders(response, request.headers.get('origin'));
      return response;
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";

    const skip = (page - 1) * limit;

    // Build search filter
    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ];
    }

    // Get total count
    const total = await prisma.user.count({ where });

    // Get users with pagination
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        city: true,
        address: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            orders: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    });

    const safeUsers = users.map((user) => ({
      ...user,
      city: user.city ? decryptData(user.city) : user.city,
      address: user.address ? decryptData(user.address) : user.address,
    }));

    let response = NextResponse.json({
      users: safeUsers,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
    response = applyCorsHeaders(response, request.headers.get('origin'));
    return response;
  } catch (error) {
    console.error("Error fetching users:", error);
    let response = NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
    response = applyCorsHeaders(response, request.headers.get('origin'));
    return response;
  }
}
