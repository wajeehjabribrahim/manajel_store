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
      return NextResponse.json({ error: "No items" }, { status: 400 });
    }

    const normalizedItems = items
      .map((item) => ({
        productId: String(item.id),
        name: String(item.name),
        size: String(item.size),
        quantity: Number(item.quantity) || 0,
        price: Number(item.price) || 0,
        image: typeof item.image === "string" ? item.image : undefined,
      }))
      .filter((item) => item.quantity > 0 && item.price >= 0);

    if (!normalizedItems.length) {
      return NextResponse.json({ error: "Invalid items" }, { status: 400 });
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
          { error: "Missing delivery data" },
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

    // إرسال إيميل الطلب (للأدمن دائماً)
    try {
      console.log("📧 Sending order email to:", email ?? "(no customer email)");
      await sendOrderNotification(email, {
        id: order.id,
        total,
        items: normalizedItems,
        createdAt: order.createdAt,
      });
      console.log("✅ Order email sent successfully");
    } catch (emailError) {
      console.error("❌ Failed to send order email:", emailError);
      // لا نرجع خطأ، الطلب تم إنشاؤه بنجاح حتى لو فشل الإيميل
    }

    return NextResponse.json({ ok: true, orderId: order.id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
