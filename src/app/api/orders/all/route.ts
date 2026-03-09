import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { decryptData } from "@/lib/encryption";
import { requireAdminAccess } from "@/lib/adminAuth";

export async function GET() {
  try {
    const adminCheck = await requireAdminAccess();
    if (!adminCheck.ok) {
      return adminCheck.response;
    }

    const orders = await prisma.order.findMany({
      include: {
        items: true,
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const safeOrders = orders.map((order) => ({
      ...order,
      shippingCity: order.shippingCity ? decryptData(order.shippingCity) : order.shippingCity,
      shippingAddress: order.shippingAddress ? decryptData(order.shippingAddress) : order.shippingAddress,
    }));

    return NextResponse.json({ orders: safeOrders }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
