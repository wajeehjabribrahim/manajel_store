import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { corsMiddleware, applyCorsHeaders } from "@/lib/cors";
import { requireAdminAccess } from "@/lib/adminAuth";

// GET - جلب جميع التصنيفات
export async function GET(request: Request) {
  // CORS preflight
  // @ts-ignore
  const corsResult = corsMiddleware(request);
  if (corsResult && corsResult instanceof NextResponse && corsResult.body === null) {
    return corsResult;
  }
  try {
    const categories = await prisma.category.findMany({
      orderBy: {
        createdAt: 'asc'
      }
    });

    let response = NextResponse.json(categories);
    response = applyCorsHeaders(response, request.headers.get('origin'));
    return response;
  } catch (error) {
    console.error("Error fetching categories:", error);
    let response = NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
    response = applyCorsHeaders(response, request.headers.get('origin'));
    return response;
  }
}

// POST - إضافة تصنيف جديد (للأدمن فقط)
export async function POST(request: Request) {
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

    const body = await request.json();
    const { name, nameAr } = body;

    if (!name || !nameAr) {
      let response = NextResponse.json(
        { error: "Name and Arabic name are required" },
        { status: 400 }
      );
      response = applyCorsHeaders(response, request.headers.get('origin'));
      return response;
    }

    // التحقق من عدم وجود تصنيف بنفس الاسم
    const existing = await prisma.category.findUnique({
      where: { name }
    });

    if (existing) {
      let response = NextResponse.json(
        { error: "Invalid request" },
        { status: 400 }
      );
      response = applyCorsHeaders(response, request.headers.get('origin'));
      return response;
    }

    const category = await prisma.category.create({
      data: {
        name,
        nameAr
      }
    });

    let response = NextResponse.json(category, { status: 201 });
    response = applyCorsHeaders(response, request.headers.get('origin'));
    return response;
  } catch (error) {
    console.error("Error creating category:", error);
    let response = NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
    response = applyCorsHeaders(response, request.headers.get('origin'));
    return response;
  }
}
