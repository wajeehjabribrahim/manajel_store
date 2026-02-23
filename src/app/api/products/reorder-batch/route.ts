import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { products } = body;

    if (!Array.isArray(products) || products.length === 0) {
      return NextResponse.json(
        { error: "Invalid products array" },
        { status: 400 }
      );
    }

    // تحديث displayOrder لكل منتج
    const updates = products.map((item: { id: string; displayOrder: number }) =>
      prisma.product.update({
        where: { id: item.id },
        data: { displayOrder: item.displayOrder },
      })
    );

    await prisma.$transaction(updates);

    return NextResponse.json({
      message: "Products reordered successfully",
      count: products.length,
    });
  } catch (error) {
    console.error("Error batch reordering products:", error);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
