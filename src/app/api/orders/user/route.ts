import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { decryptData } from "@/lib/encryption";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sessionUser = session.user as { id?: string };
    if (!sessionUser.id) {
      return NextResponse.json({ error: "User ID not found" }, { status: 400 });
    }

    const orders = await prisma.order.findMany({
      where: { userId: sessionUser.id },
      include: {
        items: true,
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
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
