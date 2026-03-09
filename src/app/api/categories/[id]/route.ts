import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireAdminAccess } from "@/lib/adminAuth";

// PUT - تعديل تصنيف (للأدمن فقط)
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const adminCheck = await requireAdminAccess();
    if (!adminCheck.ok) {
      return adminCheck.response;
    }

    const body = await request.json();
    const { name, nameAr } = body;

    if (!name || !nameAr) {
      return NextResponse.json(
        { error: "Name and Arabic name are required" },
        { status: 400 }
      );
    }

    const category = await prisma.category.update({
      where: { id: params.id },
      data: {
        name,
        nameAr
      }
    });

    return NextResponse.json(category);
  } catch (error) {
    console.error("Error updating category:", error);
    return NextResponse.json(
      { error: "Failed to update category" },
      { status: 500 }
    );
  }
}

// DELETE - حذف تصنيف (للأدمن فقط)
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const adminCheck = await requireAdminAccess();
    if (!adminCheck.ok) {
      return adminCheck.response;
    }

    // التحقق من عدم وجود منتجات مرتبطة بهذا التصنيف
    const productsCount = await prisma.product.count({
      where: { category: params.id }
    });

    if (productsCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete category. ${productsCount} products are using this category.` },
        { status: 400 }
      );
    }

    await prisma.category.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json(
      { error: "Failed to delete category" },
      { status: 500 }
    );
  }
}
