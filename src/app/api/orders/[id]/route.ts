import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { verifyGuestOrderToken } from "@/lib/guestOrderToken";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const orderId = params.id;

    if (!orderId) {
      return NextResponse.json({ error: "Order ID required" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const sessionUser = session?.user as { id?: string; role?: string } | undefined;
    const isAdmin = sessionUser?.role === "admin";

    // Authenticated user order: owner or admin only
    if (order.userId) {
      if (!isAdmin && (!sessionUser?.id || sessionUser.id !== order.userId)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
    } else {
      // Guest order: require secure guest token unless admin
      if (!isAdmin) {
        const { searchParams } = new URL(req.url);
        const guestToken = searchParams.get("guestToken") || "";
        const isValidToken = verifyGuestOrderToken(orderId, guestToken);

        if (!isValidToken) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }
      }
    }

    return NextResponse.json({ order }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const isAdmin = (session?.user as { role?: string } | undefined)?.role === "admin";
    
    if (!session || !isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orderId = params.id;
    if (!orderId) {
      return NextResponse.json({ error: "Order ID required" }, { status: 400 });
    }

    const body = await req.json();
    const status = typeof body?.status === "string" ? body.status.trim() : "";

    const validStatuses = ["pending", "processing", "shipped", "delivered", "cancelled"];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const order = await prisma.order.update({
      where: { id: orderId },
      data: { status },
      include: {
        items: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({ order }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
