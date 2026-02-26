import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { sendOrderNotification } from "@/lib/email";

interface OrderItemInput {
  id: string;
  name: string;
  size: string;
  quantity: number;
  price: number;
  image?: string;
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json();

    const items: OrderItemInput[] = Array.isArray(body?.items) ? body.items : [];
    const notes = typeof body?.notes === "string" ? body.notes.trim() : "";

    if (!items.length) {
      return NextResponse.json({ error: "لا توجد عناصر" }, { status: 400 });
    }

    // التحقق من صحة الكميات والأسعار والمنتجات
    const normalizedItems = [];
    for (const item of items) {
      const quantity = Number(item.quantity) || 0;
      const price = Number(item.price) || 0;

      // التحقق من صحة الكمية
      if (!Number.isInteger(quantity) || quantity <= 0 || quantity > 9999) {
        return NextResponse.json(
          { error: `كمية غير صحيحة للمنتج: ${item.name}` },
          { status: 400 }
        );
      }

      // التحقق من صحة السعر
      if (!Number.isFinite(price) || price < 0 || price > 999999) {
        return NextResponse.json(
          { error: `سعر غير صحيح للمنتج: ${item.name}` },
          { status: 400 }
        );
      }

      // تحقق من وجود المنتج في قاعدة البيانات والتحقق من السعر
      const dbProduct = await prisma.product.findUnique({
        where: { id: String(item.id) },
        select: { id: true, name: true, price: true, sizes: true, inStock: true },
      });

      if (!dbProduct) {
        return NextResponse.json(
          { error: `المنتج غير موجود: ${item.id}` },
          { status: 400 }
        );
      }

      if (!dbProduct.inStock) {
        return NextResponse.json(
          { error: `المنتج غير متوفر: ${dbProduct.name}` },
          { status: 400 }
        );
      }

      // التحقق من السعر الصحيح
      let correctPrice = dbProduct.price;
      if (typeof dbProduct.sizes === "string") {
        try {
          const sizes = JSON.parse(dbProduct.sizes);
          const size = String(item.size);
          if (sizes[size] && sizes[size].price) {
            correctPrice = sizes[size].price;
          }
        } catch (e) {
          // استخدم السعر الأساسي
        }
      }

      // تحقق من تطابق السعر (السماح بـ ±0.01 بسبب التقريب)
      if (Math.abs(price - correctPrice) > 0.01) {
        return NextResponse.json(
          { error: `سعر غير متطابق للمنتج: ${dbProduct.name}` },
          { status: 400 }
        );
      }

      normalizedItems.push({
        productId: String(item.id),
        name: dbProduct.name,
        size: String(item.size),
        quantity,
        price: correctPrice,
        image: typeof item.image === "string" ? item.image : undefined,
      });
    }

    if (!normalizedItems.length) {
      return NextResponse.json({ error: "عناصر غير صحيحة" }, { status: 400 });
    }

    const total = normalizedItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    let shippingName = "";
    let shippingPhone = "";
    let shippingCity = "";
    let shippingAddress = "";
    let email: string | null = null;
    let userId: string | null = null;

    if (session?.user) {
      const sessionUser = session.user as { id?: string; email?: string | null };
      if (sessionUser.id) {
        userId = sessionUser.id;
        const user = await prisma.user.findUnique({
          where: { id: sessionUser.id },
        });
        if (!user || !user.name || !user.phone || !user.city || !user.address) {
          return NextResponse.json(
            { error: "Missing profile data" },
            { status: 400 }
          );
        }
        shippingName = user.name;
        shippingPhone = user.phone;
        shippingCity = user.city;
        shippingAddress = user.address;
        email = user.email ?? sessionUser.email ?? null;
      }
    }

    if (!userId) {
      shippingName = typeof body?.name === "string" ? body.name.trim() : "";
      shippingPhone = typeof body?.phone === "string" ? body.phone.trim() : "";
      shippingCity = typeof body?.city === "string" ? body.city.trim() : "";
      shippingAddress = typeof body?.address === "string" ? body.address.trim() : "";
      email = typeof body?.email === "string" ? body.email.trim() : null;

      if (!shippingName || !shippingPhone || !shippingCity || !shippingAddress) {
        return NextResponse.json(
          { error: "بيانات الشحن غير كاملة" },
          { status: 400 }
        );
      }

      // التحقق من صيغة البريد الإلكتروني
      if (email && !email.includes("@")) {
        return NextResponse.json(
          { error: "بريد إلكتروني غير صحيح" },
          { status: 400 }
        );
      }

      // التحقق من صيغة الهاتف
      if (shippingPhone && !/^[0-9\-\+\s]{7,}$/.test(shippingPhone)) {
        return NextResponse.json(
          { error: "رقم هاتف غير صحيح" },
          { status: 400 }
        );
      }
    }

    const order = await prisma.order.create({
      data: {
        userId,
        total,
        shippingName,
        shippingPhone,
        shippingCity,
        shippingAddress,
        shippingNotes: notes || null,
        email,
        items: {
          create: normalizedItems.map((item) => ({
            productId: item.productId,
            name: item.name,
            size: item.size,
            quantity: item.quantity,
            price: item.price,
            total: item.price * item.quantity,
            image: item.image || null,
          })),
        },
      },
    });

    // إرسال إشعار الطلب (بدون بيانات حساسة)
    try {
      console.log("📧 Sending order notification");
      await sendOrderNotification(email, {
        id: order.id,
        total,
        items: normalizedItems.map(item => ({
          id: item.productId,
          name: item.name,
          size: item.size,
          quantity: item.quantity,
          price: item.price
          // لا ترسل الصورة في الإيميل
        })),
        createdAt: order.createdAt,
      });
      console.log("✅ Order notification sent successfully");
    } catch (emailError) {
      console.error("❌ Failed to send order notification:", emailError);
      // لا نرجع خطأ، الطلب تم إنشاؤه بنجاح حتى لو فشل الإيميل
    }

    return NextResponse.json({ ok: true, orderId: order.id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
