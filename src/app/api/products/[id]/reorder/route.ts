import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();
    const { direction } = body;

    if (!direction || !["up", "down"].includes(direction)) {
      return NextResponse.json(
        { error: "Invalid direction. Must be 'up' or 'down'" },
        { status: 400 }
      );
    }

    // الحصول على المنتج الحالي
    const currentProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!currentProduct) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    // الحصول على جميع المنتجات مرتبة
    const allProducts = await prisma.product.findMany({
      orderBy: { displayOrder: "asc" },
    });

    const currentIndex = allProducts.findIndex((p) => p.id === id);
    if (currentIndex === -1) {
      return NextResponse.json(
        { error: "Product not found in list" },
        { status: 404 }
      );
    }

    // تحديد المنتج المستهدف للتبديل
    let targetIndex = -1;
    if (direction === "up" && currentIndex > 0) {
      targetIndex = currentIndex - 1;
    } else if (direction === "down" && currentIndex < allProducts.length - 1) {
      targetIndex = currentIndex + 1;
    }

    // إذا لم يكن هناك تبديل ممكن (في البداية أو النهاية)
    if (targetIndex === -1) {
      return NextResponse.json({
        message: "Cannot move product in this direction",
        product: currentProduct,
      });
    }

    const targetProduct = allProducts[targetIndex];

    // تبديل قيم displayOrder
    const currentOrder = currentProduct.displayOrder;
    const targetOrder = targetProduct.displayOrder;

    await prisma.$transaction([
      prisma.product.update({
        where: { id: currentProduct.id },
        data: { displayOrder: targetOrder },
      }),
      prisma.product.update({
        where: { id: targetProduct.id },
        data: { displayOrder: currentOrder },
      }),
    ]);

    // الحصول على المنتج المحدث
    const updatedProduct = await prisma.product.findUnique({
      where: { id },
    });

    return NextResponse.json({
      message: "Product order updated successfully",
      product: updatedProduct,
    });
  } catch (error) {
    console.error("Error reordering product:", error);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
