import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendStockRequestNotification } from "@/lib/email";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const prismaClient = prisma as any;
    const { whatsapp } = await req.json();
    const normalizedWhatsapp = typeof whatsapp === "string" ? whatsapp.trim() : "";
    const whatsappDigits = normalizedWhatsapp.replace(/\D/g, "").length;

    if (!normalizedWhatsapp || whatsappDigits < 10) {
      return NextResponse.json(
        { error: "رقم الواتساب يجب أن يحتوي على 10 أرقام على الأقل" },
        { status: 400 }
      );
    }

    const product = await prisma.product.findUnique({
      where: { id: params.id },
      select: { name: true, inStock: true },
    });

    if (!product) {
      return NextResponse.json({ error: "المنتج غير موجود" }, { status: 404 });
    }

    // Prevent duplicate un-notified requests for same product + number
    const existing = await prismaClient.stockNotification.findFirst({
      where: {
        productId: params.id,
        whatsapp: normalizedWhatsapp,
        notified: false,
      },
    });

    if (existing) {
      return NextResponse.json(
        { message: "تم تسجيل طلبك مسبقاً، سنخبرك عند التوفر" },
        { status: 200 }
      );
    }

    const notification = await prismaClient.stockNotification.create({
      data: {
        productId: params.id,
        productName: product.name,
        whatsapp: normalizedWhatsapp,
      },
    });

    try {
      await sendStockRequestNotification({
        productId: params.id,
        productName: product.name,
        whatsapp: normalizedWhatsapp,
        requestedAt: notification.createdAt,
      });
    } catch (emailError) {
      console.error("Failed to send stock request notification email:", emailError);
      // لا نرجع خطأ للمستخدم: الطلب تم حفظه بنجاح
    }

    return NextResponse.json(
      { message: "تم تسجيل طلب التذكير الخاص بك" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Stock notify error:", error);
    return NextResponse.json(
      { error: "حدث خطأ، حاول مرة أخرى" },
      { status: 500 }
    );
  }
}
