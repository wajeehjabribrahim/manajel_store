import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - جلب جميع التصنيفات
export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: {
        createdAt: 'asc'
      }
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

// POST - إضافة تصنيف جديد (للأدمن فقط)
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (session.user as { role?: string } | undefined)?.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, nameAr } = body;

    if (!name || !nameAr) {
      return NextResponse.json(
        { error: "Name and Arabic name are required" },
        { status: 400 }
      );
    }

    // التحقق من عدم وجود تصنيف بنفس الاسم
    const existing = await prisma.category.findUnique({
      where: { name }
    });

    if (existing) {
      return NextResponse.json(
        { error: "Category with this name already exists" },
        { status: 400 }
      );
    }

    const category = await prisma.category.create({
      data: {
        name,
        nameAr
      }
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 }
    );
  }
}
